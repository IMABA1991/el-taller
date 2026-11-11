// Motor del juego "El Taller". Lógica pura: no toca la pantalla ni el guardado.
import {
  HORAS_POR_SEMANA, SEMANAS_POR_ANIO, MESES, MAQUINAS, PRODUCTOS, FECHAS_ESPECIALES, RAMPA_FECHA,
  PRESTAMO, GASTOS_FIJOS, VENTAS, REPUTACION, PRIMO, CURSOS, CURSO_MAX_PUNTOS, CURSO_BAJA_POR_MES, MAZO, TUTORIAL, PROMO, CLIENTES,
  MAZO_FERIA, PROB_CARTA_FERIA, MERMA, CANSANCIO, PUESTOS, RASGOS, NOMBRES_EMPLEADOS, EQUIPO, CAPACITACION,
  LELO_EMPLEADO, CHUCHU, NOMBRES_FEMENINOS,
} from './data.js';

export const VERSION_PARTIDA = 2;

// ---------- Azar con semilla (para poder guardar y reproducir partidas) ----------
function siguienteAzar(estado) {
  let t = (estado.semilla = (estado.semilla + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entre = (e, min, max) => min + siguienteAzar(e) * (max - min);
const enteroEntre = (e, min, max) => Math.floor(entre(e, min, max + 1));
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
const redondear = (v, dec = 2) => Math.round(v * 10 ** dec) / 10 ** dec;

// ---------- Calendario ----------
export function calendario(semana) {
  const enAnio = ((semana - 1) % SEMANAS_POR_ANIO) + 1;
  const anio = Math.floor((semana - 1) / SEMANAS_POR_ANIO) + 1;
  let acumulado = 0;
  for (let m = 0; m < MESES.length; m++) {
    if (enAnio <= acumulado + MESES[m].semanas) {
      const semanaDelMes = enAnio - acumulado;
      return {
        anio, mes: m, nombreMes: MESES[m].nombre, estacion: MESES[m].estacion,
        semanaDelMes, semanaEnAnio: enAnio,
        finDeMes: semanaDelMes === MESES[m].semanas,
      };
    }
    acumulado += MESES[m].semanas;
  }
  throw new Error('Semana fuera de calendario');
}

function semanaPico(f) {
  return MESES.slice(0, f.mes).reduce((s, m) => s + m.semanas, 0) + f.semana;
}

// Fecha especial que se viene (o es esta semana): { fecha, faltan } con faltan entre 0 y 3.
export function fechaProxima(semana) {
  const enAnio = calendario(semana).semanaEnAnio;
  for (const f of FECHAS_ESPECIALES) {
    const faltan = semanaPico(f) - enAnio;
    if (faltan >= 0 && faltan <= 3) return { fecha: f, faltan };
  }
  return null;
}

export function multiplicadorFecha(semana, idProducto) {
  const p = fechaProxima(semana);
  const efecto = p?.fecha.efecto[idProducto];
  if (!efecto) return 1;
  return 1 + (efecto - 1) * RAMPA_FECHA[p.faltan];
}

// Pista sin números para el jugador.
export function avisoFecha(semana) {
  const p = fechaProxima(semana);
  if (!p) return null;
  const n = p.fecha.nombre;
  if (p.faltan === 3) return `Se viene ${n}: la gente empieza a pedir más, ya están buscando regalos.`;
  if (p.faltan === 2) return `Faltan 2 semanas para ${n}: cada vez más gente busca regalos.`;
  if (p.faltan === 1) return `Falta 1 semana para ${n}: hay mucha gente buscando regalos.`;
  return `¡Esta semana termina con ${n}! Es la última para comprar regalos: hay muchísima gente buscando.`;
}

// ---------- Fórmulas ----------
// Demanda escalonada: 0-50 +10% cada 10 puntos, 50-75 +25%, 75-100 +50% (hasta x3,375).
export function multiplicadorReputacion(rep) {
  const r = limitar(rep, 0, 100);
  if (r <= 50) return 1 + r * 0.01;
  if (r <= 75) return 1.5 + (r - 50) * 0.025;
  return 2.125 + (r - 75) * 0.05;
}

export function multiplicadorProducto(rep, sens) {
  return 1 + (multiplicadorReputacion(rep) - 1) * sens;
}

export function formacionTotal(e) {
  const c = e.formacion.cursos;
  return limitar(e.formacion.fija + c.sublimacion + c.redes + c.ventas, 0, 100);
}

// Pone al día partidas guardadas con versiones anteriores del juego.
export function migrarPartida(e) {
  if (!e.formacion.cursos) {
    e.formacion.cursos = { sublimacion: e.formacion.actualizacion || 0, redes: 0, ventas: 0 };
    delete e.formacion.actualizacion;
  }
  if (e.curso.id === undefined) e.curso.id = e.curso.semanasRestantes > 0 ? 'sublimacion' : null;
  if (!e.mazoFeria) e.mazoFeria = [];
  if (!e.equipo) {
    e.equipo = equipoVacio();
    if (e.mejorDeLaCiudad) sumarLelo(e);
  }
  e.version = VERSION_PARTIDA;
  return e;
}

export function horasPorUnidad(e, idProducto) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - e.exp * 0.016);
}

// Curso de redes: cada punto hace que la publicidad rinda un 1% más.
export function horasPorVenta(e) {
  return VENTAS.horasPorVentaRedes * (1 - e.exp / 200) * (1 - e.formacion.cursos.redes / 100);
}

// Curso de sublimación: 10 puntos bajan los errores un 12,5% (40 puntos, a la mitad).
export function probabilidadError(e) {
  const f = e.formacion;
  return limitar(0.04 * (1 - e.exp / 125) * (1 + e.cansancio / 40) * (1 - f.fija / 200) * (1 - f.cursos.sublimacion / 80), 0.005, 0.5);
}

export function probabilidadErrorEmpleado(emp) {
  const variante = emp.esLelo ? 1 : PUESTOS[emp.puesto].variantes[emp.variante].errores ?? 1;
  const rasgo = emp.rasgo === 'prolijo' ? 0.5 : emp.rasgo === 'distraido' ? 1.5 : 1;
  return limitar(0.04 * (1 - emp.exp / 125) * variante * rasgo, 0.005, 0.5);
}

// Curso de ventas: 10 puntos venden un 25% más en la feria.
export function multiplicadorFeria(e) {
  return (1 + (multiplicadorReputacion(e.rep) - 1) * 0.5) * (1 + e.formacion.cursos.ventas / 40);
}

export function stockTotal(e) {
  return Object.values(e.stock).reduce((s, x) => s + x, 0);
}

export function luzDelMes(e) {
  return GASTOS_FIJOS.luz + Object.keys(e.maquinas).filter((m) => e.maquinas[m])
    .reduce((s, m) => s + MAQUINAS[m].luzExtra, 0);
}

export function gastosFijosDelMes(e) {
  return luzDelMes(e) + GASTOS_FIJOS.internet + GASTOS_FIJOS.publicidad;
}

export function costoPagoAnticipadoA(semana) {
  const s = Math.min(semana, PRESTAMO.A.semanaVence);
  return Math.round(PRESTAMO.monto + PRESTAMO.A.interes * (s / PRESTAMO.A.semanaVence));
}

// Demanda esperada por producto (sin azar), para mostrar pistas al jugador.
export function demandaEsperada(e, idProducto, semana = e.semana) {
  const p = PRODUCTOS[idProducto];
  if (!e.maquinas[p.maquina]) return 0;
  const c = calendario(semana);
  const temporada = p.temporada[c.estacion] ?? 1;
  const especial = multiplicadorFecha(semana, idProducto);
  const ml = e.rep >= VENTAS.reputacionMercadoLibre ? 1 + VENTAS.extraMercadoLibre : 1;
  return p.base * multiplicadorProducto(e.rep, p.sens) * temporada * especial * ml;
}

// ---------- Equipo: empleados, contratación y capacitación ----------
const FALTAS = [
  'dice que se le murió la abuela (es la tercera abuela este año)',
  'dice que se intoxicó con un choripán de la cancha',
  'se quedó dormido el lunes y no vino más en toda la semana',
  'tuvo "un tema familiar" que nadie entendió',
  'se fue a un recital y volvió sin voz y sin ganas',
];

function equipoVacio() {
  return {
    empleados: [], mercado: 1, siguienteId: 1,
    bolsa: null, // { semana, candidatos }
    chuchu: { afueraHasta: 0, excusa: null, candidato: null, llamadoSemana: 0 },
    anuncio: null, // { puesto, sueldo, semana, candidato }
  };
}

export function mediaSueldo(e, puesto, variante) {
  return Math.round((PUESTOS[puesto].variantes[variante].sueldo * e.equipo.mercado) / 1000) * 1000;
}

export function cupoEquipo() {
  return EQUIPO.cupoCiudad;
}

export function empleadosContratados(e) {
  return e.equipo.empleados.filter((x) => !x.esLelo).length;
}

export function chuchuDisponible(e) {
  return e.semana >= e.equipo.chuchu.afueraHasta;
}

function nombreLibre(e) {
  const usados = new Set(e.equipo.empleados.map((x) => x.nombre));
  const libres = NOMBRES_EMPLEADOS.filter((n) => !usados.has(n));
  const lista = libres.length ? libres : NOMBRES_EMPLEADOS;
  return lista[Math.floor(siguienteAzar(e) * lista.length)];
}

function sortearRasgo(e, puesto, probMalo = 0.5) {
  const lista = PUESTOS[puesto].rasgos;
  const buenos = lista.filter((r) => RASGOS[r].bueno);
  const malos = lista.filter((r) => !RASGOS[r].bueno);
  const grupo = siguienteAzar(e) < probMalo ? malos : buenos;
  return grupo[Math.floor(siguienteAzar(e) * grupo.length)];
}

function productosPosibles(e) {
  const conMaquina = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  return conMaquina.length >= 2 ? conMaquina : Object.keys(PRODUCTOS);
}

function crearCandidato(e, puesto, variante, { origen, sueldo, probMalo = 0.5, rasgoVisible }) {
  const v = PUESTOS[puesto].variantes[variante];
  const c = {
    nombre: nombreLibre(e), puesto, variante, origen,
    sueldo: sueldo ?? mediaSueldo(e, puesto, variante),
    exp: limitar(Math.round(v.exp + entre(e, -5, 5)), 0, 100),
    rasgo: sortearRasgo(e, puesto, probMalo),
    rasgoVisible,
  };
  if (puesto === 'vendedor') {
    const ids = mezclar(e, [...productosPosibles(e)]);
    c.fuerte = ids[0];
    c.descuidado = ids[1];
  }
  return c;
}

function varianteAlAzar(e, puesto) {
  const ids = Object.keys(PUESTOS[puesto].variantes);
  const t = siguienteAzar(e);
  return t < 0.5 ? ids[0] : t < 0.85 ? ids[1] : ids[2];
}

// Bolsa de trabajo del municipio: cuesta horas del domingo, ves todo y cobran más.
export function irALaBolsa(e) {
  if (e.semanaEnCurso) return { ok: false, motivo: 'A la bolsa se va el domingo, antes de arrancar la semana.' };
  if (e.equipo.bolsa?.semana === e.semana) return { ok: true };
  const candidatos = [];
  const puestos = mezclar(e, ['operario', 'vendedor', siguienteAzar(e) < 0.6 ? 'operario' : 'vendedor']);
  for (const puesto of puestos) {
    const variante = varianteAlAzar(e, puesto);
    const sueldo = Math.round((mediaSueldo(e, puesto, variante) * (1 + EQUIPO.bolsa.recargo)) / 1000) * 1000;
    candidatos.push(crearCandidato(e, puesto, variante, { origen: 'bolsa', sueldo, rasgoVisible: true }));
  }
  e.equipo.bolsa = { semana: e.semana, candidatos };
  return { ok: true };
}

export function fuisteALaBolsa(e) {
  return e.equipo.bolsa?.semana === e.semana;
}

// Chuchu: te recomienda a alguien de confianza, más barato, sin decirte cómo es... y se va un mes.
export function llamarAChuchu(e, puesto) {
  const ch = e.equipo.chuchu;
  if (e.semanaEnCurso) return { ok: false, motivo: 'A Chuchu lo llamás el domingo.' };
  if (!chuchuDisponible(e)) return { ok: false, motivo: `Chuchu no está: ${ch.excusa}. Vuelve en ${ch.afueraHasta - e.semana} semana(s).` };
  if (ch.llamadoSemana === e.semana) return { ok: false, motivo: 'Ya hablaste con Chuchu esta semana.' };
  if (!PUESTOS[puesto]) return { ok: false, motivo: 'Ese puesto no existe.' };
  const variante = varianteAlAzar(e, puesto);
  const sueldo = Math.round((mediaSueldo(e, puesto, variante) * (1 - EQUIPO.chuchu.descuento)) / 1000) * 1000;
  ch.candidato = crearCandidato(e, puesto, variante, { origen: 'chuchu', sueldo, rasgoVisible: false });
  ch.candidato.frase = CHUCHU.recomienda[Math.floor(siguienteAzar(e) * CHUCHU.recomienda.length)];
  ch.llamadoSemana = e.semana;
  return { ok: true };
}

// Anuncio: elegís el puesto y el sueldo; el domingo siguiente aparece alguien que acepta ese sueldo.
// Cuanto más ofrecés frente a la media, mejor viene (más experiencia y menos rasgos malos).
export function publicarAnuncio(e, puesto, sueldo) {
  if (e.semanaEnCurso) return { ok: false, motivo: 'El anuncio se publica el domingo.' };
  if (e.equipo.anuncio) return { ok: false, motivo: 'Ya tenés un anuncio publicado.' };
  if (!PUESTOS[puesto]) return { ok: false, motivo: 'Ese puesto no existe.' };
  if (!(sueldo > 0)) return { ok: false, motivo: 'Poné un sueldo.' };
  if (e.plata < EQUIPO.anuncio.costo) return { ok: false, motivo: `El anuncio cuesta $${fmt(EQUIPO.anuncio.costo)}.` };
  e.plata -= EQUIPO.anuncio.costo;
  e.finanzas.mesActual -= EQUIPO.anuncio.costo;
  e.equipo.anuncio = { puesto, sueldo, semana: e.semana, candidato: null };
  return { ok: true, mensaje: `Publicaste el anuncio ($${fmt(EQUIPO.anuncio.costo)}). El domingo que viene alguien se presenta.` };
}

function candidatoDelAnuncio(e, a) {
  const vars = Object.keys(PUESTOS[a.puesto].variantes);
  let variante = vars[0];
  for (const v of vars) if (a.sueldo >= mediaSueldo(e, a.puesto, v)) variante = v;
  const exceso = a.sueldo / mediaSueldo(e, a.puesto, variante) - 1;
  const probMalo = limitar(0.5 - exceso * 1.5, 0.2, 0.8);
  const c = crearCandidato(e, a.puesto, variante, { origen: 'anuncio', sueldo: a.sueldo, probMalo, rasgoVisible: false });
  if (exceso < 0) c.exp = limitar(Math.round(c.exp * (1 + exceso)), 0, 100); // pagás menos que la media: viene más verde
  return c;
}

export function rechazarChuchu(e) {
  e.equipo.chuchu.candidato = null;
}

export function descartarAnuncio(e) {
  e.equipo.anuncio = null;
}

function candidatoPorOrigen(e, origen, indice) {
  if (origen === 'bolsa') return fuisteALaBolsa(e) ? e.equipo.bolsa.candidatos[indice] : null;
  if (origen === 'chuchu') return e.equipo.chuchu.candidato;
  if (origen === 'anuncio') return e.equipo.anuncio?.candidato;
  return null;
}

export function contratar(e, origen, indice = 0) {
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se contrata el domingo.' };
  const c = candidatoPorOrigen(e, origen, indice);
  if (!c) return { ok: false, motivo: 'Ese candidato ya no está.' };
  if (empleadosContratados(e) >= cupoEquipo(e)) return { ok: false, motivo: `En la ciudad podés tener hasta ${cupoEquipo(e)} empleados (además de Lelo).` };
  const emp = {
    ...c, id: `emp${e.equipo.siguienteId++}`, desde: e.semana, semanasMes: 0, capacitadoMes: false,
    desganado: false, pideAumento: null, falta: false, semanasTrabajadas: 0,
    proximaQueja: e.semana + EQUIPO.mesesQuejoso * 4 + 2, leal: origen === 'chuchu',
  };
  delete emp.frase;
  e.equipo.empleados.push(emp);
  let mensaje = `Contrataste a ${emp.nombre} (${PUESTOS[emp.puesto].variantes[emp.variante].nombre.toLowerCase()}, ${plata$(emp.sueldo)} por mes). Arranca esta semana.`;
  if (origen === 'bolsa') e.equipo.bolsa.candidatos.splice(indice, 1);
  if (origen === 'anuncio') e.equipo.anuncio = null;
  if (origen === 'chuchu') {
    const ch = e.equipo.chuchu;
    ch.candidato = null;
    ch.excusa = CHUCHU.excusas[Math.floor(siguienteAzar(e) * CHUCHU.excusas.length)].texto;
    ch.afueraHasta = e.semana + EQUIPO.chuchu.semanasAfuera;
    mensaje += ` Chuchu: "¡Menos mal que me agarrachte justo! Te cuento que ${ch.excusa}. ¡Nos vemos!"`;
  }
  return { ok: true, mensaje };
}

function plata$(n) {
  return `$${fmt(n)}`;
}

function semanasDelMes(semana) {
  return MESES[calendario(semana).mes].semanas;
}

export function costoDespido(e, emp) {
  return Math.round(emp.sueldo * EQUIPO.despido + (emp.sueldo * emp.semanasMes) / semanasDelMes(e.semana));
}

export function despedir(e, id) {
  const emp = e.equipo.empleados.find((x) => x.id === id);
  if (!emp) return { ok: false, motivo: 'No está en tu equipo.' };
  if (emp.esLelo) return { ok: false, motivo: 'Es tu primo: el tío no te lo perdonaría nunca.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se despide el domingo.' };
  const costo = costoDespido(e, emp);
  e.plata -= costo;
  e.finanzas.mesActual -= costo;
  e.equipo.empleados = e.equipo.empleados.filter((x) => x !== emp);
  return { ok: true, mensaje: `Despediste a ${emp.nombre}. Entre lo trabajado y la indemnización pagaste ${plata$(costo)}.` };
}

export function responderAumento(e, id, acepta) {
  const emp = e.equipo.empleados.find((x) => x.id === id);
  if (!emp?.pideAumento) return { ok: false, motivo: 'No pidió aumento.' };
  if (acepta) {
    emp.sueldo = emp.pideAumento;
    emp.desganado = false;
    emp.pideAumento = null;
    return { ok: true, mensaje: `Le diste el aumento a ${emp.nombre}: ahora cobra ${plata$(emp.sueldo)}. Volvió con todo.` };
  }
  emp.pideAumento = null;
  emp.desganado = true;
  return { ok: true, mensaje: `Le dijiste que no a ${emp.nombre}. Va a trabajar con menos ganas hasta que le des un aumento.` };
}

export function darAumento(e, id) {
  const emp = e.equipo.empleados.find((x) => x.id === id);
  if (!emp) return { ok: false, motivo: 'No está en tu equipo.' };
  emp.pideAumento = Math.round((emp.sueldo * (1 + EQUIPO.aumentoQuejoso)) / 1000) * 1000;
  return responderAumento(e, id, true);
}

// Horas que pone cada empleado esta semana (0 si falta).
export function horasEmpleado(e, emp, sem = e.semanaEnCurso) {
  if (emp.falta) return 0;
  let h = emp.esLelo ? LELO_EMPLEADO.horas : PUESTOS[emp.puesto].horas;
  if (emp.rasgo === 'rapido') h *= 1.2;
  if (emp.rasgo === 'creativo') h *= 0.9;
  if (emp.desganado) h *= EQUIPO.desganoQuejoso;
  if (sem?.capacitacion === 'curso') h -= CAPACITACION.curso.horas;
  if (sem?.feriaVendedor === emp.id) h -= VENTAS.feria.horas;
  return Math.max(0, redondear(h, 1));
}

export function presentes(e, puesto) {
  return e.equipo.empleados.filter((x) => !x.falta && (!puesto || x.puesto === puesto));
}

function horasPorUnidadExp(exp, idProducto) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - exp * 0.016);
}

function horasPorVentaExp(exp, cursoRedes = 0) {
  return VENTAS.horasPorVentaRedes * (1 - exp / 200) * (1 - cursoRedes / 100);
}

// Reparte la producción: primero los operarios (con sus horas), lo que no les entra lo hacés vos.
export function repartirProduccion(e, producir, sem = e.semanaEnCurso) {
  const operarios = presentes(e, 'operario').map((emp) => ({ emp, libres: horasEmpleado(e, emp, sem), unidades: {}, horas: 0 }));
  const vos = { unidades: {}, horas: 0 };
  for (const [id, n] of Object.entries(producir || {})) {
    for (let i = 0; i < (n || 0); i++) {
      const o = operarios.find((x) => x.libres + 1e-9 >= horasPorUnidadExp(x.emp.exp, id));
      if (o) {
        const h = horasPorUnidadExp(o.emp.exp, id);
        o.libres -= h; o.horas += h; o.unidades[id] = (o.unidades[id] || 0) + 1;
      } else {
        vos.horas += horasPorUnidad(e, id);
        vos.unidades[id] = (vos.unidades[id] || 0) + 1;
      }
    }
  }
  return { operarios, vos };
}

export function capacidadEquipo(e, sem = e.semanaEnCurso) {
  const produccion = presentes(e, 'operario').reduce((s, x) => s + horasEmpleado(e, x, sem), 0);
  const redes = presentes(e, 'vendedor').reduce((s, x) => s + horasEmpleado(e, x, sem), 0);
  return { produccion: redondear(produccion, 1), redes: redondear(redes, 1) };
}

// Tipos de producto que se usan para enseñar cuando capacitás vos (60-70% de los que tenés en stock).
export function productosParaEnsenar(e) {
  const tipos = Object.keys(e.stock).filter((id) => e.stock[id] > 0);
  if (!tipos.length) return [];
  return tipos.slice(0, Math.max(1, Math.round(tipos.length * CAPACITACION.vos.partePorTipos)));
}

export function costoCapacitacion(e, tipo) {
  if (tipo === 'curso') return presentes(e).length * CAPACITACION.curso.costoPorEmpleado;
  if (tipo === 'vos') return CAPACITACION.vos.buffet;
  return 0;
}

function capacitar(e, tipo, enDia) {
  const lista = presentes(e);
  if (tipo === 'curso') {
    for (const emp of lista) { emp.exp = limitar(emp.exp + CAPACITACION.curso.puntos, 0, 100); emp.capacitadoMes = true; }
    enDia(1, `🎓 Mandaste al equipo a un curso: +${CAPACITACION.curso.puntos} de experiencia a cada uno (les sacó ${CAPACITACION.curso.horas} h esta semana).`, 'buena');
  } else if (tipo === 'vos') {
    const usados = productosParaEnsenar(e);
    usados.forEach((id) => { e.stock[id]--; });
    for (const emp of lista) {
      if (emp.exp < e.exp) emp.exp = Math.min(e.exp, emp.exp + CAPACITACION.vos.puntos);
      emp.capacitadoMes = true;
    }
    enDia(1, `🥐 Capacitaste vos al equipo con facturas y mate. Usaste ${usados.map((id) => `una ${PRODUCTOS[id].singular}`).join(' y ')} para enseñar (+${CAPACITACION.vos.puntos}, sin pasar tu nivel).`, 'buena');
  }
}

// Al empezar cada semana: quién falta, si llegó el candidato del anuncio y si volvió Chuchu.
function inicioDeSemana(e, evento) {
  for (const emp of e.equipo.empleados) {
    emp.falta = emp.rasgo === 'faltador' && siguienteAzar(e) < EQUIPO.probFalta;
    if (emp.falta) emp.motivoFalta = FALTAS[Math.floor(siguienteAzar(e) * FALTAS.length)];
  }
  const a = e.equipo.anuncio;
  if (a && !a.candidato && e.semana > a.semana) {
    a.candidato = candidatoDelAnuncio(e, a);
    evento?.(`📰 Alguien respondió tu anuncio de ${PUESTOS[a.puesto].nombre.toLowerCase()}: te espera el domingo.`, 'buena');
  }
  const ch = e.equipo.chuchu;
  if (ch.excusa && e.semana === ch.afueraHasta) {
    evento?.('🚂 Volvió Chuchu: "¡Chalú! ¿Me extrañachte? Chi necechitás a alguien, ya chabés."', 'info');
    ch.excusa = null;
  }
  ch.candidato = ch.llamadoSemana === e.semana ? ch.candidato : null;
}

// Cierre de mes del equipo: sueldos, olvido, quejas y media del mercado.
function cierreEquipo(e, r, evento) {
  const emps = e.equipo.empleados;
  if (emps.length) {
    let total = 0;
    const semanas = semanasDelMes(e.semana);
    for (const emp of emps) total += Math.round((emp.sueldo * emp.semanasMes) / semanas);
    if (total > 0) {
      e.plata -= total;
      r.gastos += total;
      e.finanzas.mesActual -= total;
      evento(`Pagaste ${plata$(total)} de sueldos.`);
    }
    // Media del mercado: un 5-10% por encima de lo que pagás vos
    const proporcion = emps.filter((x) => !x.esLelo).map((x) => x.sueldo / PUESTOS[x.puesto].variantes[x.variante].sueldo);
    if (proporcion.length) {
      const nueva = promedioDe(proporcion) * entre(e, 1 + EQUIPO.mercado.subeMin, 1 + EQUIPO.mercado.subeMax);
      e.equipo.mercado = redondear(Math.max(e.equipo.mercado, nueva), 3);
    }
  }
  for (const emp of emps) {
    emp.semanasMes = 0;
    if (!emp.capacitadoMes) {
      const baja = emp.esLelo ? EQUIPO.bajaExpPorMes / 2 : EQUIPO.bajaExpPorMes;
      emp.exp = Math.max(0, redondear(emp.exp - baja, 1));
    }
    emp.capacitadoMes = false;
    if (emp.rasgo === 'quejoso' && !emp.pideAumento && e.semana >= emp.proximaQueja) {
      emp.pideAumento = Math.round((emp.sueldo * (1 + EQUIPO.aumentoQuejoso)) / 1000) * 1000;
      emp.proximaQueja = e.semana + EQUIPO.mesesQuejoso * 4 + 2;
      evento(`${emp.nombre} te pide un aumento a ${plata$(emp.pideAumento)}. Respondele el domingo.`, 'mala');
    }
  }
}

// "Prolijo" → "Prolija" si es mujer.
export function nombreRasgo(rasgo, nombre) {
  const r = RASGOS[rasgo].nombre;
  if (!NOMBRES_FEMENINOS.includes(nombre)) return r;
  return r.endsWith('o') ? `${r.slice(0, -1)}a` : r.endsWith('or') ? `${r}a` : r;
}

function promedioDe(xs) {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function sumarLelo(e) {
  if (e.equipo.empleados.some((x) => x.esLelo)) return;
  e.equipo.empleados.push({
    id: 'lelo', nombre: 'Lelo', esLelo: true, puesto: 'operario', variante: 'operario', origen: 'familia',
    sueldo: LELO_EMPLEADO.sueldo, exp: LELO_EMPLEADO.exp, rasgo: null, rasgoVisible: true, leal: true,
    desde: e.semana, semanasMes: 0, capacitadoMes: false, desganado: false, pideAumento: null, falta: false, semanasTrabajadas: 0,
  });
}

// ---------- Partida nueva ----------
export function nuevaPartida(opcionPrestamo, semilla = Date.now() >>> 0) {
  if (!['A', 'B'].includes(opcionPrestamo)) throw new Error('Opción de préstamo inválida');
  const e = {
    version: VERSION_PARTIDA,
    semilla,
    semana: 1,
    plata: PRESTAMO.monto - MAQUINAS.tazas.precio,
    maquinas: { tazas: true, gorras: false },
    stock: { tazaCeramica: 0, tazaPlastico: 0, gorra: 0 },
    rep: 0,
    exp: 0,
    cansancio: 0,
    formacion: { fija: 0, cursos: { sublimacion: 0, redes: 0, ventas: 0 } },
    curso: { id: null, semanasRestantes: 0 },
    prestamo: opcionPrestamo === 'A'
      ? { opcion: 'A', pagado: false, deuda: PRESTAMO.A.total, vencido: false }
      : { opcion: 'B', cuotasPagadas: 0, cuotasPerdonadas: 0, atrasadas: 0, pagado: false },
    tio: { confianza: 50, enojado: false },
    primo: { nombre: PRIMO.nombre, rep: 0, comportamiento: 'tranquilo', proximo: null, rumor: null },
    mazo: { trimestre: -1, cartas: [] },
    finanzas: { mesActual: 0, meses: [] },
    mesesEnRojo: 0,
    mejorDeLaCiudad: false,
    fin: null,
    ultimoResumen: null,
    totales: { vendidas: 0, producidas: 0 },
    semanaEnCurso: null,
    mazoFeria: [],
    equipo: equipoVacio(),
  };
  prepararMazo(e);
  planearPrimo(e);
  inicioDeSemana(e);
  return e;
}

// ---------- Lelo, el primo ----------
function sortearComportamiento(e) {
  const tirada = siguienteAzar(e);
  let acumulado = 0;
  return (PRIMO.comportamientos.find((x) => (acumulado += x.prob) >= tirada) || PRIMO.comportamientos[0]).id;
}

// Decide qué va a hacer Lelo la semana siguiente y si corre un rumor (una semana antes).
function planearPrimo(e) {
  e.primo.proximo = sortearComportamiento(e);
  e.primo.jugada = Math.floor(siguienteAzar(e) * PRIMO.jugadas.length);
  const compite = e.semana >= 4 && !e.mejorDeLaCiudad;
  const hayRumor = compite && (e.primo.proximo === 'agresivo' || siguienteAzar(e) < PRIMO.rumor.probFalsaAlarma);
  // Si es falsa alarma, el rumor habla de una jugada que no va a pasar.
  e.primo.rumor = hayRumor ? `Rumor: ${PRIMO.jugadas[e.primo.jugada].rumor} Puede ser puro humo... o no.` : null;
}

// ---------- Mazo de eventos (balanceado por trimestre) ----------
function baseMazo(e) {
  const ultimos = e.finanzas.meses.slice(-3);
  const promedio = ultimos.length ? ultimos.reduce((s, v) => s + v, 0) / ultimos.length : 0;
  return Math.max(MAZO.baseMinima, promedio);
}

function mezclar(e, lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(siguienteAzar(e) * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

function prepararMazo(e) {
  const trimestre = Math.floor((e.semana - 1) / 13);
  if (e.mazo.trimestre === trimestre) return;
  const base = baseMazo(e);
  const malas = mezclar(e, [...MAZO.malas]);
  const buenas = mezclar(e, [...MAZO.buenas]);
  let cartas = [];
  MAZO.pares.forEach((v, i) => {
    const monto = Math.round((base * v) / 1000) * 1000;
    cartas.push({ tipo: 'mala', monto, texto: malas[i] });
    cartas.push({ tipo: 'buena', monto, texto: buenas[i] });
  });
  cartas = mezclar(e, cartas);
  const inicio = trimestre * 13 + 1;
  let semanas = [1, 3, 5, 7, 9, 11].map((d) => inicio + d);
  if (trimestre === 0) {
    // Tutorial: la primera carta sale en la semana 6 y es un gasto chico.
    semanas = [6, 7, 9, 10, 11, 13];
    const idx = cartas.findIndex((c) => c.tipo === 'mala' && c.monto === Math.min(...cartas.map((x) => x.monto)));
    const [chica] = cartas.splice(idx, 1);
    cartas.unshift(chica);
  }
  e.mazo = { trimestre, cartas: cartas.map((c, i) => ({ ...c, semana: semanas[i] })) };
}

// ---------- Acciones fuera del turno ----------
export function comprarMaquina(e, id) {
  const m = MAQUINAS[id];
  if (!m) return { ok: false, motivo: 'Esa máquina no existe.' };
  if (e.maquinas[id]) return { ok: false, motivo: 'Ya tenés esa máquina.' };
  if (e.plata < m.precio) return { ok: false, motivo: `Te faltan $${fmt(m.precio - e.plata)} para comprarla.` };
  e.plata -= m.precio;
  e.maquinas[id] = true;
  return { ok: true, mensaje: `¡Compraste la ${m.nombre.toLowerCase()}! La luz sube $${fmt(m.luzExtra)} por mes.` };
}

export function pagarPrestamoA(e) {
  const p = e.prestamo;
  if (p.opcion !== 'A' || p.pagado) return { ok: false, motivo: 'No hay nada para pagar.' };
  const monto = p.vencido ? p.deuda : costoPagoAnticipadoA(e.semana);
  if (e.plata < monto) return { ok: false, motivo: `Necesitás $${fmt(monto)} y tenés $${fmt(e.plata)}.` };
  e.plata -= monto;
  p.pagado = true;
  p.deuda = 0;
  if (!p.vencido) {
    e.tio.confianza = limitar(e.tio.confianza + 30, 0, 100);
    return { ok: true, mensaje: `Le pagaste $${fmt(monto)} al tío. Tío: "¡Así me gusta! Cuando quieras otra máquina, hablamos."` };
  }
  e.tio.confianza = limitar(e.tio.confianza + 10, 0, 100);
  e.tio.enojado = false;
  return { ok: true, mensaje: `Saldaste la deuda de $${fmt(monto)}. El tío se ablandó un poco.` };
}

export function puedeHacerPromo(e) {
  return Boolean(e.primo.rumor) && e.semana >= 4 && !e.mejorDeLaCiudad;
}

// ---------- Horas y costos ----------
// Horas del domingo: publicidad, promo, feria y curso (el que está en marcha o el que arranca).
// Son tus horas: lo que hace el equipo no cuenta acá.
export function horasDomingo(e, pub) {
  let horas = (pub.horasRedes || 0) + (pub.promo ? PROMO.horas : 0) + (pub.feria && !pub.feriaVendedor ? VENTAS.feria.horas : 0);
  const idCurso = e.curso.semanasRestantes > 0 ? e.curso.id : pub.curso;
  if (idCurso) horas += CURSOS[idCurso].horasPorSemana;
  if (fuisteALaBolsa(e)) horas += EQUIPO.bolsa.horas;
  if (pub.capacitar === 'vos') horas += CAPACITACION.vos.horas;
  return horas;
}

export function horasDelPlan(e, plan, sem = e.semanaEnCurso) {
  const horas = (sem ? sem.horasDomingo : 0) + repartirProduccion(e, plan.producir, sem).vos.horas;
  return redondear(horas, 1);
}

export function costoDelPlan(plan) {
  let costo = 0;
  for (const [id, n] of Object.entries(plan.producir || {})) costo += (n || 0) * PRODUCTOS[id].costo;
  return costo;
}

// Horas de publicidad sugeridas para alcanzar toda la demanda esperada de la semana.
export function horasPublicidadSugeridas(e) {
  const total = Object.keys(PRODUCTOS).reduce((s, id) => s + demandaEsperada(e, id), 0);
  return Math.ceil(total * horasPorVenta(e));
}

// Unidades pedidas por producto (sin contar rechazados).
export function unidadesPedidas(sem, incluirRechazados = false) {
  const u = Object.fromEntries(Object.keys(PRODUCTOS).map((id) => [id, 0]));
  for (const p of sem?.pedidos || []) if (incluirRechazados || !p.rechazado) u[p.producto] += p.cantidad;
  return u;
}

// ---------- Paso 1: publicidad en redes → llegan los pedidos ----------
export function validarPublicidad(e, pub) {
  const errores = [];
  if (e.fin) errores.push('La partida terminó.');
  if (e.semanaEnCurso) errores.push('Ya hiciste la publicidad de esta semana.');
  const horas = pub.horasRedes || 0;
  if (horas < 0 || !Number.isInteger(horas)) errores.push('Horas de publicidad inválidas.');
  if (pub.promo && !puedeHacerPromo(e)) errores.push('La promo de contraataque solo se puede lanzar cuando hay un rumor sobre Lelo.');
  if (pub.feria && stockTotal(e) === 0) errores.push('No tenés stock para llevar a la feria.');
  if (pub.curso && !CURSOS[pub.curso]) errores.push('Ese curso no existe.');
  if (pub.curso && e.curso.semanasRestantes > 0) errores.push('Ya estás haciendo un curso.');
  if (pub.feriaVendedor) {
    const v = presentes(e, 'vendedor').find((x) => x.id === pub.feriaVendedor);
    if (!pub.feria) errores.push('Para mandar a alguien a la feria, marcá "Ir a la feria".');
    else if (!v || horasEmpleado(e, v, { capacitacion: pub.capacitar }) < VENTAS.feria.horas) errores.push('Ese vendedor no puede ir a la feria esta semana.');
  }
  if (pub.capacitar) {
    if (!presentes(e).length) errores.push('No tenés a nadie para capacitar esta semana.');
    if (pub.capacitar === 'vos' && !productosParaEnsenar(e).length) errores.push('Para capacitar vos necesitás algún producto en stock para enseñar.');
    if (pub.capacitar === 'vos' && !presentes(e).some((x) => x.exp < e.exp)) errores.push('Tu equipo ya sabe tanto como vos: mejor un curso.');
  }
  const total = horasDomingo(e, pub);
  if (total > HORAS_POR_SEMANA) errores.push(`Te pasaste de horas: ${total} de ${HORAS_POR_SEMANA}.`);
  const costo = (pub.feria ? VENTAS.feria.costoMesa : 0) + (pub.curso ? CURSOS[pub.curso].costo : 0) + costoCapacitacion(e, pub.capacitar);
  if (costo > 0 && costo > e.plata) errores.push(`No te alcanza la plata: necesitás $${fmt(costo)} y tenés $${fmt(e.plata)}.`);
  return { ok: errores.length === 0, errores, horas: total, costo };
}

export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function publicar(e, pub) {
  const v = validarPublicidad(e, pub);
  if (!v.ok) return { ok: false, errores: v.errores };
  const eventos = []; // resumen que queda visible en el paso 2
  const evento = (t, tipo = 'info') => eventos.push({ texto: t, tipo });
  const dias = DIAS.map((nombre) => ({ nombre, items: [] })); // línea de tiempo para la animación
  const enDia = (d, texto, tipo = 'info') => dias[d].items.push({ texto, tipo });
  const diaAlAzar = () => Math.floor(siguienteAzar(e) * 7);
  const compite = e.semana >= 4 && !e.mejorDeLaCiudad;
  const horas = pub.horasRedes || 0;

  // Lelo hace lo que planeó la semana anterior
  const comp = PRIMO.comportamientos.find((x) => x.id === (e.primo.proximo || sortearComportamiento(e)));
  const habiaRumor = Boolean(e.primo.rumor);
  e.primo.comportamiento = comp.id;
  const ataque = PRIMO.jugadas[e.primo.jugada ?? Math.floor(siguienteAzar(e) * PRIMO.jugadas.length)].ataque;
  const oferta = PRIMO.ofertas[Math.floor(siguienteAzar(e) * PRIMO.ofertas.length)];
  if (compite) {
    if (pub.promo) {
      enDia(0, '📣 Lanzaste la promo de contraataque.', 'buena');
      if (comp.id === 'agresivo') {
        enDia(1, `😤 ${ataque}.. pero tu promo ya estaba en todos lados.`, 'info');
        evento('¡Tu promo frenó a Lelo! Su campaña no te sacó ningún pedido y encima te llegaron clientes nuevos.', 'buena');
      } else {
        evento('Lanzaste la promo, pero el rumor era humo: Lelo ni apareció. Igual te llegaron algunos clientes más.', 'info');
      }
    } else {
      if (habiaRumor && comp.id !== 'agresivo') evento('El rumor era humo: Lelo no hizo ninguna jugada agresiva.', 'buena');
      else if (habiaRumor) evento('El rumor era cierto.', 'mala');
      if (comp.id === 'agresivo') {
        evento(`${ataque} Te sacó clientes.`, 'mala');
        enDia(1, `😤 ${ataque}`, 'mala');
      } else if (comp.id === 'ofertas') {
        evento(oferta, 'mala');
        enDia(2, `🏷️ ${oferta}`, 'mala');
      } else {
        evento(comp.texto, 'info');
      }
    }
  }
  const sacaLelo = compite && !pub.promo ? comp.saca : 0;

  // El equipo: quién faltó, Chuchu dando vueltas y capacitación
  const semEquipo = { capacitacion: pub.capacitar || null, feriaVendedor: pub.feriaVendedor || null };
  for (const emp of e.equipo.empleados) if (emp.falta) enDia(1, `🤒 ${emp.nombre} no vino en toda la semana: ${emp.motivoFalta}.`, 'mala');
  const ch = e.equipo.chuchu;
  if (chuchuDisponible(e)) {
    if (siguienteAzar(e) < CHUCHU.probAparece) enDia(1 + Math.floor(siguienteAzar(e) * 5), `🚂 ${CHUCHU.frases[Math.floor(siguienteAzar(e) * CHUCHU.frases.length)]}`, 'info');
  } else {
    const ex = CHUCHU.excusas.find((x) => x.texto === ch.excusa);
    if (ex && siguienteAzar(e) < 0.5) enDia(1 + Math.floor(siguienteAzar(e) * 5), `🚂 ${ex.mensajes[Math.floor(siguienteAzar(e) * ex.mensajes.length)]}`, 'info');
  }
  let gastosEquipo = 0;
  if (pub.capacitar) {
    gastosEquipo = costoCapacitacion(e, pub.capacitar);
    e.plata -= gastosEquipo;
    capacitar(e, pub.capacitar, enDia);
  }
  // Vendedores: suman horas de redes y empujan su producto fuerte (y descuidan otro)
  const vendedores = presentes(e, 'vendedor');
  const hpvVos = horasPorVenta(e);
  const horasVendedores = vendedores.reduce((sum, v) => sum + horasEmpleado(e, v, semEquipo), 0);
  const horasEq = horas + vendedores.reduce((sum, v) => sum + (horasEmpleado(e, v, semEquipo) * hpvVos) / horasPorVentaExp(v.exp), 0);
  const extraPromo = pub.promo ? 1 + PROMO.extraDemanda : 1;

  const aviso = avisoFecha(e.semana);
  if (aviso) enDia(0, `📅 ${aviso}`, 'buena');

  // Curso que arranca esta semana
  let gastosDomingo = gastosEquipo;
  if (pub.curso) {
    const cu = CURSOS[pub.curso];
    e.plata -= cu.costo;
    gastosDomingo += cu.costo;
    e.curso = { id: pub.curso, semanasRestantes: cu.semanas };
    enDia(0, `📚 Arrancaste el curso de ${cu.nombre.toLowerCase()} (${cu.semanas} semanas).`, 'buena');
  } else if (e.curso.semanasRestantes > 0) {
    enDia(2, `📚 Seguís con el curso de ${CURSOS[e.curso.id].nombre.toLowerCase()}.`, 'info');
  }

  // Feria del domingo: se vende el stock que sobró de semanas anteriores
  const vendedorFeria = pub.feriaVendedor ? e.equipo.empleados.find((x) => x.id === pub.feriaVendedor) : null;
  if (vendedorFeria) enDia(0, `🧑‍💼 ${vendedorFeria.nombre} fue a la feria por vos.`, 'info');
  const feria = pub.feria ? hacerFeria(e, vendedorFeria) : null;
  if (feria) {
    gastosDomingo += feria.gastos;
    feria.textos.forEach((t) => enDia(0, t.texto, t.tipo));
  }

  // Lo que pide el mercado esta semana (el jugador no lo ve)
  const mercado = {};
  let totalMercado = 0;
  for (const id of Object.keys(PRODUCTOS)) {
    let empuje = 1;
    for (const v of vendedores) {
      const va = PUESTOS.vendedor.variantes[v.variante];
      if (v.fuerte === id) empuje *= 1 + va.fuerte;
      if (v.descuidado === id) empuje *= 1 - va.descuidado;
    }
    mercado[id] = Math.max(0, Math.round(demandaEsperada(e, id) * empuje * extraPromo * entre(e, 0.8, 1.2)));
    totalMercado += mercado[id];
  }

  // Cuánto alcanza tu publicidad
  const alcance = Math.min(totalMercado, Math.floor(horasEq / hpvVos + 1e-9));
  const captadas = {};
  let resto = alcance;
  const ids = Object.keys(mercado).filter((id) => mercado[id] > 0);
  ids.forEach((id) => { captadas[id] = totalMercado ? Math.floor((alcance * mercado[id]) / totalMercado) : 0; resto -= captadas[id]; });
  for (const id of [...ids].sort((a, b) => mercado[b] - mercado[a])) {
    if (resto <= 0) break;
    if (captadas[id] < mercado[id]) { captadas[id]++; resto--; }
  }

  // Se arman los pedidos (1 a 3 unidades cada uno), llegan en distintos días y Lelo te pelea cada uno
  const pedidos = [];
  const deLelo = [];
  let n = 0;
  for (const id of ids) {
    let quedan = captadas[id] || 0;
    while (quedan > 0) {
      const cantidad = Math.min(quedan, enteroEntre(e, 1, 3));
      quedan -= cantidad;
      const cliente = CLIENTES[Math.floor(siguienteAzar(e) * CLIENTES.length)];
      const pedido = { id: `p${e.semana}-${++n}`, producto: id, cantidad, cliente, rechazado: false, dia: diaAlAzar() };
      if (siguienteAzar(e) < sacaLelo) deLelo.push(pedido);
      else pedidos.push(pedido);
    }
  }
  pedidos.sort((a, b) => a.dia - b.dia);
  for (const p of pedidos) enDia(p.dia, `📩 ${capitalizar(p.cliente)} te pidió ${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}.`, 'pedido');
  for (const p of deLelo) enDia(p.dia, `😤 Lelo le ganó el pedido a ${p.cliente} (${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}).`, 'mala');
  if (deLelo.length) {
    const u = unidadesPedidas({ pedidos: deLelo });
    const detalle = Object.keys(u).filter((id) => u[id]).map((id) => `${u[id]} ${nombreUnidades(id, u[id])}`).join(', ');
    evento(`Lelo se quedó con ${deLelo.length} pedido${deLelo.length > 1 ? 's' : ''} (${detalle}).`, 'mala');
  }

  // Me gusta: la publicidad se reparte en los días; si te pasaste, los últimos avisos no tienen respuesta
  const horasUtiles = totalMercado * hpvVos;
  const sobrante = horasEq - horasUtiles;
  const diasConAvisos = Math.min(7, Math.ceil(horasEq));
  for (let d = 0; d < diasConAvisos; d++) {
    const ultimo = d >= diasConAvisos - Math.min(2, Math.ceil(Math.max(0, sobrante) / Math.max(1, horasEq / diasConAvisos)));
    if (sobrante >= 1 && ultimo) enDia(d, '🦗 Tu aviso no tuvo ni un me gusta.', 'mala');
    else enDia(d, `❤️ ${Math.max(1, Math.round(entre(e, 3, 9) * (1 + e.rep / 25)))} me gusta en tu publicación.`, 'info');
  }

  // Balance del sábado (sin números exactos: siempre 2 pedidos menos de lo real)
  const sinCaptar = totalMercado - alcance;
  if (horasEq === 0) {
    enDia(6, 'Sin publicidad, nadie se enteró de que vendés.', 'mala');
    evento('No hiciste publicidad: nadie se enteró de que vendés.', 'mala');
  } else if (sinCaptar > 0) {
    const pedidosPerdidos = Math.ceil(sinCaptar / 2);
    const texto = pedidosPerdidos - 2 >= 1
      ? `En el mercado había más pedidos: al menos ${pedidosPerdidos - 2} ${pedidosPerdidos - 2 === 1 ? 'quedó' : 'quedaron'} sin atender.`
      : 'Puede que algún cliente no te haya encontrado.';
    enDia(6, `🔎 ${texto}`, 'mala');
    evento(texto, 'mala');
  } else if (sobrante >= 1) {
    evento('Tus últimos avisos no tuvieron ni un me gusta.', 'mala');
  }
  enDia(6, pedidos.length ? `📦 Cierra la semana con ${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} para entregar el domingo.` : '📦 Cierra la semana sin pedidos.', 'cierre');

  e.semanaEnCurso = {
    semana: e.semana, horasRedes: horas, promo: Boolean(pub.promo), horasDomingo: horasDomingo(e, { ...pub, curso: null }),
    pedidos, pedidosLelo: deLelo.length, eventos, dias, feria, gastosDomingo, horasVendedores: redondear(horasVendedores, 1), ...semEquipo,
  };
  return { ok: true, semana: e.semanaEnCurso };
}

// ---------- Feria del domingo ----------
function sacarCartaFeria(e) {
  if (!e.mazoFeria.length) {
    e.mazoFeria = mezclar(e, MAZO_FERIA.flat().map((c) => ({ ...c })));
  }
  return e.mazoFeria.pop();
}

function venderUnaDelStock(e) {
  const conStock = Object.keys(e.stock).filter((id) => e.stock[id] > 0);
  if (!conStock.length) return null;
  const total = conStock.reduce((s, id) => s + e.stock[id], 0);
  let t = siguienteAzar(e) * total;
  const id = conStock.find((x) => (t -= e.stock[x]) < 0) || conStock[0];
  e.stock[id]--;
  return id;
}

function describirUnidades(cuenta) {
  return Object.keys(cuenta).filter((id) => cuenta[id]).map((id) => `${cuenta[id]} ${nombreUnidades(id, cuenta[id])}`).join(' y ');
}

function hacerFeria(e, vendedor = null) {
  const f = { ingresos: 0, gastos: VENTAS.feria.costoMesa, vendidas: 0, textos: [], linea: '' };
  e.plata -= VENTAS.feria.costoMesa;
  const stockInicial = stockTotal(e);
  // Si va un vendedor, vende con su experiencia en vez de tu curso de ventas
  const mult = vendedor ? (1 + (multiplicadorReputacion(e.rep) - 1) * 0.5) * (1 + vendedor.exp / 120) : multiplicadorFeria(e);
  let cupo = Math.round(enteroEntre(e, VENTAS.feria.min, VENTAS.feria.max) * mult);
  const carta = siguienteAzar(e) < PROB_CARTA_FERIA ? sacarCartaFeria(e) : null;
  const vender = (n, precio = 1) => {
    const cuenta = {};
    for (let i = 0; i < n; i++) {
      const id = venderUnaDelStock(e);
      if (!id) break;
      cuenta[id] = (cuenta[id] || 0) + 1;
      const ingreso = Math.round(PRODUCTOS[id].precio * precio);
      e.plata += ingreso;
      f.ingresos += ingreso;
      f.vendidas++;
    }
    return cuenta;
  };
  const sacar = (n) => {
    const cuenta = {};
    for (let i = 0; i < n; i++) { const id = venderUnaDelStock(e); if (!id) break; cuenta[id] = (cuenta[id] || 0) + 1; }
    return cuenta;
  };

  if (carta?.efecto === 'lluvia') cupo = Math.ceil(cupo / 2);
  if (carta?.efecto === 'todo') cupo = stockInicial;
  if (carta?.efecto === 'extra') cupo += carta.unidades;
  const vendido = vender(cupo);
  const quedaSinStock = stockTotal(e) === 0 && f.vendidas < cupo;
  f.linea = `En la feria vendiste ${f.vendidas}${f.vendidas ? ` (${describirUnidades(vendido)})` : ''}${quedaSinStock ? ' y te quedaste sin nada para vender' : ''}.`;
  f.textos.push({ texto: `🛍️ ${f.linea}`, tipo: f.vendidas ? 'buena' : 'info' });

  if (carta) {
    let texto = carta.texto;
    if (carta.efecto === 'plata') {
      e.plata += carta.monto;
      if (carta.monto > 0) f.ingresos += carta.monto; else f.gastos -= carta.monto;
    } else if (carta.efecto === 'rotos' || carta.efecto === 'robo') {
      const perdidas = sacar(carta.unidades);
      const d = describirUnidades(perdidas);
      texto = d ? texto.replace('{n}', d) : 'Casi se te cae una caja, pero ya no te quedaba nada en el puesto.';
    } else if (carta.efecto === 'sinRetirar') {
      // Cobrás el valor de productos que siguen en tu stock
      const ids = Object.keys(e.stock).filter((id) => e.stock[id] > 0);
      const id = ids[0] || Object.keys(PRODUCTOS).find((x) => e.maquinas[PRODUCTOS[x].maquina]);
      const monto = PRODUCTOS[id].precio * carta.unidades;
      e.plata += monto;
      f.ingresos += monto;
      texto = texto.replace('{n}', `${carta.unidades} ${nombreUnidades(id, carta.unidades)}`);
    } else if (carta.efecto === 'extra') {
      texto = quedaSinStock
        ? 'Otro feriante te pasó un cliente, pero ya no tenías nada para venderle.'
        : texto.replace('{n}', `${carta.unidades} producto${carta.unidades > 1 ? 's' : ''}`);
    } else if (carta.efecto === 'todo' && f.vendidas === 0) {
      texto = 'Un comerciante quería comprarte todo lo que quedaba... pero no te quedaba nada.';
    }
    f.textos.push({ texto: `${carta.tipo === 'mala' ? '😖' : '🍀'} ${texto}`, tipo: carta.tipo });
  }
  f.rep = f.vendidas * REPUTACION.porVenta;
  return f;
}

function capitalizar(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function rechazarPedido(e, idPedido, rechazar = true) {
  const p = e.semanaEnCurso?.pedidos.find((x) => x.id === idPedido);
  if (p) p.rechazado = rechazar;
}

// ---------- Paso 2: producir, entregar y cerrar la semana ----------
export function validarPlan(e, plan) {
  const errores = [];
  if (!e.semanaEnCurso) errores.push('Primero hacé la publicidad de la semana.');
  for (const [id, n] of Object.entries(plan.producir || {})) {
    if (n < 0 || !Number.isInteger(n)) errores.push('Cantidad inválida.');
    if (n > 0 && !e.maquinas[PRODUCTOS[id].maquina]) errores.push(`No tenés máquina para ${PRODUCTOS[id].nombre.toLowerCase()}.`);
  }
  const horas = horasDelPlan(e, plan);
  if (horas > HORAS_POR_SEMANA) errores.push(`Te pasaste de horas: ${horas} de ${HORAS_POR_SEMANA}.`);
  const costo = costoDelPlan(plan);
  if (costo > 0 && costo > e.plata) errores.push(`No te alcanza la plata: necesitás $${fmt(costo)} y tenés $${fmt(e.plata)}.`);
  return { ok: errores.length === 0, errores, horas, costo };
}

export function cerrarSemana(e, plan) {
  if (e.fin) throw new Error('La partida terminó.');
  const v = validarPlan(e, plan);
  if (!v.ok) return { ok: false, errores: v.errores };
  const sem = e.semanaEnCurso;

  const c = calendario(e.semana);
  const r = { semana: e.semana, mes: c.nombreMes, lineas: [], eventos: [...sem.eventos], ingresos: 0, gastos: 0 };
  const repInicial = e.rep;
  const linea = (t) => r.lineas.push(t);
  const evento = (t, tipo = 'info') => r.eventos.push({ texto: t, tipo });
  const precioRedes = sem.promo ? 1 - PROMO.descuento : 1;
  let deltaRep = 0;

  // 1. Producción: cada uno hace su parte y cada uno tiene su probabilidad de error
  const reparto = repartirProduccion(e, plan.producir, sem);
  let producidas = 0;
  const fabricar = (unidades, pError, quien) => {
    let hechas = 0;
    const arruinadas = {};
    for (const [id, n] of Object.entries(unidades)) {
      for (let i = 0; i < n; i++) {
        e.plata -= PRODUCTOS[id].costo;
        r.gastos += PRODUCTOS[id].costo;
        if (siguienteAzar(e) < pError) { arruinadas[id] = (arruinadas[id] || 0) + 1; continue; }
        e.stock[id] += 1;
        hechas++;
      }
    }
    for (const [id, x] of Object.entries(arruinadas)) {
      evento(`${quien} ${x} ${nombreUnidades(id, x)} en la prensa (perdiste $${fmt(x * PRODUCTOS[id].costo)} de insumo).`, 'mala');
    }
    producidas += hechas;
    return { hechas, intentos: hechas + Object.values(arruinadas).reduce((t, x) => t + x, 0) };
  };
  const tuyas = fabricar(reparto.vos.unidades, probabilidadError(e), 'Se te arruinaron');
  e.exp = limitar(e.exp + tuyas.intentos * 0.08, 0, 100);
  let delEquipo = 0;
  for (const o of reparto.operarios) {
    const emp = o.emp;
    const res = fabricar(o.unidades, probabilidadErrorEmpleado(emp), `${emp.nombre} arruinó`);
    delEquipo += res.hechas;
    const aprende = emp.esLelo ? 1 : PUESTOS.operario.variantes[emp.variante].aprende;
    emp.exp = limitar(redondear(emp.exp + res.intentos * 0.08 * aprende, 1), 0, 100);
    if (emp.rasgo === 'creativo') deltaRep += res.hechas * EQUIPO.repCreativo;
  }
  e.totales.producidas += producidas;
  if (producidas > 0 || Object.keys(plan.producir || {}).some((id) => plan.producir[id] > 0)) {
    linea(delEquipo ? `Se produjeron ${producidas} unidades (${delEquipo} las hizo tu equipo).` : `Produjiste ${producidas} unidades.`);
  }

  // 2. Entrega de pedidos
  let entregados = 0;
  let unidadesEntregadas = 0;
  for (const p of sem.pedidos) {
    const nombre = `${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}`;
    if (p.rechazado) {
      const d = p.cantidad * REPUTACION.porPedidoRechazado;
      deltaRep += d;
      evento(`Rechazaste el pedido de ${p.cliente}: ${nombre} (${formatoRep(d)} de reputación).`, 'info');
      continue;
    }
    if (e.stock[p.producto] >= p.cantidad) {
      e.stock[p.producto] -= p.cantidad;
      const ingreso = Math.round(p.cantidad * PRODUCTOS[p.producto].precio * precioRedes);
      e.plata += ingreso;
      r.ingresos += ingreso;
      deltaRep += p.cantidad * REPUTACION.porVenta;
      entregados++;
      unidadesEntregadas += p.cantidad;
    } else {
      const d = p.cantidad * REPUTACION.porPedidoNoEntregado;
      deltaRep += d;
      evento(`No entregaste el pedido de ${p.cliente}: ${nombre} (${formatoRep(d)} de reputación).`, 'mala');
    }
  }
  const vendedoresSem = presentes(e, 'vendedor');
  for (const v of vendedoresSem) {
    if (v.rasgo === 'creativo') deltaRep += entregados * EQUIPO.repCreativo / vendedoresSem.length;
    const comision = PUESTOS.vendedor.variantes[v.variante].comision;
    if (comision && r.ingresos > 0) {
      const monto = Math.round((r.ingresos * comision) / vendedoresSem.length);
      e.plata -= monto;
      r.gastos += monto;
      evento(`Comisión de ${v.nombre}: $${fmt(monto)}.`);
    }
  }
  const activos = sem.pedidos.filter((p) => !p.rechazado).length;
  if (activos) linea(`Entregaste ${entregados} de ${activos} pedidos (${unidadesEntregadas} productos).`);
  else if (!sem.pedidos.length) linea('No llegaron pedidos esta semana.');

  // 3. Lo del domingo: feria y curso
  const feria = sem.feria;
  let vendidasFeria = 0;
  if (feria) {
    r.ingresos += feria.ingresos;
    deltaRep += feria.rep;
    vendidasFeria = feria.vendidas;
    linea(feria.linea);
  }
  r.gastos += sem.gastosDomingo || 0;

  // 4. Reputación (el cansancio trae pedidos mal hechos)
  const vendidas = unidadesEntregadas + vendidasFeria;
  e.totales.vendidas += vendidas;
  let malHechos = 0;
  if (e.cansancio > 60) for (let i = 0; i < vendidas; i++) if (siguienteAzar(e) < 0.05) malHechos++;
  if (malHechos > 0) {
    const d = malHechos * REPUTACION.porPedidoMalHecho;
    deltaRep += d;
    evento(`Por el cansancio entregaste ${malHechos} producto${malHechos > 1 ? 's' : ''} mal hecho${malHechos > 1 ? 's' : ''}. Te reclamaron (${formatoRep(d)} de reputación).`, 'mala');
  }
  e.rep = limitar(redondear(e.rep + deltaRep), 0, 100);
  e.exp = limitar(e.exp + vendidas * 0.02, 0, 100);

  // 5. Cansancio y curso
  const horas = v.horas;
  e.cansancio = horas > CANSANCIO.umbral
    ? limitar(e.cansancio + (horas - CANSANCIO.umbral) * CANSANCIO.sube, 0, 100)
    : limitar(e.cansancio - (CANSANCIO.umbral - horas) * CANSANCIO.baja, 0, 100);
  e.cansancio = redondear(e.cansancio, 1);
  if (e.cansancio >= 80) evento('Estás reventado. Si seguís así te vas a mandar macanas: descansá o contratá a alguien.', 'mala');

  // El equipo cumple otra semana: se le paga a fin de mes y se le conoce el rasgo
  for (const emp of e.equipo.empleados) {
    emp.semanasMes++;
    emp.semanasTrabajadas++;
    if (!emp.rasgoVisible && emp.semanasTrabajadas >= 1) {
      emp.rasgoVisible = true;
      const ra = RASGOS[emp.rasgo];
      evento(`Ya conocés a ${emp.nombre}: es ${nombreRasgo(emp.rasgo, emp.nombre).toLowerCase()} (${ra.efecto}).`, ra.bueno ? 'buena' : 'mala');
    }
  }
  if (e.curso.semanasRestantes > 0) {
    e.curso.semanasRestantes--;
    if (e.curso.semanasRestantes === 0) {
      const cu = CURSOS[e.curso.id];
      e.formacion.cursos[e.curso.id] = limitar(e.formacion.cursos[e.curso.id] + cu.puntos, 0, CURSO_MAX_PUNTOS);
      evento(`Terminaste el curso de ${cu.nombre.toLowerCase()}: ${cu.efecto} (+${cu.puntos} puntos).`, 'buena');
      e.curso = { id: null, semanasRestantes: 0 };
    }
  }

  // 6. Lelo avanza a la mitad de tu ritmo
  const avance = Math.max(0, e.rep - repInicial);
  e.primo.rep = limitar(redondear(e.primo.rep + avance * 0.5 + entre(e, 0, 0.3)), 0, PRIMO.repMax);

  // 7. Carta del mazo
  prepararMazo(e);
  const carta = e.mazo.cartas.find((x) => x.semana === e.semana && !x.usada);
  if (carta) {
    carta.usada = true;
    if (carta.tipo === 'mala') { e.plata -= carta.monto; r.gastos += carta.monto; evento(`${carta.texto} (−$${fmt(carta.monto)})`, 'mala'); }
    else { e.plata += carta.monto; r.ingresos += carta.monto; evento(`${carta.texto} (+$${fmt(carta.monto)})`, 'buena'); }
  }

  e.finanzas.mesActual += r.ingresos - r.gastos;

  // 8. Cierre de mes y fin de año
  if (c.finDeMes) cierreDeMes(e, c, r, evento);
  if (c.semanaEnAnio === SEMANAS_POR_ANIO) finDeAnio(e, r, evento);

  // 9. ¿Mejor de la ciudad?
  if (!e.mejorDeLaCiudad && e.rep >= REPUTACION.meta) {
    e.mejorDeLaCiudad = true;
    r.hito = 'mejorDeLaCiudad';
    sumarLelo(e);
    evento('¡Lograste ser el mejor de la ciudad! Lelo no pudo competir y cerró: ahora es empleado tuyo (operario con experiencia 60, $40.000 por mes).', 'hito');
  }
  if (repInicial < VENTAS.reputacionMercadoLibre && e.rep >= VENTAS.reputacionMercadoLibre) {
    evento('Con tu reputación, Mercado Libre empieza a traerte pedidos en serio.', 'buena');
  }

  r.plata = e.plata;
  r.rep = e.rep;
  r.repDelta = redondear(e.rep - repInicial);
  e.semana += 1;
  e.semanaEnCurso = null;

  // 10. Lelo planea la semana que viene (puede correr un rumor) y se prepara el equipo
  planearPrimo(e);
  inicioDeSemana(e, evento);
  if (e.primo.rumor) evento(e.primo.rumor, 'rumor');
  e.ultimoResumen = r;
  return { ok: true, resumen: r };
}

// Atajo para simulaciones: publicidad + producción en una sola llamada.
// plan.producir puede ser un objeto o una función (semanaEnCurso) => objeto.
export function jugarSemana(e, plan) {
  const p = publicar(e, {
    horasRedes: plan.horasRedes || 0, promo: plan.promo, feria: plan.feria, curso: plan.curso,
    capacitar: plan.capacitar, feriaVendedor: plan.feriaVendedor,
  });
  if (!p.ok) return p;
  const producir = typeof plan.producir === 'function' ? plan.producir(e.semanaEnCurso) : (plan.producir || {});
  const res = cerrarSemana(e, { producir });
  if (!res.ok) e.semanaEnCurso = null;
  return res;
}

function formatoRep(d) {
  const x = redondear(d, 1);
  return `${x > 0 ? '+' : x < 0 ? '−' : ''}${String(Math.abs(x)).replace('.', ',')}`;
}

export function nombreUnidades(id, n) {
  const p = PRODUCTOS[id];
  return (n === 1 ? p.singular : p.plural);
}

function cierreDeMes(e, c, r, evento) {
  const gastos = gastosFijosDelMes(e);
  e.plata -= gastos;
  r.gastos += gastos;
  e.finanzas.mesActual -= gastos;
  evento(`Cierre de ${c.nombreMes.toLowerCase()}: pagaste $${fmt(gastos)} de luz, internet y publicidad.`);
  cierreEquipo(e, r, evento);

  const p = e.prestamo;
  if (p.opcion === 'B' && !p.pagado) {
    const numeroCuota = p.cuotasPagadas + p.cuotasPerdonadas + p.atrasadas + 1;
    if (c.mes === PRESTAMO.B.mesPerdonado && c.anio === 1) {
      p.cuotasPerdonadas++;
      evento('Tío: "Esta cuota no me la pagues: es mi regalo de cumpleaños."', 'buena');
    } else if (numeroCuota <= PRESTAMO.B.cuotas) {
      p.atrasadas++;
    }
    // Pagar lo que se pueda (cuotas del mes + atrasadas)
    while (p.atrasadas > 0 && e.plata >= PRESTAMO.B.cuota) {
      e.plata -= PRESTAMO.B.cuota;
      r.gastos += PRESTAMO.B.cuota;
      e.finanzas.mesActual -= PRESTAMO.B.cuota;
      p.atrasadas--;
      p.cuotasPagadas++;
      e.tio.confianza = limitar(e.tio.confianza + 3, 0, 100);
      evento(`Pagaste la cuota ${p.cuotasPagadas + p.cuotasPerdonadas} de ${PRESTAMO.B.cuotas} al tío ($${fmt(PRESTAMO.B.cuota)}).`);
    }
    if (p.atrasadas > 0) {
      e.tio.confianza = limitar(e.tio.confianza - 15, 0, 100);
      evento(`No te alcanzó para la cuota. Le debés ${p.atrasadas} al tío y no está contento.`, 'mala');
    }
    if (p.cuotasPagadas + p.cuotasPerdonadas >= PRESTAMO.B.cuotas) {
      p.pagado = true;
      evento('¡Terminaste de pagarle al tío!', 'buena');
    }
  }
  if (p.opcion === 'A' && p.vencido && !p.pagado) {
    p.deuda = Math.round(p.deuda * 1.1);
    evento(`La deuda con el tío sigue creciendo: ahora es $${fmt(p.deuda)}.`, 'mala');
  }

  // Los cursos se olvidan: cada uno baja 5 puntos por mes
  for (const id of Object.keys(e.formacion.cursos)) e.formacion.cursos[id] = Math.max(0, e.formacion.cursos[id] - CURSO_BAJA_POR_MES);

  // Merma: una vez por mes se pierde un producto del stock guardado
  if (stockTotal(e) > 0) {
    const id = venderUnaDelStock(e);
    const texto = MERMA[Math.floor(siguienteAzar(e) * MERMA.length)].replace('{u}', `una ${PRODUCTOS[id].singular}`);
    evento(`📦 ${texto}`, 'mala');
  }

  e.finanzas.meses.push(e.finanzas.mesActual);
  r.gananciaMes = e.finanzas.mesActual;
  e.finanzas.mesActual = 0;

  if (e.plata < 0) {
    e.mesesEnRojo++;
    evento(`Cerraste el mes en rojo ($${fmt(e.plata)}). Si pasan 3 meses seguidos así, fundís.`, 'mala');
    if (e.mesesEnRojo >= 3) {
      e.fin = 'quiebra';
      r.hito = 'quiebra';
      evento('Tres meses en rojo: el taller cerró. Fin de la partida.', 'hito');
    }
  } else {
    e.mesesEnRojo = 0;
  }
}

function finDeAnio(e, r, evento) {
  const p = e.prestamo;
  if (p.opcion === 'A' && !p.pagado && !p.vencido) {
    if (e.plata >= PRESTAMO.A.total) {
      e.plata -= PRESTAMO.A.total;
      r.gastos += PRESTAMO.A.total;
      p.pagado = true;
      p.deuda = 0;
      e.tio.confianza = limitar(e.tio.confianza + 20, 0, 100);
      evento(`Venció el préstamo y le pagaste los $${fmt(PRESTAMO.A.total)} al tío. Cumplidor.`, 'buena');
    } else {
      p.vencido = true;
      e.tio.enojado = true;
      e.tio.confianza = limitar(e.tio.confianza - 50, 0, 100);
      evento('Venció el préstamo y no llegaste. El tío está furioso: la deuda ahora crece un 10% por mes.', 'mala');
    }
  }
  const tuyo = e.rep;
  const delPrimo = e.primo.rep;
  r.fiestas = { tuyo, delPrimo };
  if (e.mejorDeLaCiudad) evento('Fiestas: Lelo brinda por su jefe. Todos te miran con respeto.', 'buena');
  else if (tuyo >= delPrimo) evento(`Fiestas: el tío los compara delante de toda la familia. Tu reputación ${Math.round(tuyo)} contra ${Math.round(delPrimo)} de Lelo. "¡Este pibe va a llegar lejos!"`, 'buena');
  else evento(`Fiestas: el tío los compara delante de toda la familia. Tu reputación ${Math.round(tuyo)} contra ${Math.round(delPrimo)} de Lelo. "Che, ¿y vos qué estuviste haciendo todo el año?"`, 'mala');
}

export function fmt(n) {
  return Math.round(n).toLocaleString('es-AR');
}

export {
  HORAS_POR_SEMANA, PRODUCTOS, MAQUINAS, CURSOS, VENTAS, PRESTAMO, TUTORIAL, PROMO, CANSANCIO, PUESTOS, RASGOS, EQUIPO, CAPACITACION,
};
