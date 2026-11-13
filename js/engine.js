// Motor del juego "El Taller". Lógica pura: no toca la pantalla ni el guardado.
import {
  HORAS_POR_SEMANA, SEMANAS_POR_ANIO, MESES, MAQUINAS, PRODUCTOS, FECHAS_ESPECIALES, RAMPA_FECHA,
  PRESTAMO, GASTOS_FIJOS, VENTAS, REPUTACION, PRIMO, CURSOS, CURSO_MAX_PUNTOS, CURSO_BAJA_POR_MES, MAZO, TUTORIAL, PROMO, CLIENTES,
  MAZO_FERIA, PROB_CARTA_FERIA, MERMA, CANSANCIO, PUESTOS, RASGOS, NOMBRES_EMPLEADOS, EQUIPO, CAPACITACION,
  LELO_EMPLEADO, CHUCHU, NOMBRES_FEMENINOS, CYBER, CONFIANZA, ORDEN_MAQUINAS, MAQUINAS_FUTURAS, LOCALES, VOLANTES,
  SERVICIOS, LELO_VIAJE, TRAICIO, SIN_TEXTIL_ERRORES, PROVINCIA, LELO_GERENTE, DEFENSAS, SEGURIDAD, EMPRESAS,
  TERCERIZAR, LICITACION, VOZ_DE_ADENTRO, ABUELA,
} from './data.js';

export const VERSION_PARTIDA = 4;

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

// Fechas especiales que se vienen (o son esta semana): [{ fecha, faltan }] con faltan entre 0 y 3.
// Pueden coincidir dos: los efectos se multiplican.
export function fechasProximas(semana) {
  const enAnio = calendario(semana).semanaEnAnio;
  const lista = [];
  for (const f of FECHAS_ESPECIALES) {
    const faltan = semanaPico(f) - enAnio;
    if (faltan >= 0 && faltan <= 3) lista.push({ fecha: f, faltan });
  }
  return lista;
}

export function fechaProxima(semana) {
  return fechasProximas(semana)[0] || null;
}

// ¿Es la semana del CyberMonday? (se puede sumar bajando los precios)
export function esSemanaCyber(semana) {
  return fechasProximas(semana).some((p) => p.fecha.cyber && p.faltan === 0);
}

export function multiplicadorFecha(semana, idProducto, conCyber = false) {
  let m = 1;
  for (const p of fechasProximas(semana)) {
    const efecto = p.fecha.efecto[idProducto] ?? p.fecha.efecto.todo;
    if (!efecto) continue;
    if (p.fecha.cyber) { if (p.faltan === 0 && conCyber) m *= efecto; continue; }
    m *= 1 + (efecto - 1) * RAMPA_FECHA[p.faltan];
  }
  return m;
}

// Pista sin números para el jugador.
export function avisoFecha(semana) {
  const textos = fechasProximas(semana).map(({ fecha, faltan }) => {
    const n = fecha.nombre;
    if (fecha.cyber) {
      if (faltan > 0) return `Se viene ${n} (falta${faltan > 1 ? 'n' : ''} ${faltan} semana${faltan > 1 ? 's' : ''}): ese día la gente compra de todo, pero solo si hay descuento.`;
      return `¡Es la semana del ${n.replace('el ', '')}! Si bajás los precios un ${Math.round(CYBER.descuento * 100)}%, te piden mucho más de todo.`;
    }
    if (faltan === 3) return `Se viene ${n}: la gente empieza a pedir más, ya están buscando regalos.`;
    if (faltan === 2) return `Faltan 2 semanas para ${n}: cada vez más gente busca regalos.`;
    if (faltan === 1) return `Falta 1 semana para ${n}: hay mucha gente buscando regalos.`;
    return `¡Esta semana termina con ${n}! Es la última para comprar regalos: hay muchísima gente buscando.`;
  });
  return textos.length ? textos.join(' ') : null;
}

// ---------- Fórmulas ----------
// Demanda escalonada: 0-50 +10% cada 10 puntos, 50-75 +25%, 75-100 +50% (hasta x3,375).
export function multiplicadorReputacion(rep) {
  const r = limitar(rep, 0, 100);
  if (r <= 50) return 1 + r * 0.01;
  if (r <= 75) return 1.5 + (r - 50) * 0.025;
  return 2.125 + (r - 75) * 0.05;
}

export function enProvincia(e) {
  return e.meta === 'provincia';
}

// Tamaño del mercado: en la ciudad crece escalonado; la provincia arranca en x3,4 y llega al doble.
export function multiplicadorMercado(e) {
  if (enProvincia(e)) return PROVINCIA.mercadoInicial * (1 + limitar(e.rep, 0, 100) / 100);
  return multiplicadorReputacion(e.rep);
}

export function multiplicadorProducto(rep, sens) {
  return 1 + (multiplicadorReputacion(rep) - 1) * sens;
}

// Lelo te pelea la ciudad: desde la semana 4, mientras no trabaja para vos ni está de viaje.
export function leloCompite(e) {
  return (e.meta || 'ciudad') === 'ciudad' && e.semana >= 4 && !e.equipo.empleados.some((x) => x.esLelo) && !e.leloVuelve;
}

// Errores extra o de menos del taller en una máquina: diseñadores, plancha sin textil y Lelo gerente.
export function factorErroresTaller(e, maquina) {
  let f = 1;
  const disenadores = presentes(e, 'disenador').filter((x) => PUESTOS.disenador.variantes[x.variante].maquinas.includes(maquina));
  if (disenadores.length) f *= Math.min(...disenadores.map((x) => PUESTOS.disenador.variantes[x.variante].errores));
  if ((maquina === 'plancha30' || maquina === 'plancha1m') && !disenadores.some((x) => x.variante === 'textil')) f *= SIN_TEXTIL_ERRORES;
  if (e.leloGerente && e.equipo.empleados.some((x) => x.esLelo)) f *= LELO_GERENTE.errores;
  return f;
}

export function umbralCansancio(e) {
  return e.leloGerente && e.equipo.empleados.some((x) => x.esLelo) ? LELO_GERENTE.umbralCansancio : CANSANCIO.umbral;
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
  // Versión 3: préstamos que se repiten, confianza nueva, experiencia por máquina, local y mazo nuevo
  const p = e.prestamo;
  if (p.monto === undefined) {
    Object.assign(p, { numero: 1, monto: PRESTAMO.monto, inicio: 1 });
    if (p.opcion === 'A') p.total = PRESTAMO.A.total;
    else Object.assign(p, { cuota: PRESTAMO.B.cuota, cuotas: PRESTAMO.B.cuotas });
  }
  if (e.tio.historial === undefined) e.tio.historial = limitar(Math.round((e.tio.confianza ?? 50) / 2), 0, 50);
  if (!e.retraso) e.retraso = {};
  for (const emp of e.equipo.empleados) if (!emp.retraso) emp.retraso = {};
  if (!e.local) e.local = 'casa';
  if (e.horasAyuda === undefined) { e.horasAyuda = 0; e.horasPerdidas = 0; }
  if (!e.decisiones) { e.decisiones = e.decision ? [e.decision] : []; delete e.decision; }
  // Versión 4: la provincia
  if (!e.meta) e.meta = 'ciudad';
  for (const id of Object.keys(PRODUCTOS)) if (e.stock[id] === undefined) e.stock[id] = 0;
  for (const id of Object.keys(MAQUINAS)) if (e.maquinas[id] === undefined) e.maquinas[id] = false;
  if (!e.defensas) e.defensas = { proteccion: false, seguro: false };
  if (e.seguridad === undefined) e.seguridad = null;
  if (!e.cobros) e.cobros = [];
  if (!e.pedidosEmpresa) e.pedidosEmpresa = [];
  if (!e.empresas) e.empresas = { clientes: {}, proximo: {} };
  if (!e.licitacion) e.licitacion = { proxima: null, abierta: null, contrato: null };
  if (e.mejorDeLaCiudad && e.meta === 'ciudad' && !e.reconquista) iniciarProvincia(e);
  if (e.mazo.cartas.some((c) => !c.clase)) e.mazo = { trimestre: -1, cartas: [] };
  e.tio.confianza = confianzaTio(e);
  e.version = VERSION_PARTIDA;
  return e;
}

// Experiencia en una máquina: al comprar una nueva arrancás en ella con la mitad de tu experiencia.
// Lo que te falta (retraso) se recupera produciendo en esa máquina.
export function expEn(x, maquina) {
  return Math.max(0, x.exp - (x.retraso?.[maquina] || 0));
}

export function horasPorUnidad(e, idProducto) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - expEn(e, PRODUCTOS[idProducto].maquina) * 0.016);
}

// Curso de redes: cada punto hace que la publicidad rinda un 1% más.
export function horasPorVenta(e) {
  return VENTAS.horasPorVentaRedes * (1 - e.exp / 200) * (1 - e.formacion.cursos.redes / 100);
}

// Curso de sublimación: 10 puntos bajan los errores un 12,5% (40 puntos, a la mitad).
export function probabilidadError(e, maquina = 'tazas') {
  const f = e.formacion;
  const taller = e.equipo ? factorErroresTaller(e, maquina) : 1;
  return limitar(0.04 * (1 - expEn(e, maquina) / 125) * (1 + e.cansancio / 40) * (1 - f.fija / 200) * (1 - f.cursos.sublimacion / 80) * taller, 0.005, 0.5);
}

export function probabilidadErrorEmpleado(emp, maquina = 'tazas', e = null) {
  const variante = emp.esLelo ? 1 : PUESTOS[emp.puesto].variantes[emp.variante].errores ?? 1;
  const rasgo = emp.rasgo === 'prolijo' ? 0.5 : emp.rasgo === 'distraido' ? 1.5 : 1;
  const taller = e ? factorErroresTaller(e, maquina) : 1;
  return limitar(0.04 * (1 - expEn(emp, maquina) / 125) * variante * rasgo * taller, 0.005, 0.5);
}

// Curso de ventas: 10 puntos venden un 25% más en la feria.
export function multiplicadorFeria(e) {
  return (1 + (multiplicadorMercado(e) - 1) * 0.5) * (1 + e.formacion.cursos.ventas / 40);
}

export function stockTotal(e) {
  return Object.values(e.stock).reduce((s, x) => s + x, 0);
}

export function localActual(e) {
  return LOCALES[e.local || 'casa'];
}

export function luzDelMes(e) {
  return GASTOS_FIJOS.luz + localActual(e).luz + Object.keys(e.maquinas).filter((m) => e.maquinas[m])
    .reduce((s, m) => s + MAQUINAS[m].luzExtra, 0);
}

export function costoDefensas(e) {
  const d = e.defensas || {};
  return (d.proteccion ? DEFENSAS.proteccion.costo : 0) + (d.seguro ? DEFENSAS.seguro.costo : 0);
}

export function gastosFijosDelMes(e) {
  return luzDelMes(e) + GASTOS_FIJOS.internet + GASTOS_FIJOS.publicidad + localActual(e).alquiler + costoDefensas(e);
}

// Pago anticipado de la opción A: el interés se cobra proporcional a las semanas que pasaron.
// Sin préstamo, calcula el del primer préstamo (arranca en la semana 1).
export function costoPagoAnticipadoA(semana, p = { monto: PRESTAMO.monto, total: PRESTAMO.A.total, inicio: 1 }) {
  const transcurridas = limitar(semana - p.inicio + 1, 0, PRESTAMO.A.semanaVence);
  return Math.round(p.monto + (p.total - p.monto) * (transcurridas / PRESTAMO.A.semanaVence));
}

export function semanaVencimientoA(p) {
  return p.inicio + PRESTAMO.A.semanaVence - 1;
}

// ---------- Confianza del tío: historial de pago (hasta 50) + reputación (hasta 50) ----------
export function metasGanadas(e) {
  if (enProvincia(e)) return e.mejorDeLaProvincia ? 2 : 1;
  return 0;
}

export function confianzaTio(e) {
  const historial = limitar(e.tio.historial ?? CONFIANZA.historialInicial, 0, 50);
  let porRep = CONFIANZA.porMeta * metasGanadas(e) + e.rep / CONFIANZA.repDivisor;
  if (!metasGanadas(e) && e.rep < CONFIANZA.repMala && e.semana > 12) porRep += CONFIANZA.restaRepMala;
  return Math.round(historial + limitar(porRep, 0, 50));
}

function sumarHistorial(e, d) {
  e.tio.historial = limitar((e.tio.historial ?? CONFIANZA.historialInicial) + d, 0, 50);
  e.tio.confianza = confianzaTio(e);
}

// Próxima máquina en el orden del juego (o una que todavía no está en esta versión).
export function proximaMaquina(e) {
  const id = ORDEN_MAQUINAS.find((m) => !e.maquinas[m]);
  if (!id) return null;
  if (MAQUINAS[id]) return { id, ...MAQUINAS[id], disponible: true };
  return { id, ...MAQUINAS_FUTURAS[id], disponible: false };
}

// ¿Te presta el tío otra vez? Solo con el préstamo anterior pagado y sin estar enojado.
// El tope va del 25% al 75% del precio de la próxima máquina, según la confianza.
export function prestamoDisponible(e) {
  const p = e.prestamo;
  if (!p.pagado) return { ok: false, motivo: 'El tío te vuelve a prestar cuando termines de pagarle.' };
  if (e.tio.enojado) return { ok: false, motivo: 'El tío está enojado: no te va a prestar más.' };
  const m = proximaMaquina(e);
  if (!m) return { ok: false, motivo: 'Ya tenés todas las máquinas.' };
  if (!m.disponible) return { ok: false, motivo: `La próxima máquina es la ${m.nombre.toLowerCase()}: llega en la próxima versión del juego.` };
  const conf = confianzaTio(e);
  const parte = PRESTAMO.tope.min + (PRESTAMO.tope.max - PRESTAMO.tope.min) * (conf / 100);
  const tope = Math.floor((m.precio * parte) / 1000) * 1000;
  return { ok: true, maquina: m, tope, parte, confianza: conf };
}

export function pedirPrestamo(e, opcion, monto) {
  const d = prestamoDisponible(e);
  if (!d.ok) return d;
  if (e.semanaEnCurso) return { ok: false, motivo: 'Con el tío se habla el domingo.' };
  if (!['A', 'B'].includes(opcion)) return { ok: false, motivo: 'Elegí la opción A o la B.' };
  monto = Math.round(monto / 1000) * 1000;
  if (!(monto >= 10000)) return { ok: false, motivo: 'Pedile al menos $10.000.' };
  if (monto > d.tope) return { ok: false, motivo: `El tío te presta hasta ${plata$(d.tope)}.` };
  const numero = (e.prestamo.numero || 1) + 1;
  e.prestamo = opcion === 'A'
    ? { opcion: 'A', numero, monto, inicio: e.semana, total: Math.round(monto * (1 + PRESTAMO.interesA)), deuda: Math.round(monto * (1 + PRESTAMO.interesA)), pagado: false, vencido: false }
    : { opcion: 'B', numero, monto, inicio: e.semana, cuota: Math.round((monto * (1 + PRESTAMO.interesB)) / PRESTAMO.B.cuotas / 100) * 100, cuotas: PRESTAMO.B.cuotas, cuotasPagadas: 0, cuotasPerdonadas: 0, atrasadas: 0, pagado: false };
  e.plata += monto;
  const detalle = opcion === 'A'
    ? `me devolvés ${plata$(e.prestamo.total)} en un año, o menos si me pagás antes`
    : `me pagás ${e.prestamo.cuotas} cuotas de ${plata$(e.prestamo.cuota)}`;
  return { ok: true, mensaje: `Tío: "Te presto ${plata$(monto)} para la ${d.maquina.nombre.toLowerCase()}: ${detalle}. Confío en vos."` };
}

// Demanda esperada por producto (sin azar), para mostrar pistas al jugador.
export function demandaEsperada(e, idProducto, semana = e.semana, conCyber = false) {
  const p = PRODUCTOS[idProducto];
  if (!e.maquinas[p.maquina]) return 0;
  const c = calendario(semana);
  const temporada = p.temporada[c.estacion] ?? 1;
  const especial = multiplicadorFecha(semana, idProducto, conCyber);
  const ml = e.rep >= VENTAS.reputacionMercadoLibre || enProvincia(e) ? 1 + VENTAS.extraMercadoLibre : 1;
  return p.base * (1 + (multiplicadorMercado(e) - 1) * p.sens) * temporada * especial * ml;
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

export function cupoEquipo(e) {
  return localActual(e).cupo;
}

// Local: en tu casa entran 2 empleados; para más, alquilás un local (alquiler y luz por mes).
export function localesDisponibles(e) {
  return Object.keys(LOCALES).filter((id) => !LOCALES[id].desdeProvincia || enProvincia(e));
}

export function alquilarLocal(e, id = 'chico') {
  if (e.semanaEnCurso) return { ok: false, motivo: 'Eso se arregla el domingo.' };
  const l = LOCALES[id];
  if (!l || id === 'casa') return { ok: false, motivo: 'Ese local no existe.' };
  if ((e.local || 'casa') === id) return { ok: false, motivo: 'Ya estás en ese local.' };
  if (!localesDisponibles(e).includes(id)) return { ok: false, motivo: 'El local grande se consigue en la provincia.' };
  if (empleadosContratados(e) > l.cupo) return { ok: false, motivo: `En ${l.nombre.toLowerCase()} entran ${l.cupo} empleados: primero tenés que achicar el equipo.` };
  e.local = id;
  return { ok: true, mensaje: `Te mudaste a un ${l.nombre.toLowerCase()}: entran hasta ${l.cupo} empleados. Pagás ${plata$(l.alquiler)} de alquiler y ${plata$(l.luz)} más de luz por mes.` };
}

export function dejarLocal(e) {
  if (e.semanaEnCurso) return { ok: false, motivo: 'Eso se arregla el domingo.' };
  if ((e.local || 'casa') === 'casa') return { ok: false, motivo: 'Ya trabajás en tu casa.' };
  if (empleadosContratados(e) > LOCALES.casa.cupo) return { ok: false, motivo: `En tu casa entran ${LOCALES.casa.cupo} empleados: primero tenés que achicar el equipo.` };
  e.local = 'casa';
  return { ok: true, mensaje: 'Devolviste el local y volviste a trabajar en tu casa.' };
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
  const puestos = mezclar(e, ['operario', 'vendedor', enProvincia(e) ? 'disenador' : siguienteAzar(e) < 0.6 ? 'operario' : 'vendedor']);
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
  if (PUESTOS[puesto].desdeProvincia && !enProvincia(e)) return { ok: false, motivo: 'Los diseñadores se consiguen en la provincia.' };
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
  if (PUESTOS[puesto].desdeProvincia && !enProvincia(e)) return { ok: false, motivo: 'Los diseñadores se consiguen en la provincia.' };
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
    desganado: false, pideAumento: null, falta: false, semanasTrabajadas: 0, retraso: {},
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
  if (emp.esLelo && e.leloGerente) return 0;
  if (emp.puesto === 'disenador') return 0;
  let h = emp.esLelo ? LELO_EMPLEADO.horas : PUESTOS[emp.puesto].horas;
  if (emp.rasgo === 'rapido') h *= 1.2;
  if (emp.rasgo === 'creativo') h *= 0.9;
  if (emp.desganado) h *= EQUIPO.desganoQuejoso;
  if (sem?.capacitacion === 'curso') h -= CAPACITACION.curso.horas;
  if (sem?.feriaVendedor === emp.id) h -= VENTAS.feria.horas;
  if (sem?.volantesVendedor === emp.id) h -= VOLANTES.horas;
  return Math.max(0, redondear(h, 1));
}

export function presentes(e, puesto) {
  return e.equipo.empleados.filter((x) => !x.falta && (!puesto || x.puesto === puesto));
}

function horasPorUnidadEmp(emp, idProducto) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - expEn(emp, PRODUCTOS[idProducto].maquina) * 0.016);
}

function horasPorVentaExp(exp, cursoRedes = 0) {
  return VENTAS.horasPorVentaRedes * (1 - exp / 200) * (1 - cursoRedes / 100);
}

// Pedidos aceptados que piden envío a domicilio o diseño personalizado.
export function serviciosDeLaSemana(sem) {
  const activos = (sem?.pedidos || []).filter((p) => !p.rechazado && !p.tercerizado);
  return { envios: activos.filter((p) => p.envio).length, diseno: activos.filter((p) => p.diseno) };
}

// Diseñadores presentes que manejan la máquina de un producto.
function disenadoresDe(e, idProducto) {
  const maq = PRODUCTOS[idProducto].maquina;
  return presentes(e, 'disenador').filter((x) => PUESTOS.disenador.variantes[x.variante].maquinas.includes(maq));
}

// Chance de que un pedido traiga diseño personalizado: sube si tenés el diseñador de esa máquina.
export function probDiseno(e, idProducto) {
  const probs = disenadoresDe(e, idProducto).map((x) => PUESTOS.disenador.variantes[x.variante].probDiseno);
  return Math.max(SERVICIOS.diseno.prob, ...probs);
}

// Horas por semana que un diseñador dedica a los diseños personalizados.
export function horasDisenador(e, emp) {
  if (emp.falta) return 0;
  let h = PUESTOS.disenador.horasDiseno;
  if (emp.rasgo === 'creativo') h *= 0.9;
  if (emp.desganado) h *= EQUIPO.desganoQuejoso;
  return redondear(h, 1);
}

// Reparte la producción: primero los operarios (con sus horas), lo que no les entra lo hacés vos.
// Después, los envíos los hace un operario con horas libres (si no, vos), y el diseño personalizado lo hace
// el diseñador de esa máquina con sus horas (lo que no le entra, vos).
export function repartirProduccion(e, producir, sem = e.semanaEnCurso) {
  const operarios = presentes(e, 'operario').map((emp) => ({ emp, libres: horasEmpleado(e, emp, sem), unidades: {}, horas: 0, envios: 0 }));
  const vos = { unidades: {}, horas: 0, envios: 0, horasDiseno: 0 };
  for (const [id, n] of Object.entries(producir || {})) {
    for (let i = 0; i < (n || 0); i++) {
      const o = operarios.find((x) => x.libres + 1e-9 >= horasPorUnidadEmp(x.emp, id));
      if (o) {
        const h = horasPorUnidadEmp(o.emp, id);
        o.libres -= h; o.horas += h; o.unidades[id] = (o.unidades[id] || 0) + 1;
      } else {
        vos.horas += horasPorUnidad(e, id);
        vos.unidades[id] = (vos.unidades[id] || 0) + 1;
      }
    }
  }
  const serv = serviciosDeLaSemana(sem);
  for (let i = 0; i < serv.envios; i++) {
    const o = operarios.find((x) => x.libres + 1e-9 >= SERVICIOS.envio.horas);
    if (o) { o.libres -= SERVICIOS.envio.horas; o.horas += SERVICIOS.envio.horas; o.envios++; } else { vos.horas += SERVICIOS.envio.horas; vos.envios++; }
  }
  const disenadores = presentes(e, 'disenador').map((emp) => ({ emp, libres: horasDisenador(e, emp), horas: 0 }));
  for (const p of serv.diseno) {
    let falta = p.cantidad * horasPorUnidad(e, p.producto) * SERVICIOS.diseno.tiempoExtra;
    for (const d of disenadores.filter((x) => disenadoresDe(e, p.producto).includes(x.emp))) {
      const usa = Math.min(d.libres, falta);
      d.libres -= usa; d.horas += usa; falta -= usa;
    }
    vos.horasDiseno += falta;
  }
  vos.horas += vos.horasDiseno;
  return { operarios, vos, disenadores };
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
  if (enProvincia(e) && e.licitacion?.proxima && e.semana >= e.licitacion.proxima && !e.licitacion.abierta) abrirLicitacion(e, evento);
  if (e.leloVuelve && e.semana >= e.leloVuelve && leloDeViaje(e)) {
    e.leloVuelve = null;
    e.abuela = { pidiendo: false, veces: 0, rechazos: 0, proxima: e.semana, fin: false, acepto: false };
  }
  const ab = e.abuela;
  if (ab && !ab.fin && !ab.pidiendo && e.semana >= ab.proxima && ab.veces < ABUELA.veces) {
    ab.pidiendo = true;
    ab.veces++;
    evento?.(ab.veces === 1
      ? '👵 Te llamó la abuela: Lelo volvió de Santa Clara del Mar, no consigue trabajo y se le puso a llorar. Te pregunta si le podés dar trabajo en tu taller. Contestale el domingo.'
      : '👵 La abuela volvió a llamar: Lelo sigue sin conseguir trabajo. Te pregunta otra vez si le podés hacer un lugar en tu taller. Contestale el domingo.', 'oportunidad');
  }
}

// ---------- La abuela te pide trabajo para Lelo ----------
export function abuelaPide(e) {
  return Boolean(e.abuela?.pidiendo);
}

export function responderAbuela(e, acepta) {
  const ab = e.abuela;
  if (!ab?.pidiendo) return { ok: false, motivo: 'La abuela no te está pidiendo nada.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se decide el domingo.' };
  ab.pidiendo = false;
  const mover = (d) => {
    e.rep = limitar(redondear(e.rep + d), 0, 100);
    e.exp = limitar(redondear(e.exp + d), 0, 100);
    sumarHistorial(e, d);
  };
  const numero = (x) => String(x).replace('.', ',');
  if (acepta) {
    ab.fin = true;
    ab.acepto = true;
    sumarLelo(e);
    if (e.mejorDeLaProvincia) {
      e.leloGerente = true;
      e.equipo.empleados.find((x) => x.esLelo).sueldo = LELO_GERENTE.sueldo;
    }
    mover(ABUELA.bonus);
    return { ok: true, mensaje: `Le dijiste que sí. La abuela está chocha y Lelo arranca el lunes: no te ocupa un lugar en el equipo, trabaja ${LELO_EMPLEADO.horas} h por semana y cobra ${plata$(e.leloGerente ? LELO_GERENTE.sueldo : LELO_EMPLEADO.sueldo)} por mes. +${numero(ABUELA.bonus)} de reputación, de experiencia y de confianza del tío.` };
  }
  ab.rechazos++;
  const castigo = ABUELA.castigos[Math.min(ab.rechazos, ABUELA.castigos.length) - 1];
  mover(-castigo);
  let mensaje = `Lelo entiende. Lelo se va deprimido. Lelo va a seguir buscando un trabajo... La abuela se enojó con vos: −${numero(castigo)} de reputación, de experiencia y de confianza del tío.`;
  if (ab.veces >= ABUELA.veces) {
    ab.fin = true;
    mensaje += ' La abuela no te va a pedir más: Lelo, al no conseguir trabajo, canceló su suscripción a la vida.';
  } else ab.proxima = e.semana + ABUELA.cadaSemanas;
  return { ok: true, mensaje };
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
    retraso: {},
  });
}

export function leloDeViaje(e) {
  return Boolean(e.leloVuelve) && !e.equipo.empleados.some((x) => x.esLelo);
}

// ---------- Partida nueva ----------
export function nuevaPartida(opcionPrestamo, semilla = Date.now() >>> 0) {
  if (!['A', 'B'].includes(opcionPrestamo)) throw new Error('Opción de préstamo inválida');
  const e = {
    version: VERSION_PARTIDA,
    semilla,
    semana: 1,
    plata: PRESTAMO.monto - MAQUINAS.tazas.precio,
    maquinas: Object.fromEntries(Object.keys(MAQUINAS).map((id) => [id, id === 'tazas'])),
    stock: Object.fromEntries(Object.keys(PRODUCTOS).map((id) => [id, 0])),
    rep: 0,
    exp: 0,
    cansancio: 0,
    formacion: { fija: 0, cursos: { sublimacion: 0, redes: 0, ventas: 0 } },
    curso: { id: null, semanasRestantes: 0 },
    prestamo: opcionPrestamo === 'A'
      ? { opcion: 'A', numero: 1, monto: PRESTAMO.monto, inicio: 1, total: PRESTAMO.A.total, pagado: false, deuda: PRESTAMO.A.total, vencido: false }
      : { opcion: 'B', numero: 1, monto: PRESTAMO.monto, inicio: 1, cuota: PRESTAMO.B.cuota, cuotas: PRESTAMO.B.cuotas, cuotasPagadas: 0, cuotasPerdonadas: 0, atrasadas: 0, pagado: false },
    tio: { confianza: 0, historial: CONFIANZA.historialInicial, enojado: false },
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
    retraso: {}, // experiencia que te falta en cada máquina nueva
    local: 'casa',
    horasAyuda: 0, // horas extra de esta semana (alguien te da una mano: no cansan)
    horasPerdidas: 0, // horas que perdés esta semana (trámites, cortes, gripe...)
    decisiones: [], // cartas (o jugadas de Traicio) que esperan que elijas
    meta: 'ciudad',
    nombreTaller: null,
    traicio: null,
    defensas: { proteccion: false, seguro: false },
    seguridad: null, // { sueldo, sobornada }
    cobros: [], // pagos a 30 días de las empresas
    pedidosEmpresa: [],
    empresas: { clientes: {}, proximo: {} },
    licitacion: { proxima: null, abierta: null, contrato: null },
    volantesSemana: null,
    leloVuelve: null,
  };
  e.tio.confianza = confianzaTio(e);
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
  const compite = leloCompite(e);
  const hayRumor = compite && (e.primo.proximo === 'agresivo' || siguienteAzar(e) < PRIMO.rumor.probFalsaAlarma);
  // Si es falsa alarma, el rumor habla de una jugada que no va a pasar.
  e.primo.rumor = hayRumor ? `Rumor: ${PRIMO.jugadas[e.primo.jugada].rumor} Puede ser puro humo... o no.` : null;
}

// ---------- Mazo de eventos (balanceado por trimestre) ----------
// 6 cartas: 3 pares de tipos distintos (plata, horas, stock, reputación), uno chico, uno mediano
// y uno grande, con al menos 2 cartas que te hacen elegir. Cada par suma cero.
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

const TIPOS_CARTA = ['plata', 'horas', 'stock', 'reputacion'];
const TAMANOS = ['chica', 'mediana', 'grande'];

function decisionesDelPar(tipo, tamano) {
  const par = MAZO.cartas[tipo][tamano];
  return (par.mala.decision ? 1 : 0) + (par.buena.decision ? 1 : 0);
}

// Elige qué par va en cada tamaño. En el tutorial, el chico es de plata (la carta de la semana 6).
function elegirPares(e, tutorial) {
  let elegidos = null;
  for (let intento = 0; intento < 200; intento++) {
    const tipos = mezclar(e, [...TIPOS_CARTA]).slice(0, 3);
    const tamanos = mezclar(e, [...TAMANOS]);
    if (tutorial) {
      if (!tipos.includes('plata')) continue;
      const i = tipos.indexOf('plata');
      const j = tamanos.indexOf('chica');
      [tamanos[i], tamanos[j]] = [tamanos[j], tamanos[i]];
    }
    const pares = tipos.map((tipo, i) => ({ tipo, tamano: tamanos[i] }));
    elegidos = pares;
    if (pares.reduce((t, x) => t + decisionesDelPar(x.tipo, x.tamano), 0) >= MAZO.minDecisiones) break;
  }
  return elegidos;
}

function prepararMazo(e) {
  const trimestre = Math.floor((e.semana - 1) / 13);
  if (e.mazo.trimestre === trimestre) return;
  const base = baseMazo(e);
  let cartas = [];
  for (const { tipo, tamano } of elegirPares(e, trimestre === 0)) {
    const monto = Math.round((base * MAZO.tamanos[tamano]) / 1000) * 1000;
    for (const lado of ['mala', 'buena']) {
      const def = MAZO.cartas[tipo][tamano][lado];
      cartas.push({ tipo: lado, clase: tipo, tamano, monto, texto: def.texto, decision: def.decision || null });
    }
  }
  cartas = mezclar(e, cartas);
  const inicio = trimestre * 13 + 1;
  let semanas = [1, 3, 5, 7, 9, 11].map((d) => inicio + d);
  if (trimestre === 0) {
    // Tutorial: la primera carta sale en la semana 6 y es un gasto chico de plata.
    semanas = [6, 7, 9, 10, 11, 13];
    const idx = cartas.findIndex((c) => c.tipo === 'mala' && c.clase === 'plata' && c.tamano === 'chica');
    const [chica] = cartas.splice(idx, 1);
    cartas.unshift(chica);
  }
  e.mazo = { trimestre, cartas: cartas.map((c, i) => ({ ...c, semana: semanas[i] })) };
}

// Precio de referencia para pasar un monto a unidades de stock.
function precioReferencia(e) {
  const ids = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  return ids.reduce((t, id) => t + PRODUCTOS[id].precio, 0) / ids.length;
}

function aplicarCarta(e, carta, r, evento) {
  const signo = carta.tipo === 'mala' ? -1 : 1;
  const tipoEv = carta.tipo === 'mala' && carta.tamano === 'grande' ? 'desastre' : carta.tipo;
  if (carta.decision) {
    e.decisiones.push({ id: carta.decision, texto: carta.texto, monto: carta.monto });
    evento(`📌 ${carta.texto} Lo decidís el domingo.`, tipoEv);
    return;
  }
  if (carta.clase === 'plata') {
    e.plata += signo * carta.monto;
    if (signo < 0) r.gastos += carta.monto; else r.ingresos += carta.monto;
    evento(`${carta.texto} (${signo < 0 ? '−' : '+'}$${fmt(carta.monto)})`, tipoEv);
  } else if (carta.clase === 'horas') {
    const h = MAZO.horas[carta.tamano];
    if (signo < 0) e.horasPerdidas += h; else e.horasAyuda += h;
    evento(`${carta.texto} (la semana que viene tenés ${h} h ${signo < 0 ? 'menos' : 'más, que no te cansan'})`, tipoEv);
  } else if (carta.clase === 'stock') {
    const unidades = Math.max(1, Math.round(carta.monto / precioReferencia(e)));
    const cuenta = {};
    if (signo < 0) {
      let faltan = unidades;
      for (; faltan > 0; faltan--) { const id = venderUnaDelStock(e); if (!id) break; cuenta[id] = (cuenta[id] || 0) + 1; }
      const d = describirUnidades(cuenta);
      // Si no había tanto stock, se arruinan insumos
      const insumos = faltan > 0 ? Math.round((faltan * precioReferencia(e)) / 2 / 1000) * 1000 : 0;
      if (insumos) { e.plata -= insumos; r.gastos += insumos; }
      const texto = d ? carta.texto.replace('{u}', d) : carta.texto.replace(/: se (rompió|arruinó) \{u\}\./, '.');
      evento(`${texto}${insumos ? ` Se arruinaron insumos por $${fmt(insumos)}.` : ''}`, tipoEv);
    } else {
      const ids = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
      for (let i = 0; i < unidades; i++) { const id = ids[Math.floor(siguienteAzar(e) * ids.length)]; e.stock[id]++; cuenta[id] = (cuenta[id] || 0) + 1; }
      evento(carta.texto.replace('{u}', describirUnidades(cuenta)), tipoEv);
    }
  } else if (carta.clase === 'reputacion') {
    const d = signo * MAZO.rep[carta.tamano];
    e.rep = limitar(redondear(e.rep + d), 0, 100);
    r.rep = e.rep;
    evento(`${carta.texto} (${formatoRep(d)} de reputación)`, tipoEv);
  }
}

// ---------- Acciones fuera del turno ----------
export function comprarMaquina(e, id) {
  const m = MAQUINAS[id];
  if (!m) return { ok: false, motivo: 'Esa máquina no existe.' };
  if (e.maquinas[id]) return { ok: false, motivo: 'Ya tenés esa máquina.' };
  if (e.plata < m.precio) return { ok: false, motivo: `Te faltan $${fmt(m.precio - e.plata)} para comprarla.` };
  e.plata -= m.precio;
  e.maquinas[id] = true;
  // En la máquina nueva todos arrancan con la mitad de su experiencia
  e.retraso[id] = redondear(e.exp / 2, 1);
  for (const emp of e.equipo.empleados) { emp.retraso = emp.retraso || {}; emp.retraso[id] = redondear(emp.exp / 2, 1); }
  return { ok: true, mensaje: `¡Compraste la ${m.nombre.toLowerCase()}! La luz sube $${fmt(m.luzExtra)} por mes. Es una máquina nueva: arrancás con la mitad de tu experiencia en ella y la vas recuperando produciendo.` };
}

export function pagarPrestamoA(e) {
  const p = e.prestamo;
  if (p.opcion !== 'A' || p.pagado) return { ok: false, motivo: 'No hay nada para pagar.' };
  const monto = p.vencido ? p.deuda : costoPagoAnticipadoA(e.semana, p);
  if (e.plata < monto) return { ok: false, motivo: `Necesitás $${fmt(monto)} y tenés $${fmt(e.plata)}.` };
  e.plata -= monto;
  e.finanzas.mesActual -= monto;
  p.pagado = true;
  p.deuda = 0;
  if (!p.vencido) {
    const adelanto = Math.max(0, semanaVencimientoA(p) - e.semana);
    sumarHistorial(e, Math.min(CONFIANZA.maxPagoAnticipado, CONFIANZA.pagoATiempo + Math.floor(adelanto / CONFIANZA.adelantoPorSemanas)));
    return { ok: true, mensaje: `Le pagaste $${fmt(monto)} al tío. Tío: "¡Así me gusta! Cuando quieras otra máquina, hablamos."` };
  }
  e.tio.enojado = false;
  e.tio.confianza = confianzaTio(e);
  return { ok: true, mensaje: `Saldaste la deuda de $${fmt(monto)}. El tío se ablandó un poco.` };
}

export function puedeHacerPromo(e) {
  return Boolean(e.primo.rumor) && leloCompite(e);
}

// Horas que tenés esta semana: 40, más las que te da alguien que te ayuda, menos las que perdiste.
export function horasDisponibles(e) {
  return Math.max(0, HORAS_POR_SEMANA + (e.horasAyuda || 0) - (e.horasPerdidas || 0));
}

// ---------- Cartas que te hacen elegir ----------
export function resolverDecision(e, opcion) {
  const d = e.decisiones[0];
  if (!d) return { ok: false, motivo: 'No hay nada para decidir.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se decide el domingo.' };
  const def = MAZO.decisiones[d.id];
  if (!def?.opciones[opcion]) return { ok: false, motivo: 'Esa opción no existe.' };
  const gastar = (m) => { e.plata -= m; e.finanzas.mesActual -= m; };
  let mensaje = '';
  switch (`${d.id}.${opcion}`) {
    case 'resistencia.tecnico': gastar(d.monto); mensaje = `Vino el técnico y la dejó como nueva (−${plata$(d.monto)}).`; break;
    case 'resistencia.vos': {
      const repuestos = Math.round((d.monto * 0.4) / 1000) * 1000;
      gastar(repuestos);
      e.horasPerdidas += 6;
      if (siguienteAzar(e) < 1 / 3) { gastar(d.monto); mensaje = `La desarmaste entera (−${plata$(repuestos)} y 6 h)... y no quedó bien. Hubo que llamar al técnico igual (−${plata$(d.monto)}).`; }
      else mensaje = `La arreglaste vos con un tutorial de YouTube: −${plata$(repuestos)} en repuestos y 6 h de esta semana.`;
      break;
    }
    case 'cumple15.acepta':
      e.plata += d.monto; e.finanzas.mesActual += d.monto; e.horasPerdidas += 6; e.cansancio = limitar(e.cansancio + 5, 0, 100);
      mensaje = `Aceptaste los souvenirs del cumpleaños de 15: +${plata$(d.monto)}, pero te lleva 6 h de esta semana.`; break;
    case 'cumple15.rechaza': mensaje = 'Le dijiste que no a la quinceañera. Lloró un poco, pero ya se le va a pasar.'; break;
    case 'gripe.trabaja': e.cansancio = limitar(e.cansancio + 30, 0, 100); mensaje = 'Trabajás con gripe: no perdés horas, pero estás destruido (+30 de cansancio).'; break;
    case 'gripe.descansa': e.horasPerdidas += 16; mensaje = 'Hacés reposo con té con miel: perdés 16 h esta semana.'; break;
    case 'lote.reclama': e.horasPerdidas += 4; mensaje = 'Reclamaste y te cambiaron el lote. Entre llamadas y viajes se te fueron 4 h.'; break;
    case 'lote.usa':
      if (siguienteAzar(e) < 0.5) { e.rep = limitar(redondear(e.rep - 2), 0, 100); mensaje = 'Usaste el lote fallado y un cliente lo notó: −2 de reputación.'; }
      else mensaje = 'Usaste el lote fallado y nadie se dio cuenta. Zafaste.';
      break;
    case 'quejoso.contesta': e.horasPerdidas += 2; e.rep = limitar(redondear(e.rep - 1), 0, 100); mensaje = 'Le contestaste con buena onda: −1 de reputación y 2 h de esta semana.'; break;
    case 'quejoso.ignora': e.rep = limitar(redondear(e.rep - 2), 0, 100); mensaje = 'Lo ignoraste y la queja juntó comentarios: −2 de reputación.'; break;
    case 'tintura.limpia': case 'tintura.tira': mensaje = resolverTintura(e, d, opcion === 'limpia'); break;
    case 'propaganda.desmiente': e.horasPerdidas += 3; e.rep = limitar(redondear(e.rep - 1 * d.factor), 0, 100); mensaje = `Lo desmentiste en todas las redes: −${formatoRep(d.factor).replace('+', '')} de reputación y 3 h de esta semana.`; break;
    case 'propaganda.ignora': e.rep = limitar(redondear(e.rep - 2 * d.factor), 0, 100); mensaje = `Lo dejaste pasar y mucha gente se lo creyó: ${formatoRep(-2 * d.factor)} de reputación.`; break;
    case 'roboEmpleado.iguala': case 'roboEmpleado.deja': mensaje = resolverRoboEmpleado(e, d, opcion === 'iguala'); break;
    default: return { ok: false, motivo: 'Esa opción no existe.' };
  }
  e.decisiones.shift();
  return { ok: true, mensaje };
}

// ---------- Horas y costos ----------
// Horas del domingo: publicidad, promo, feria y curso (el que está en marcha o el que arranca).
// Son tus horas: lo que hace el equipo no cuenta acá.
export function horasDomingo(e, pub) {
  let horas = (pub.horasRedes || 0) + (pub.promo ? PROMO.horas : 0) + (pub.feria && !pub.feriaVendedor ? VENTAS.feria.horas : 0);
  const idCurso = e.curso.semanasRestantes > 0 ? e.curso.id : pub.curso;
  if (idCurso) horas += CURSOS[idCurso].horasPorSemana;
  if (fuisteALaBolsa(e)) horas += EQUIPO.bolsa.horas;
  if (pub.volantes && !pub.volantesVendedor) horas += VOLANTES.horas;
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
  if (e.decisiones.length) errores.push('Antes de arrancar, decidí qué hacer con lo que pasó.');
  if (abuelaPide(e)) errores.push('Antes de arrancar, contestale a la abuela.');
  if (pub.promo && !puedeHacerPromo(e)) errores.push('La promo de contraataque solo se puede lanzar cuando hay un rumor sobre Lelo.');
  if (pub.cyber && !esSemanaCyber(e.semana)) errores.push('El CyberMonday no es esta semana.');
  if (pub.volantesVendedor) {
    const v = presentes(e, 'vendedor').find((x) => x.id === pub.volantesVendedor);
    if (!pub.volantes) errores.push('Para mandar a alguien a repartir volantes, marcá "Repartir volantes".');
    else if (!v || horasEmpleado(e, v, { capacitacion: pub.capacitar, feriaVendedor: pub.feriaVendedor }) < VOLANTES.horas) errores.push('Ese vendedor no tiene horas para repartir volantes esta semana.');
  }
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
  if (total > horasDisponibles(e)) errores.push(`Te pasaste de horas: ${total} de ${horasDisponibles(e)}.`);
  const costo = (pub.feria ? VENTAS.feria.costoMesa : 0) + (pub.curso ? CURSOS[pub.curso].costo : 0) + costoCapacitacion(e, pub.capacitar)
    + (pub.volantes ? VOLANTES.costo : 0);
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
  const compite = leloCompite(e);
  const horas = pub.horasRedes || 0;

  // Lelo hace lo que planeó la semana anterior
  const comp = PRIMO.comportamientos.find((x) => x.id === (e.primo.proximo || sortearComportamiento(e)));
  const habiaRumor = Boolean(e.primo.rumor);
  e.primo.comportamiento = comp.id;
  const jugada = PRIMO.jugadas[e.primo.jugada ?? Math.floor(siguienteAzar(e) * PRIMO.jugadas.length)];
  const ataque = jugada.ataque;
  const oferta = PRIMO.ofertas[Math.floor(siguienteAzar(e) * PRIMO.ofertas.length)];
  // La promo de contraataque falla 1 de cada 10 veces: pagás el descuento y Lelo te saca clientes igual.
  const promoFalla = Boolean(pub.promo) && siguienteAzar(e) < PROMO.falla;
  const promoFunciona = Boolean(pub.promo) && !promoFalla;
  if (compite) {
    if (pub.promo) enDia(0, '📣 Lanzaste la promo de contraataque.', 'buena');
    if (promoFunciona) {
      if (comp.id === 'agresivo') {
        enDia(1, `😤 ${ataque}.. pero tu promo ya estaba en todos lados.`, 'info');
        evento('¡Tu promo frenó a Lelo! Su campaña no te sacó ningún pedido y encima te llegaron clientes nuevos.', 'buena');
      } else {
        evento('Lanzaste la promo, pero el rumor era humo: Lelo ni apareció. Igual te llegaron algunos clientes más.', 'info');
      }
    } else {
      if (promoFalla) evento('Tu promo no prendió: casi nadie la vio. Pagaste el descuento y Lelo te sacó clientes igual.', 'mala');
      if (habiaRumor && comp.id !== 'agresivo') evento('El rumor era humo: Lelo no hizo ninguna jugada agresiva.', 'buena');
      else if (habiaRumor) evento('El rumor era cierto.', 'mala');
      if (comp.id === 'agresivo') {
        evento(`${ataque} Te sacó clientes.`, 'mala');
        enDia(1, `😤 ${ataque}`, 'mala');
      } else if (comp.id === 'ofertas') {
        evento(oferta.texto, 'mala');
        enDia(2, `🏷️ ${oferta.texto}`, 'mala');
      } else {
        evento(comp.texto, 'info');
      }
    }
  }
  let sacaLelo = compite && !promoFunciona ? comp.saca : 0;
  // Si repartís volantes la misma semana que Lelo reparte los suyos, los de él rinden la mitad.
  if (sacaLelo && pub.volantes && comp.id === 'agresivo' && jugada.volantes) {
    sacaLelo /= 2;
    evento('Tus volantes taparon los de Lelo: su remate rindió la mitad.', 'buena');
  }
  const pistaLelo = () => {
    if (promoFalla) return PRIMO.pistaPromoFallida;
    if (comp.id === 'agresivo') return jugada.pista;
    if (comp.id === 'ofertas') return oferta.pista;
    return PRIMO.pistasTranquilo[Math.floor(siguienteAzar(e) * PRIMO.pistasTranquilo.length)];
  };

  // Lelo de viaje después de cerrar su taller
  if (leloDeViaje(e) && siguienteAzar(e) < LELO_VIAJE.probFoto) {
    enDia(1 + Math.floor(siguienteAzar(e) * 5), `🏖️ ${LELO_VIAJE.fotos[Math.floor(siguienteAzar(e) * LELO_VIAJE.fotos.length)]}`, 'info');
  }

  // El equipo: quién faltó, Chuchu dando vueltas y capacitación
  const semEquipo = { capacitacion: pub.capacitar || null, feriaVendedor: pub.feriaVendedor || null, volantesVendedor: pub.volantesVendedor || null };
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
  const extraPromo = promoFunciona ? 1 + PROMO.extraDemanda : 1;
  // Volantes: +15% esta semana y +7% la siguiente
  let extraVolantes = e.volantesSemana === e.semana - 1 ? 1 + VOLANTES.extraSiguiente : 1;
  if (pub.volantes) {
    extraVolantes *= 1 + VOLANTES.extra;
    e.volantesSemana = e.semana;
  }

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

  if (pub.volantes) {
    e.plata -= VOLANTES.costo;
    gastosDomingo += VOLANTES.costo;
    const quien = pub.volantesVendedor ? e.equipo.empleados.find((x) => x.id === pub.volantesVendedor)?.nombre : null;
    enDia(0, `📄 ${quien ? `${quien} repartió` : 'Repartiste'} volantes por todo el barrio.`, 'buena');
  }
  if (pub.cyber) enDia(0, `💻 Te sumaste al CyberMonday: ${Math.round(CYBER.descuento * 100)}% de descuento en todo.`, 'buena');

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
    const malTraicio = e.traicio?.malDemanda && e.semana <= e.traicio.malDemanda.hasta ? e.traicio.malDemanda.factor : 1;
    mercado[id] = Math.max(0, Math.round(demandaEsperada(e, id, e.semana, Boolean(pub.cyber)) * empuje * extraPromo * extraVolantes * malTraicio * entre(e, 0.8, 1.2)));
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

  // Se arman los pedidos (1 a 3 unidades cada uno) y llegan en distintos días. Lelo te pelea cada uno:
  // algunos clientes te piden y después cancelan porque se lo pidieron a él.
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
      if (siguienteAzar(e) < sacaLelo) {
        pedido.dia = Math.min(pedido.dia, 5);
        pedido.diaCancela = pedido.dia + 1 + Math.floor(siguienteAzar(e) * (6 - pedido.dia));
        pedido.pista = pistaLelo();
        deLelo.push(pedido);
      } else {
        pedido.envio = siguienteAzar(e) < SERVICIOS.envio.prob;
        pedido.diseno = siguienteAzar(e) < probDiseno(e, id);
        if (e.mejorDeLaCiudad) pedido.factorTerc = redondear(entre(e, TERCERIZAR.min, TERCERIZAR.max), 3);
        pedidos.push(pedido);
      }
    }
  }
  pedidos.sort((a, b) => a.dia - b.dia);
  const extras = (p) => `${p.envio ? ' Quiere que se lo lleves a la casa 🚚.' : ''}${p.diseno ? ' Trae su propio diseño 🎨.' : ''}`;
  for (const p of [...pedidos, ...deLelo].sort((a, b) => a.dia - b.dia)) {
    enDia(p.dia, `📩 ${capitalizar(p.cliente)} te pidió ${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}.${p.diaCancela === undefined ? extras(p) : ''}`, 'pedido');
  }
  // Cancelaciones: con muchas el mismo día, se agrupan
  for (let d = 0; d < 7; d++) {
    const del = deLelo.filter((p) => p.diaCancela === d);
    if (!del.length) continue;
    if (del.length >= PRIMO.agruparDesde) {
      enDia(d, `❌ ${del.length} clientes cancelaron y se fueron con Lelo (${del[0].pista}).`, 'mala');
    } else {
      for (const p of del) enDia(d, `❌ ${capitalizar(p.cliente)} canceló: ${p.pista}. Se lo pidió a Lelo.`, 'mala');
    }
  }
  if (deLelo.length) {
    const u = unidadesPedidas({ pedidos: deLelo });
    const detalle = Object.keys(u).filter((id) => u[id]).map((id) => `${u[id]} ${nombreUnidades(id, u[id])}`).join(', ');
    evento(`${deLelo.length} cliente${deLelo.length > 1 ? 's cancelaron' : ' canceló'} y se fue${deLelo.length > 1 ? 'ron' : ''} con Lelo (${detalle}).`, 'mala');
  }

  // Empresas de la provincia: cada tanto te encargan pedidos grandes con plazo
  if (enProvincia(e)) {
    for (const tipo of ['catering', 'colectivos']) {
      if (e.empresas.proximo[tipo] && e.semana >= e.empresas.proximo[tipo]) nuevaOfertaEmpresa(e, tipo, enDia, evento);
    }
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
    semana: e.semana, horasRedes: horas, promo: Boolean(pub.promo), cyber: Boolean(pub.cyber), volantes: Boolean(pub.volantes), horasDomingo: horasDomingo(e, { ...pub, curso: null }),
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
  const mult = vendedor ? (1 + (multiplicadorMercado(e) - 1) * 0.5) * (1 + vendedor.exp / 120) : multiplicadorFeria(e);
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
  if (horas > horasDisponibles(e)) errores.push(`Te pasaste de horas: ${horas} de ${horasDisponibles(e)}.`);
  const costo = costoDelPlan(plan);
  if (costo > 0 && costo > e.plata) errores.push(`No te alcanza la plata: necesitás $${fmt(costo)} y tenés $${fmt(e.plata)}.`);
  return { ok: errores.length === 0, errores, horas, costo };
}

// Descuento de la semana en los pedidos de redes (promo o CyberMonday; no se suman).
export function precioRedesSemana(sem) {
  return 1 - Math.max(sem?.promo ? PROMO.descuento : 0, sem?.cyber ? CYBER.descuento : 0);
}

// Precio de un pedido, con descuento y servicios especiales.
export function precioPedido(p, sem) {
  const recargo = (p.envio ? SERVICIOS.envio.recargo : 0) + (p.diseno ? SERVICIOS.diseno.recargo : 0);
  return Math.round(p.cantidad * PRODUCTOS[p.producto].precio * precioRedesSemana(sem) * (1 + recargo));
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
  const precioRedes = precioRedesSemana(sem);
  let deltaRep = 0;
  let repBruta = 0; // lo que ganás de reputación con tu trabajo (para medir tu ritmo)
  const factorRep = enProvincia(e) ? PROVINCIA.factorRepVenta : 1;
  const sumarRep = (x) => { deltaRep += x; repBruta += x; };

  // 1. Producción: cada uno hace su parte y cada uno tiene su probabilidad de error
  const reparto = repartirProduccion(e, plan.producir, sem);
  let producidas = 0;
  // Cada máquina tiene su experiencia: producir en una máquina nueva te pone al día el doble de rápido
  const fabricar = (x, unidades, pErrorEn, quien, aprende = 1) => {
    let hechas = 0;
    let intentos = 0;
    const arruinadas = {};
    for (const [id, n] of Object.entries(unidades)) {
      const maq = PRODUCTOS[id].maquina;
      const pError = pErrorEn(maq);
      for (let i = 0; i < n; i++) {
        e.plata -= PRODUCTOS[id].costo;
        r.gastos += PRODUCTOS[id].costo;
        intentos++;
        if (x.retraso?.[maq]) x.retraso[maq] = Math.max(0, redondear(x.retraso[maq] - 0.08 * aprende, 2));
        if (siguienteAzar(e) < pError) { arruinadas[id] = (arruinadas[id] || 0) + 1; continue; }
        e.stock[id] += 1;
        hechas++;
      }
    }
    for (const [id, cant] of Object.entries(arruinadas)) {
      evento(`${quien} ${cant} ${nombreUnidades(id, cant)} en la prensa (perdiste $${fmt(cant * PRODUCTOS[id].costo)} de insumo).`, 'mala');
    }
    producidas += hechas;
    return { hechas, intentos };
  };
  const tuyas = fabricar(e, reparto.vos.unidades, (m) => probabilidadError(e, m), 'Se te arruinaron');
  e.exp = limitar(e.exp + tuyas.intentos * 0.08, 0, 100);
  let delEquipo = 0;
  for (const o of reparto.operarios) {
    const emp = o.emp;
    const aprende = emp.esLelo ? 1 : PUESTOS.operario.variantes[emp.variante].aprende;
    const res = fabricar(emp, o.unidades, (m) => probabilidadErrorEmpleado(emp, m, e), `${emp.nombre} arruinó`, aprende);
    delEquipo += res.hechas;
    emp.exp = limitar(redondear(emp.exp + res.intentos * 0.08 * aprende, 1), 0, 100);
    if (emp.rasgo === 'creativo') sumarRep(res.hechas * EQUIPO.repCreativo * factorRep);
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
    if (p.tercerizado || e.stock[p.producto] >= p.cantidad) {
      if (p.tercerizado) {
        // Si la tercerizadora le erra, perdés el pedido y el insumo que pusiste (no le pagás el trabajo).
        if (siguienteAzar(e) < TERCERIZAR.falla) {
          const insumo = PRODUCTOS[p.producto].costo * p.cantidad;
          e.plata -= insumo; r.gastos += insumo;
          deltaRep += TERCERIZAR.repFalla;
          evento(`🏭 La tercerizadora le erró a la calidad del pedido de ${p.cliente} (${nombre}): perdiste el pedido y el insumo (−${plata$(insumo)}, −0,02 de reputación).`, 'desastre');
          continue;
        }
        const costo = Math.round(PRODUCTOS[p.producto].precio * p.cantidad * (p.factorTerc || TERCERIZAR.max));
        e.plata -= costo; r.gastos += costo;
      } else e.stock[p.producto] -= p.cantidad;
      const ingreso = precioPedido(p, sem);
      e.plata += ingreso;
      r.ingresos += ingreso;
      sumarRep((p.cantidad * REPUTACION.porVenta + (p.envio ? SERVICIOS.envio.rep : 0)) * factorRep);
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
    if (v.rasgo === 'creativo') sumarRep((entregados * EQUIPO.repCreativo * factorRep) / vendedoresSem.length);
    const comision = PUESTOS.vendedor.variantes[v.variante].comision;
    if (comision && r.ingresos > 0) {
      const monto = Math.round((r.ingresos * comision) / vendedoresSem.length);
      e.plata -= monto;
      r.gastos += monto;
      evento(`Comisión de ${v.nombre}: $${fmt(monto)}.`);
    }
  }
  void precioRedes;
  // Provincia: pedidos de empresas, cobros y licitaciones
  cerrarEmpresas(e, r, evento, sumarRep);
  if (e.licitacion.abierta && e.licitacion.abierta.semana === e.semana) resolverLicitacion(e, r, evento);
  entregarLicitacion(e, r, evento, sumarRep);
  const activos = sem.pedidos.filter((p) => !p.rechazado).length;
  if (activos) linea(`Entregaste ${entregados} de ${activos} pedidos (${unidadesEntregadas} productos).`);
  const serv = serviciosDeLaSemana(sem);
  if (serv.envios || serv.diseno.length) {
    const partes = [];
    if (reparto.vos.envios || serv.envios) partes.push(`${serv.envios} envío${serv.envios === 1 ? '' : 's'} a domicilio${reparto.vos.envios ? ` (${reparto.vos.envios} los hiciste vos)` : ' (los hizo tu equipo)'}`);
    if (serv.diseno.length) partes.push(`${serv.diseno.length} diseño${serv.diseno.length === 1 ? '' : 's'} personalizado${serv.diseno.length === 1 ? '' : 's'}${reparto.disenadores.some((d) => d.horas > 0) ? (reparto.vos.horasDiseno > 0 ? ' (parte los hizo tu diseñador)' : ' (los hizo tu diseñador)') : ''}`);
    linea(`Servicios especiales: ${partes.join(' y ')}.`);
  }
  else if (!sem.pedidos.length) linea('No llegaron pedidos esta semana.');

  // 3. Lo del domingo: feria y curso
  const feria = sem.feria;
  let vendidasFeria = 0;
  if (feria) {
    r.ingresos += feria.ingresos;
    sumarRep(feria.rep * factorRep);
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
  // Las horas en que alguien te dio una mano no te cansan
  const horas = Math.max(0, v.horas - (e.horasAyuda || 0));
  const umbral = umbralCansancio(e);
  e.cansancio = horas > umbral
    ? limitar(e.cansancio + (horas - umbral) * CANSANCIO.sube, 0, 100)
    : limitar(e.cansancio - (umbral - horas) * CANSANCIO.baja, 0, 100);
  e.cansancio = redondear(e.cansancio, 1);
  if (e.cansancio >= 80) evento('Estás reventado. Si seguís así te vas a mandar macanas: descansá o contratá a alguien.', 'mala');
  e.horasAyuda = 0;
  e.horasPerdidas = 0;

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
  if (e.meta === 'ciudad') e.primo.rep = limitar(redondear(e.primo.rep + avance * 0.5 + entre(e, 0, 0.3)), 0, PRIMO.repMax);

  // 7. Carta del mazo
  prepararMazo(e);
  const carta = e.mazo.cartas.find((x) => x.semana === e.semana && !x.usada);
  if (carta) {
    carta.usada = true;
    aplicarCarta(e, carta, r, evento);
  }

  // 7b. Traicio: avanza, sabotea y te quiere robar gente
  if (enProvincia(e) && !e.mejorDeLaProvincia && e.traicio) semanaDeTraicio(e, r, evento, repBruta);

  e.finanzas.mesActual += r.ingresos - r.gastos;

  // 8. Vencimiento de la opción A, cierre de mes y fin de año
  const pr = e.prestamo;
  if (pr.opcion === 'A' && !pr.pagado && !pr.vencido && e.semana >= semanaVencimientoA(pr)) vencePrestamoA(e, r, evento);
  if (c.finDeMes) cierreDeMes(e, c, r, evento);
  if (c.semanaEnAnio === SEMANAS_POR_ANIO) finDeAnio(e, r, evento);

  // 9. Metas: ciudad (o reconquista) y provincia
  if (e.meta === 'ciudad' && e.rep >= REPUTACION.meta && !e.fin) {
    if (!e.mejorDeLaCiudad) {
      e.mejorDeLaCiudad = true;
      r.hito = 'mejorDeLaCiudad';
      e.leloVuelve = e.semana + 1 + LELO_VIAJE.semanas;
      evento('¡Lograste ser el mejor de la ciudad! Lelo se dio cuenta de que no tenía nada que hacer contra tu majestuosidad: cerró el taller, vendió la máquina de tazas y con la plata se fue un mes a Santa Clara del Mar.', 'hito');
      evento(`Arranca la pelea por la provincia contra ${TRAICIO.nombre}, de ${TRAICIO.empresa}. Tu reputación en la provincia arranca en 0, pero el mercado es el doble de grande.`, 'hito');
      iniciarProvincia(e);
    } else if (e.reconquista) {
      reconquistarCiudad(e, r, evento);
    }
  } else if (enProvincia(e) && !e.mejorDeLaProvincia && e.traicio) {
    if (e.rep >= REPUTACION.meta) ganarProvincia(e, r, evento);
    else if (e.traicio.rep >= REPUTACION.meta) perderProvincia(e, r, evento);
  }
  if (repInicial < VENTAS.reputacionMercadoLibre && e.rep >= VENTAS.reputacionMercadoLibre) {
    evento('Con tu reputación, Mercado Libre empieza a traerte pedidos en serio.', 'buena');
  }

  e.tio.confianza = confianzaTio(e);
  r.plata = e.plata;
  r.rep = e.rep;
  r.repDelta = redondear(e.rep - repInicial);
  e.semana += 1;
  e.semanaEnCurso = null;

  // 10. Lelo planea la semana que viene (puede correr un rumor) y se prepara el equipo
  planearPrimo(e);
  inicioDeSemana(e, evento);
  if (e.primo.rumor) evento(e.primo.rumor, 'rumor');
  const rumorT = rumorTraicio(e);
  if (rumorT) evento(rumorT, 'rumor');
  e.ultimoResumen = r;
  return { ok: true, resumen: r };
}

// Atajo para simulaciones: publicidad + producción en una sola llamada.
// plan.producir puede ser un objeto o una función (semanaEnCurso) => objeto.
export function jugarSemana(e, plan) {
  for (let i = 0; i < 10 && e.decisiones.length; i++) {
    const d = e.decisiones[0];
    resolverDecision(e, plan.decision?.[d.id] || Object.keys(MAZO.decisiones[d.id].opciones)[0]);
  }
  if (abuelaPide(e)) responderAbuela(e, plan.abuela ?? true);
  const p = publicar(e, {
    horasRedes: plan.horasRedes || 0, promo: plan.promo, feria: plan.feria, curso: plan.curso,
    capacitar: plan.capacitar, feriaVendedor: plan.feriaVendedor, volantes: plan.volantes, volantesVendedor: plan.volantesVendedor, cyber: plan.cyber,
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
  evento(`Cierre de ${c.nombreMes.toLowerCase()}: pagaste $${fmt(gastos)} de gastos fijos (luz, internet, publicidad${localActual(e).alquiler ? ', alquiler' : ''}${costoDefensas(e) ? ', protección y seguro' : ''}).`);
  cierreEquipo(e, r, evento);
  if (e.seguridad) {
    e.plata -= e.seguridad.sueldo; r.gastos += e.seguridad.sueldo; e.finanzas.mesActual -= e.seguridad.sueldo;
    evento(`Pagaste ${plata$(e.seguridad.sueldo)} a la persona de seguridad.`);
  }
  if (enProvincia(e) && !e.mejorDeLaProvincia && e.traicio) vozDeAdentro(e, c, evento);

  const p = e.prestamo;
  if (p.opcion === 'B' && !p.pagado && e.semana > p.inicio - 1) {
    const numeroCuota = p.cuotasPagadas + p.cuotasPerdonadas + p.atrasadas + 1;
    const atrasadasAntes = p.atrasadas;
    if (p.numero === 1 && c.mes === PRESTAMO.B.mesPerdonado && c.anio === 1) {
      p.cuotasPerdonadas++;
      evento('Tío: "Esta cuota no me la pagues: es mi regalo de cumpleaños."', 'buena');
    } else if (numeroCuota <= p.cuotas) {
      p.atrasadas++;
    }
    // Pagar lo que se pueda (cuotas del mes + atrasadas)
    let pagadas = 0;
    while (p.atrasadas > 0 && e.plata >= p.cuota) {
      e.plata -= p.cuota;
      r.gastos += p.cuota;
      e.finanzas.mesActual -= p.cuota;
      p.atrasadas--;
      p.cuotasPagadas++;
      pagadas++;
      evento(`Pagaste la cuota ${p.cuotasPagadas + p.cuotasPerdonadas} de ${p.cuotas} al tío ($${fmt(p.cuota)}).`);
    }
    // Cuota del mes a tiempo: +1 de confianza. Si quedó alguna sin pagar, −10.
    if (pagadas > atrasadasAntes) sumarHistorial(e, CONFIANZA.cuotaATiempo);
    if (p.atrasadas > 0) {
      sumarHistorial(e, CONFIANZA.atraso);
      evento(`No te alcanzó para la cuota. Le debés ${p.atrasadas} al tío y no está contento.`, 'mala');
    }
    if (p.cuotasPagadas + p.cuotasPerdonadas >= p.cuotas) {
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

function vencePrestamoA(e, r, evento) {
  const p = e.prestamo;
  if (e.plata >= p.total) {
    e.plata -= p.total;
    r.gastos += p.total;
    p.pagado = true;
    p.deuda = 0;
    sumarHistorial(e, CONFIANZA.pagoATiempo);
    evento(`Venció el préstamo y le pagaste los $${fmt(p.total)} al tío. Cumplidor.`, 'buena');
  } else {
    p.vencido = true;
    e.tio.enojado = true;
    sumarHistorial(e, CONFIANZA.vencido);
    evento('Venció el préstamo y no llegaste. El tío está furioso: la deuda ahora crece un 10% por mes.', 'mala');
  }
}

function finDeAnio(e, r, evento) {
  const tuyo = e.rep;
  const delPrimo = e.primo.rep;
  r.fiestas = { tuyo, delPrimo };
  if (enProvincia(e)) evento(`Fiestas: el tío levanta la copa por ${nombreDelTaller(e)}. ${e.mejorDeLaProvincia ? 'El mejor de la provincia: nadie habla de otra cosa.' : `Todos te preguntan por ${TRAICIO.empresa}.`}`, 'buena');
  else if (e.mejorDeLaCiudad && leloDeViaje(e)) evento('Fiestas: Lelo mandó un audio desde la playa para brindar. Todos te miran con respeto.', 'buena');
  else if (e.mejorDeLaCiudad && !e.reconquista && e.equipo.empleados.some((x) => x.esLelo)) evento('Fiestas: Lelo brinda por su jefe. Todos te miran con respeto.', 'buena');
  else if (tuyo >= delPrimo) evento(`Fiestas: el tío los compara delante de toda la familia. Tu reputación ${Math.round(tuyo)} contra ${Math.round(delPrimo)} de Lelo. "¡Este pibe va a llegar lejos!"`, 'buena');
  else evento(`Fiestas: el tío los compara delante de toda la familia. Tu reputación ${Math.round(tuyo)} contra ${Math.round(delPrimo)} de Lelo. "Che, ¿y vos qué estuviste haciendo todo el año?"`, 'mala');
}

// =====================================================================
// ---------- Provincia: Traicio Nero, defensas, empresas y licitaciones ----------
// =====================================================================

export function iniciarProvincia(e, revancha = false) {
  e.meta = 'provincia';
  e.reconquista = false;
  e.rep = 0;
  e.traicio = {
    rep: revancha ? PROVINCIA.repTraicioRevancha : PROVINCIA.repTraicioInicial,
    visible: null, mesVisible: null, alertaDada: false,
    factor: redondear(entre(e, TRAICIO.factorMin, TRAICIO.factorMax), 3),
    ganancias: [],
    sabotaje: null, // { semana, id, conRumor }
    roboUltimo: e.semana, robo: null, // { semana, empId }
    malDemanda: null, // { factor, hasta }
  };
  e.empresas.proximo = { catering: e.semana + enteroEntre(e, 2, 4), colectivos: e.semana + enteroEntre(e, 5, 8) };
  e.licitacion.proxima = e.semana + enteroEntre(e, LICITACION.cada.min, LICITACION.cada.max);
  e.licitacion.abierta = null;
  planearSabotaje(e);
}

export function nombreDelTaller(e) {
  return e.nombreTaller || 'tu taller';
}

export function ponerNombreTaller(e, nombre) {
  const n = String(nombre || '').trim().slice(0, 40);
  if (!n) return { ok: false, motivo: 'Escribí un nombre para tu taller.' };
  e.nombreTaller = n;
  return { ok: true, mensaje: `Desde ahora competís como "${n}".` };
}

// Si Traicio te gana la provincia: volvés a la ciudad con 75 y Lelo renuncia para competirte.
function perderProvincia(e, r, evento) {
  e.meta = 'ciudad';
  e.reconquista = true;
  e.rep = PROVINCIA.repAlPerder;
  const trabajaba = e.equipo.empleados.some((x) => x.esLelo);
  const desaparecido = !trabajaba && e.abuela?.fin && !e.abuela.acepto;
  r.textoLelo = trabajaba
    ? 'Lelo vio tu ineptitud para manejar algo grande: renunció y vuelve a intentarlo solo. Ahora es tu competencia.'
    : desaparecido
      ? 'Sorpresa: Lelo fingió su muerte. En realidad estaba escondido en la Patagonia, y ahora volvió a abrir su taller para competirte.'
      : 'Lelo dejó de buscar trabajo y volvió a abrir su taller para competirte.';
  e.leloGerente = false;
  e.leloVuelve = null;
  e.abuela = null;
  e.equipo.empleados = e.equipo.empleados.filter((x) => !x.esLelo);
  e.primo.rep = PROVINCIA.repLeloAlVolver;
  e.pedidosEmpresa = [];
  e.licitacion.abierta = null;
  if (e.traicio) e.traicio.sabotaje = null;
  r.hito = 'perdisteProvincia';
  evento(`${TRAICIO.empresa} llegó primero: ${TRAICIO.nombre} es el mejor de la provincia. Perdiste el título y volvés a pelear la ciudad. ${r.textoLelo}`, 'hito');
}

function ganarProvincia(e, r, evento) {
  e.mejorDeLaProvincia = true;
  e.rep = 100;
  if (e.traicio) e.traicio.sabotaje = null;
  const lelo = e.equipo.empleados.find((x) => x.esLelo);
  if (lelo) { e.leloGerente = true; lelo.sueldo = LELO_GERENTE.sueldo; }
  r.hito = 'mejorDeLaProvincia';
  r.leloAsciende = Boolean(lelo);
  evento(`¡${nombreDelTaller(e)} es el mejor de la provincia! ${TRAICIO.nombre} cerró Talleres Judas.${lelo ? ` Lelo asciende a gerente de operaciones: deja de producir, pero baja los errores de todo el taller y te cansás menos (${plata$(LELO_GERENTE.sueldo)} por mes).` : ''}`, 'hito');
}

// Volver a ganar la ciudad después de perder la provincia: Lelo se rinde y se va otra vez de viaje.
function reconquistarCiudad(e, r, evento) {
  e.leloVuelve = e.semana + 1 + LELO_VIAJE.semanas;
  e.abuela = null;
  iniciarProvincia(e, true);
  r.hito = 'reconquista';
  evento(`¡Volviste a ser el mejor de la ciudad! Lelo se rindió otra vez: cerró el taller y se fue un mes a Santa Clara del Mar. Arranca otra vez la pelea por la provincia: ${TRAICIO.nombre} te espera con ${PROVINCIA.repTraicioRevancha} de reputación.`, 'hito');
}

// ---------- Ritmo de Traicio: un 3-5% más lento que el tuyo, con un piso ----------
function avanzarTraicio(e, repBruta) {
  const t = e.traicio;
  t.ganancias.push(repBruta);
  if (t.ganancias.length > TRAICIO.ventanaRitmo) t.ganancias.shift();
  const promedio = t.ganancias.reduce((a, b) => a + b, 0) / t.ganancias.length;
  const ruido = 1 + TRAICIO.ruido * (siguienteAzar(e) * 2 - 1);
  t.rep = limitar(redondear(t.rep + t.factor * Math.max(promedio, TRAICIO.ritmoMinimo) * ruido), 0, 100);
}

// ---------- Sabotajes ----------
function planearSabotaje(e) {
  const ids = Object.keys(TRAICIO.sabotajes);
  e.traicio.sabotaje = {
    semana: e.semana + enteroEntre(e, TRAICIO.sabotajeCada.min, TRAICIO.sabotajeCada.max),
    id: ids[Math.floor(siguienteAzar(e) * ids.length)],
    conRumor: siguienteAzar(e) < TRAICIO.probConRumor,
  };
}

export function rumorTraicio(e) {
  const s = e.traicio?.sabotaje;
  if (!enProvincia(e) || e.mejorDeLaProvincia || !s || !s.conRumor || s.semana !== e.semana) return null;
  return `Rumor: ${TRAICIO.sabotajes[s.id].rumor}`;
}

export function mediaSeguridad(e) {
  return Math.round((SEGURIDAD.sueldo * e.equipo.mercado) / 1000) * 1000;
}

function seguridadActiva(e) {
  return Boolean(e.seguridad) && !e.seguridad.sobornada;
}

// Sale el sabotaje planeado para esta semana (se aplica al cerrarla).
function ejecutarSabotaje(e, r, evento) {
  const s = e.traicio.sabotaje;
  planearSabotaje(e);
  const def = TRAICIO.sabotajes[s.id];
  const sinAviso = !s.conRumor;
  // Si le pagás poco a la persona de seguridad, Traicio la puede comprar (y deja de avisar)
  if (e.seguridad && !e.seguridad.sobornada && e.seguridad.sueldo < mediaSeguridad(e) && siguienteAzar(e) < SEGURIDAD.probSoborno) {
    e.seguridad.sobornada = true;
  }
  if (seguridadActiva(e) && siguienteAzar(e) < SEGURIDAD.frena) {
    evento(`🔦 Tu persona de seguridad agarró a un empleado de ${TRAICIO.empresa} merodeando de noche. Sabotaje frenado.`, 'buena');
    return;
  }
  const proteccion = Boolean(e.defensas.proteccion) && sinAviso;
  if (proteccion && siguienteAzar(e) < 0.5) return; // las cámaras lo espantaron sin que te enteres
  const dano = proteccion ? 0.5 : 1;
  const seguro = e.defensas.seguro ? 0.5 : 1;
  const prefijo = `🗡️ ${sinAviso ? 'A traición: ' : ''}`;
  const base = baseMazo(e);
  switch (s.id) {
    case 'resenas': {
      const d = -1 * dano;
      e.rep = limitar(redondear(e.rep + d), 0, 100);
      evento(`${prefijo}${def.texto} (${formatoRep(d)} de reputación)`, 'desastre');
      break;
    }
    case 'hablaMal':
      e.traicio.malDemanda = { factor: 1 - 0.1 * dano, hasta: e.semana + 2 };
      evento(`${prefijo}${def.texto}`, 'desastre');
      break;
    case 'soborno': {
      const h = 4 * dano;
      e.horasPerdidas += h;
      evento(`${prefijo}${def.texto} (−${h} h)`, 'desastre');
      break;
    }
    case 'tintura': {
      const tazas = ['tazaCeramica', 'tazaPlastico'].reduce((t, id) => t + e.stock[id], 0);
      if (!tazas) { evento(`${prefijo}${def.texto.split(':')[0]}. Por suerte no tenías tazas guardadas.`, 'info'); break; }
      e.decisiones.push({ id: 'tintura', texto: def.texto, monto: Math.round((base * 0.2 * dano * seguro) / 1000) * 1000, dano });
      evento(`${prefijo}${def.texto} Lo decidís el domingo.`, 'desastre');
      break;
    }
    case 'propaganda':
      e.decisiones.push({ id: 'propaganda', texto: def.texto, factor: dano });
      evento(`${prefijo}${def.texto} Lo decidís el domingo.`, 'desastre');
      break;
    case 'entregaTrucha': {
      const d = -2 * dano;
      e.rep = limitar(redondear(e.rep + d), 0, 100);
      evento(`${prefijo}${def.texto} (${formatoRep(d)} de reputación)`, 'desastre');
      break;
    }
    case 'roboCliente': {
      const vivos = e.pedidosEmpresa.filter((p) => !p.tercerizar);
      if (vivos.length) {
        const p = vivos.sort((a, b) => b.precio - a.precio)[0];
        e.pedidosEmpresa = e.pedidosEmpresa.filter((x) => x !== p);
        delete e.empresas.clientes[p.cliente];
        evento(`${prefijo}${TRAICIO.nombre} se quedó con el pedido de ${p.cliente} a último momento. Y no vuelve más.`, 'desastre');
      } else {
        const fijo = Object.keys(e.empresas.clientes).find((c) => e.empresas.clientes[c].fijo);
        if (fijo) { delete e.empresas.clientes[fijo]; evento(`${prefijo}${TRAICIO.nombre} convenció a ${fijo}: dejó de ser tu cliente fijo.`, 'desastre'); }
        else { e.traicio.malDemanda = { factor: 1 - 0.2 * dano, hasta: e.semana + 2 }; evento(`${prefijo}${TRAICIO.nombre} les ofreció precios de remate a tus mejores clientes: por un par de semanas te van a pedir menos.`, 'desastre'); }
      }
      break;
    }
    default: break;
  }
}

function resolverTintura(e, d, limpia) {
  const ids = ['tazaCeramica', 'tazaPlastico'];
  const parte = limpia ? 0.3 * d.dano : 0.5 * d.dano;
  const perdidas = {};
  for (const id of ids) {
    const n = Math.round(e.stock[id] * parte);
    e.stock[id] -= n;
    if (n) perdidas[id] = n;
  }
  const texto = describirUnidades(perdidas) || 'ninguna taza';
  if (limpia) {
    e.plata -= d.monto; e.finanzas.mesActual -= d.monto;
    return `Pagaste la limpieza (${plata$(d.monto)}${e.defensas.seguro ? ', el seguro cubrió la mitad' : ''}) y se perdieron ${texto}.`;
  }
  return `Tiraste lo que olía mal: se perdieron ${texto}.`;
}

// ---------- Robo de empleado ----------
function planearRoboEmpleado(e, evento) {
  const t = e.traicio;
  if (t.robo || e.semana - t.roboUltimo < TRAICIO.roboEmpleado.cadaSemanas) return;
  const candidatos = e.equipo.empleados.filter((x) => !x.esLelo);
  if (!candidatos.length || siguienteAzar(e) >= TRAICIO.roboEmpleado.prob) return;
  const emp = candidatos[Math.floor(siguienteAzar(e) * candidatos.length)];
  t.robo = { semana: e.semana + 1, empId: emp.id };
  t.roboUltimo = e.semana;
  if (seguridadActiva(e)) evento(`🔦 Tu persona de seguridad vio a ${TRAICIO.nombre} hablando con ${emp.nombre} a la salida. Le está por hacer una oferta.`, 'rumor');
}

function ejecutarRoboEmpleado(e, evento) {
  const t = e.traicio;
  const emp = e.equipo.empleados.find((x) => x.id === t.robo.empId);
  t.robo = null;
  if (!emp) return;
  const oferta = Math.round((emp.sueldo * (1 + TRAICIO.roboEmpleado.aumento)) / 1000) * 1000;
  if (emp.leal) { evento(`${TRAICIO.nombre} le ofreció a ${emp.nombre} ${plata$(oferta)} por mes. Le dijo que no: "a mí me trajo Chuchu".`, 'buena'); return; }
  e.decisiones.push({ id: 'roboEmpleado', texto: `${TRAICIO.nombre} le ofreció a ${emp.nombre} ${plata$(oferta)} por mes (hoy cobra ${plata$(emp.sueldo)}).`, empId: emp.id, oferta });
  evento(`🗡️ ${TRAICIO.nombre} le ofreció a ${emp.nombre} un 25% más de sueldo. Lo decidís el domingo.`, 'mala');
}

function resolverRoboEmpleado(e, d, iguala) {
  const emp = e.equipo.empleados.find((x) => x.id === d.empId);
  if (!emp) return 'Ya no estaba en tu equipo.';
  if (iguala) { emp.sueldo = d.oferta; emp.desganado = false; return `Igualaste la oferta: ${emp.nombre} se queda y ahora cobra ${plata$(emp.sueldo)}.`; }
  const media = mediaSueldo(e, emp.puesto, emp.variante);
  const r = TRAICIO.roboEmpleado;
  const prob = emp.sueldo < media * 0.97 ? r.seVaDebajo : emp.sueldo > media * 1.03 ? r.seVaArriba : r.seVaMedia;
  if (siguienteAzar(e) < prob) {
    e.equipo.empleados = e.equipo.empleados.filter((x) => x !== emp);
    return `${emp.nombre} agarró la oferta y se fue a ${TRAICIO.empresa}. Lo trabajado se le paga a fin de mes.`;
  }
  return `${emp.nombre} lo pensó y se quedó con vos.`;
}

// ---------- Defensas ----------
export function cambiarDefensa(e, id, activa) {
  if (!DEFENSAS[id]) return { ok: false, motivo: 'Esa defensa no existe.' };
  if (!enProvincia(e)) return { ok: false, motivo: 'Las defensas se contratan en la provincia.' };
  e.defensas[id] = Boolean(activa);
  return { ok: true, mensaje: activa ? `Contrataste ${DEFENSAS[id].nombre.toLowerCase()}: ${plata$(DEFENSAS[id].costo)} por mes.` : `Diste de baja ${DEFENSAS[id].nombre.toLowerCase()}.` };
}

export function contratarSeguridad(e) {
  if (!enProvincia(e)) return { ok: false, motivo: 'La persona de seguridad se contrata en la provincia.' };
  if (e.seguridad) return { ok: false, motivo: 'Ya tenés una persona de seguridad.' };
  e.seguridad = { sueldo: mediaSeguridad(e), sobornada: false, semanasMes: 0 };
  return { ok: true, mensaje: `Contrataste una persona de seguridad para la noche (${plata$(e.seguridad.sueldo)} por mes). No ocupa lugar en el equipo.` };
}

export function despedirSeguridad(e) {
  if (!e.seguridad) return { ok: false, motivo: 'No tenés persona de seguridad.' };
  e.seguridad = null;
  return { ok: true, mensaje: 'Despediste a la persona de seguridad.' };
}

// Subirle el sueldo a la media la vuelve a poner de tu lado (si Traicio la había comprado).
export function subirSueldoSeguridad(e) {
  if (!e.seguridad) return { ok: false, motivo: 'No tenés persona de seguridad.' };
  e.seguridad.sueldo = Math.max(e.seguridad.sueldo, Math.round((mediaSeguridad(e) * 1.1) / 1000) * 1000);
  e.seguridad.sobornada = false;
  return { ok: true, mensaje: `Le subiste el sueldo a la persona de seguridad: ahora cobra ${plata$(e.seguridad.sueldo)}.` };
}

// ---------- Clientes empresa ----------
function nuevaOfertaEmpresa(e, tipo, enDia, evento) {
  const def = EMPRESAS[tipo];
  e.empresas.proximo[tipo] = e.semana + enteroEntre(e, def.cada.min, def.cada.max);
  const conocidos = Object.keys(e.empresas.clientes).filter((c) => e.empresas.clientes[c].tipo === tipo);
  const cliente = conocidos.length && siguienteAzar(e) < 0.7 ? conocidos[0] : def.nombres[Math.floor(siguienteAzar(e) * def.nombres.length)];
  const info = e.empresas.clientes[cliente];
  const dia = 1 + Math.floor(siguienteAzar(e) * 4);
  if (!info?.fijo && siguienteAzar(e) < EMPRESAS.probTraicioSeLoLleva && !e.mejorDeLaProvincia) {
    enDia(dia, `🏢 ${cliente} pidió presupuesto... y se lo dio a ${TRAICIO.empresa}.`, 'mala');
    evento(`${cliente} le dio su pedido a ${TRAICIO.empresa}. Con 3 entregas a tiempo, un cliente se vuelve fijo y ya no te lo pelean.`, 'mala');
    return;
  }
  const items = {};
  for (const it of def.items) items[it.producto] = enteroEntre(e, it.min, it.max);
  const precio = Math.round(Object.entries(items).reduce((t, [id, n]) => t + n * PRODUCTOS[id].precio, 0) * (1 - def.descuento));
  const cobro = def.cobroLargo && siguienteAzar(e) < def.probCobroLargo ? def.cobroLargo : def.cobroSemanas;
  e.pedidosEmpresa.push({
    id: `emp${e.semana}-${tipo}`, tipo, cliente, items, precio, vence: e.semana + def.plazo, cobro,
    estado: 'oferta', tercerizar: false, factorTerc: redondear(entre(e, TERCERIZAR.min, TERCERIZAR.max), 3), fijo: Boolean(info?.fijo),
  });
  enDia(dia, `🏢 ${cliente}${info?.fijo ? ' (cliente fijo)' : ''} te encargó ${describirUnidades(items)} para dentro de ${def.plazo} semanas.`, 'oportunidad');
}

export function responderPedidoEmpresa(e, id, acepta) {
  const p = e.pedidosEmpresa.find((x) => x.id === id);
  if (!p || p.estado !== 'oferta') return { ok: false, motivo: 'Ese pedido ya no está.' };
  if (acepta) { p.estado = 'aceptado'; return { ok: true }; }
  e.pedidosEmpresa = e.pedidosEmpresa.filter((x) => x !== p);
  return { ok: true, mensaje: `Le dijiste que no a ${p.cliente}.` };
}

export function tercerizarPedidoEmpresa(e, id, si = true) {
  const p = e.pedidosEmpresa.find((x) => x.id === id);
  if (!p || p.estado !== 'aceptado') return { ok: false, motivo: 'Primero aceptá el pedido.' };
  if (!e.mejorDeLaCiudad) return { ok: false, motivo: 'La tercerización se habilita al ser el mejor de la ciudad.' };
  p.tercerizar = Boolean(si);
  return { ok: true };
}

// Lo que falta para los pedidos de empresa aceptados (que no tercerizás).
export function unidadesEmpresa(e) {
  const u = Object.fromEntries(Object.keys(PRODUCTOS).map((id) => [id, 0]));
  for (const p of e.pedidosEmpresa) if (p.estado === 'aceptado' && !p.tercerizar) for (const [id, n] of Object.entries(p.items)) u[id] += n;
  return u;
}

// Entregas, vencimientos y cobros de las empresas (al cerrar la semana).
function cerrarEmpresas(e, r, evento, sumarRep) {
  const quedan = [];
  for (const p of e.pedidosEmpresa.sort((a, b) => a.vence - b.vence)) {
    if (p.estado === 'oferta') { evento(`No le contestaste a ${p.cliente} y se buscó otro taller.`, 'info'); continue; }
    const hayStock = Object.entries(p.items).every(([id, n]) => e.stock[id] >= n);
    if (p.tercerizar || hayStock) {
      if (p.tercerizar) {
        if (siguienteAzar(e) < TERCERIZAR.falla) {
          const insumo = Object.entries(p.items).reduce((t, [id, n]) => t + PRODUCTOS[id].costo * n, 0);
          e.plata -= insumo; r.gastos += insumo;
          e.rep = limitar(redondear(e.rep + TERCERIZAR.repFalla), 0, 100);
          evento(`🏭 La tercerizadora le erró a la calidad del pedido de ${p.cliente}: perdiste el pedido y el insumo (−${plata$(insumo)}, −0,02 de reputación).`, 'desastre');
          continue;
        }
        const costo = Math.round(p.precio * p.factorTerc);
        e.plata -= costo; r.gastos += costo;
      } else {
        for (const [id, n] of Object.entries(p.items)) e.stock[id] -= n;
      }
      e.cobros.push({ semana: e.semana + p.cobro, monto: p.precio, cliente: p.cliente });
      const c = (e.empresas.clientes[p.cliente] = e.empresas.clientes[p.cliente] || { tipo: p.tipo, entregas: 0, fijo: false });
      c.entregas++;
      sumarRep(EMPRESAS.repEntrega);
      let texto = `Entregaste el pedido de ${p.cliente}${p.tercerizar ? ' (tercerizado)' : ''}: te paga ${plata$(p.precio)} en ${p.cobro} semanas (+${EMPRESAS.repEntrega} de reputación).`;
      if (!c.fijo && c.entregas >= EMPRESAS.entregasParaFijo) { c.fijo = true; texto += ` ${p.cliente} ahora es cliente fijo.`; }
      evento(texto, 'buena');
      continue;
    }
    if (e.semana >= p.vence) {
      e.rep = limitar(redondear(e.rep + EMPRESAS.repNoEntrega), 0, 100);
      delete e.empresas.clientes[p.cliente];
      evento(`No llegaste con el pedido de ${p.cliente}: ${EMPRESAS.repNoEntrega} de reputación y no te pide más.`, 'mala');
      continue;
    }
    quedan.push(p);
  }
  e.pedidosEmpresa = quedan;
  // Cobros a 30 días
  const vencidos = e.cobros.filter((c) => c.semana <= e.semana);
  for (const c of vencidos) {
    e.plata += c.monto; r.ingresos += c.monto;
    evento(`💰 ${c.cliente} te pagó ${plata$(c.monto)}.`, 'buena');
  }
  e.cobros = e.cobros.filter((c) => c.semana > e.semana);
}

export function porCobrar(e) {
  return (e.cobros || []).reduce((t, c) => t + c.monto, 0);
}

// ---------- Licitaciones de clubes del ascenso ----------
function abrirLicitacion(e, evento) {
  const L = LICITACION;
  e.licitacion.proxima = e.semana + enteroEntre(e, L.cada.min, L.cada.max);
  if (e.licitacion.contrato) return;
  const rivales = [{ nombre: TRAICIO.empresa, rep: e.mejorDeLaProvincia ? 0 : e.traicio.rep, calidad: 70, esTraicio: true }];
  if (e.mejorDeLaProvincia) rivales.length = 0;
  const talleres = mezclar(e, [...L.talleres]);
  const n = enteroEntre(e, L.rivales.min, L.rivales.max);
  for (let i = 0; i < n; i++) rivales.push({ nombre: talleres[i], rep: Math.round(entre(e, L.rivales.repMin, L.rivales.repMax)), calidad: Math.round(entre(e, 40, 80)) });
  for (const x of rivales) x.oferta = Math.round((L.precioRef * entre(e, L.rivales.ofertaMin, L.rivales.ofertaMax)) / 1000) * 1000;
  const club = L.clubes[Math.floor(siguienteAzar(e) * L.clubes.length)];
  e.licitacion.abierta = { semana: e.semana, club, rivales, oferta: null };
  evento?.(`🏟️ ${club} abrió una licitación: ${L.combos} combos para dentro de un mes. Se ofertan el domingo.`, 'oportunidad');
}

export function calidadLicitacion(e) {
  const deportivo = presentes(e, 'disenador').some((x) => x.variante === 'deportivo');
  return limitar(Math.round((expEn(e, 'calandra') + formacionTotal(e)) / 2 + (deportivo ? 20 : 0)), 0, 100);
}

export function ofertarLicitacion(e, precio) {
  const a = e.licitacion.abierta;
  if (!a || a.semana !== e.semana) return { ok: false, motivo: 'No hay ninguna licitación abierta.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se oferta el domingo.' };
  if (!e.maquinas.calandra) return { ok: false, motivo: 'Para participar necesitás la calandra.' };
  if (precio === null) { a.oferta = null; return { ok: true }; }
  if (!(precio >= 10000)) return { ok: false, motivo: 'Poné un precio por combo.' };
  a.oferta = Math.round(precio / 1000) * 1000;
  return { ok: true, mensaje: `Ofertaste ${plata$(a.oferta)} por combo. El resultado sale al cerrar la semana.` };
}

function resolverLicitacion(e, r, evento) {
  const a = e.licitacion.abierta;
  e.licitacion.abierta = null;
  if (!a.oferta) { evento(`La licitación de ${a.club} se la llevó otro taller.`, 'info'); return; }
  const L = LICITACION;
  const todos = [...a.rivales, { nombre: nombreDelTaller(e), rep: e.rep, calidad: calidadLicitacion(e), oferta: a.oferta, vos: true }];
  const min = Math.min(...todos.map((x) => x.oferta));
  for (const x of todos) x.puntaje = L.pesos.precio * 100 * (min / x.oferta) + L.pesos.rep * x.rep + L.pesos.calidad * x.calidad;
  const ganador = todos.sort((x, y) => y.puntaje - x.puntaje)[0];
  if (!ganador.vos) { evento(`La licitación de ${a.club} la ganó ${ganador.nombre} con ${plata$(ganador.oferta)} por combo.`, 'mala'); return; }
  const total = a.oferta * L.combos;
  const sena = Math.round(total * L.sena);
  e.plata += sena; r.ingresos += sena;
  e.licitacion.contrato = { club: a.club, combos: L.combos, precio: a.oferta, sena, vence: e.semana + L.plazo };
  evento(`🏆 ¡Ganaste la licitación de ${a.club}! ${L.combos} combos a ${plata$(a.oferta)} cada uno. Te adelantaron ${plata$(sena)} de seña. Plazo: ${L.plazo} semanas.`, 'buena');
}

// El contrato se entrega cuando tenés todos los combos o al vencer (con multa por lo que falte).
function entregarLicitacion(e, r, evento, sumarRep) {
  const c = e.licitacion.contrato;
  if (!c) return;
  if (e.stock.combo < c.combos && e.semana < c.vence) return;
  const L = LICITACION;
  const entregados = Math.min(e.stock.combo, c.combos);
  const faltan = c.combos - entregados;
  e.stock.combo -= entregados;
  const saldo = entregados * c.precio - c.sena;
  const multa = faltan * L.costo * L.multa;
  e.plata += saldo - multa;
  if (saldo >= 0) r.ingresos += saldo; else r.gastos -= saldo;
  r.gastos += multa;
  e.licitacion.contrato = null;
  if (!faltan) {
    sumarRep(L.repGanada);
    evento(`Entregaste los ${c.combos} combos de ${c.club}: cobraste ${plata$(saldo)} más (+${L.repGanada} de reputación).`, 'buena');
  } else {
    e.rep = limitar(redondear(e.rep + L.repIncompleta), 0, 100);
    evento(`Al vencer el plazo entregaste ${entregados} de ${c.combos} combos a ${c.club}. ${saldo >= 0 ? `Cobraste ${plata$(saldo)}` : `Devolviste ${plata$(-saldo)} de seña`} y pagaste ${plata$(multa)} de multa (${L.repIncompleta} de reputación).`, 'mala');
  }
}

// ---------- Tercerizar un pedido de redes (desde que sos el mejor de la ciudad) ----------
export function tercerizarPedido(e, idPedido, si = true) {
  const p = e.semanaEnCurso?.pedidos.find((x) => x.id === idPedido);
  if (!p) return { ok: false, motivo: 'Ese pedido no está.' };
  if (!e.mejorDeLaCiudad) return { ok: false, motivo: 'La tercerización se habilita al ser el mejor de la ciudad.' };
  p.tercerizado = Boolean(si);
  if (si) p.rechazado = false;
  return { ok: true };
}

// Terceriza exactamente los pedidos de esta lista (los demás vuelven a producirse). Los rechazados no se tocan.
export function tercerizarVarios(e, ids) {
  const sem = e.semanaEnCurso;
  if (!sem) return { ok: false, motivo: 'No hay pedidos esta semana.' };
  if (!e.mejorDeLaCiudad) return { ok: false, motivo: 'La tercerización se habilita al ser el mejor de la ciudad.' };
  const lista = new Set(ids);
  for (const p of sem.pedidos) if (!p.rechazado) p.tercerizado = lista.has(p.id);
  const n = sem.pedidos.filter((p) => p.tercerizado).length;
  return { ok: true, mensaje: n ? `Tercerizaste ${n} pedido${n > 1 ? 's' : ''}.` : 'No tercerizás ningún pedido.' };
}

export function tercerizarTodo(e) {
  return tercerizarVarios(e, (e.semanaEnCurso?.pedidos || []).filter((p) => !p.rechazado).map((p) => p.id));
}

// Terceriza los pedidos que no llegás a cubrir con tu stock y lo que pensás producir (en el orden de entrega).
export function tercerizarResto(e, producir = {}) {
  const sem = e.semanaEnCurso;
  if (!sem) return { ok: false, motivo: 'No hay pedidos esta semana.' };
  const hay = Object.fromEntries(Object.keys(PRODUCTOS).map((id) => [id, (e.stock[id] || 0) + (producir[id] || 0)]));
  const ids = [];
  for (const p of sem.pedidos) {
    if (p.rechazado) continue;
    if (p.tercerizado) { ids.push(p.id); continue; }
    if (hay[p.producto] >= p.cantidad) hay[p.producto] -= p.cantidad;
    else ids.push(p.id);
  }
  return tercerizarVarios(e, ids);
}

// ---------- La semana de Traicio (al cerrar cada semana en la provincia) ----------
function semanaDeTraicio(e, r, evento, repBruta) {
  const t = e.traicio;
  avanzarTraicio(e, repBruta);
  if (t.robo && t.robo.semana === e.semana) ejecutarRoboEmpleado(e, evento);
  else planearRoboEmpleado(e, evento);
  if (t.sabotaje && t.sabotaje.semana === e.semana) ejecutarSabotaje(e, r, evento);
  if (t.malDemanda && t.malDemanda.hasta < e.semana + 1) t.malDemanda = null;
}

// La Voz de Adentro publica una vez por mes cómo viene Talleres Judas.
function vozDeAdentro(e, c, evento) {
  const t = e.traicio;
  t.visible = Math.round(t.rep);
  t.mesVisible = c.nombreMes;
  const chisme = VOZ_DE_ADENTRO[Math.floor(siguienteAzar(e) * VOZ_DE_ADENTRO.length)];
  evento(`📰 La Voz de Adentro: "${TRAICIO.empresa} ya tiene ${t.visible} de reputación en la provincia." Además: ${chisme}`, 'info');
  if (t.rep >= TRAICIO.alerta && !t.alertaDada) {
    t.alertaDada = true;
    evento(`📰 La Voz de Adentro, en tapa: "${TRAICIO.empresa} está a un paso de ser el mejor de la provincia."`, 'mala');
  }
}

export function fmt(n) {
  return Math.round(n).toLocaleString('es-AR');
}

export {
  HORAS_POR_SEMANA, PRODUCTOS, MAQUINAS, CURSOS, VENTAS, PRESTAMO, TUTORIAL, PROMO, CANSANCIO, PUESTOS, RASGOS, EQUIPO, CAPACITACION,
  MAZO, LOCALES, VOLANTES, SERVICIOS, CYBER, TRAICIO, LELO_VIAJE, PROVINCIA, LELO_GERENTE, DEFENSAS, SEGURIDAD, EMPRESAS, LICITACION, TERCERIZAR,
  LELO_EMPLEADO, ABUELA,
};
