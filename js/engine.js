// Motor del juego "El Taller". Lógica pura: no toca la pantalla ni el guardado.
import {
  HORAS_POR_SEMANA, SEMANAS_POR_ANIO, MESES, MAQUINAS, PRODUCTOS, FECHAS_ESPECIALES, RAMPA_FECHA,
  PRESTAMO, GASTOS_FIJOS, VENTAS, REPUTACION, PRIMO, CURSOS, CURSO_MAX_PUNTOS, CURSO_BAJA_POR_MES, MAZO, TUTORIAL, PROMO, CLIENTES,
  MAZO_FERIA, PROB_CARTA_FERIA, MERMA, CANSANCIO, PUESTOS, RASGOS, NOMBRES_EMPLEADOS, EQUIPO, CAPACITACION,
  LELO_EMPLEADO, CHUCHU, NOMBRES_FEMENINOS, CYBER, CONFIANZA, ORDEN_MAQUINAS, MAQUINAS_FUTURAS, LOCALES, VOLANTES,
  SERVICIOS, LELO_VIAJE, TRAICIO, SIN_TEXTIL_ERRORES, PROVINCIA, LELO_GERENTE, DEFENSAS, SEGURIDAD, EMPRESAS,
  TERCERIZAR, LICITACION, VOZ_DE_ADENTRO, ABUELA,
  RRHH, PROVINCIAS_AR, PAIS, ENCARGADO, TRANSPORTE, LELO_COMERCIAL, TOPA, MARCAS, ATAQUES_PAIS, DEFENSAS_PAIS, PRODUCTOS_SIMPLES,
  GRANDES, INFOARG, EVENTOS_MARCA, EMPRESAS_PAIS, CLUBES_BARRIO, LICITACION_SEGUNDA, TRAICIO_TEXTOS,
} from './data.js';

export const VERSION_PARTIDA = 6;

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

export function enPais(e) {
  return e.meta === 'pais';
}

// Ya pasaste la ciudad (provincia o país): tercerización, defensas, empresas, diseñadores...
export function despuesDeLaCiudad(e) {
  return enProvincia(e) || enPais(e);
}

// Mueve la reputación. En el país, mueve la de todos los locales (más suave) y la del país es el promedio.
export function sumarReputacion(e, d) {
  if (!d) return;
  if (enPais(e) && e.pais) {
    for (const l of e.pais.locales) l.rep = limitar(redondear(l.rep + d * PAIS.factorGeneral, 3), 0, 100);
    recalcularRepPais(e);
    return;
  }
  e.rep = limitar(redondear(e.rep + d), 0, 100);
}

export function recalcularRepPais(e) {
  const ls = e.pais?.locales || [];
  e.rep = ls.length ? redondear(ls.reduce((t, l) => t + l.rep, 0) / ls.length) : 0;
  return e.rep;
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
  // Versión 5: el país
  if (e.pais === undefined) e.pais = null;
  if (e.origen === undefined) e.origen = null;
  // Versión 6: cómo te mostramos en el taller (hombre o mujer); si falta, se pregunta al continuar
  if (e.genero === undefined) e.genero = null;
  if (!e.equipo.rrhhCubre) e.equipo.rrhhCubre = [];
  const ab = e.licitacion.abierta;
  if (ab && ab.combos === undefined) Object.assign(ab, { tipo: 'ascenso', combos: LICITACION.combos, precioRef: LICITACION.precioRef, costo: LICITACION.costo, sena: LICITACION.sena, plazo: LICITACION.plazo, multa: LICITACION.multa, cobroSemanas: 0, requisitos: [], especial: null, grande: null, repGanada: LICITACION.repGanada, repIncompleta: LICITACION.repIncompleta });
  if (e.mejorDeLaProvincia && e.meta === 'provincia') iniciarPais(e);
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

// Con la estación de costura, el combo lleva solo el calandrado (1 h): el corte y la costura (30 min)
// los hacen los costureros (y si no les alcanzan las horas, vos).
const PARTE_COSTURA = 1 / 3;
function factorEstacion(e, idProducto) {
  return idProducto === 'combo' && e?.maquinas?.costura ? 1 - PARTE_COSTURA : 1;
}

export function horasPorUnidad(e, idProducto) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - expEn(e, PRODUCTOS[idProducto].maquina) * 0.016) * factorEstacion(e, idProducto);
}

export function horasCostura(x) {
  return PRODUCTOS.combo.horas * PARTE_COSTURA * Math.max(0.35, 1 - expEn(x, 'costura') * 0.016);
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
  const rasgo = emp.rasgo === 'prolijo' ? 0.5 : emp.rasgo === 'distraido' ? (e && cubiertoPorRRHH(e, emp) ? RRHH.distraido : 1.5) : 1;
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
  if (enPais(e)) return e.mejorDelPais ? 3 : 2;
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
  if (MAQUINAS[id]?.desdePais && !enPais(e)) return { id, ...MAQUINAS[id], disponible: false, enElPais: true };
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
  if (!m.disponible) return { ok: false, motivo: m.enElPais ? `La próxima es la ${m.nombre.toLowerCase()}: se consigue en el país.` : `La próxima máquina es la ${m.nombre.toLowerCase()}: llega en la próxima versión del juego.` };
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
  const ml = e.rep >= VENTAS.reputacionMercadoLibre || despuesDeLaCiudad(e) ? 1 + VENTAS.extraMercadoLibre : 1;
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
  return Object.keys(LOCALES).filter((id) => (!LOCALES[id].desdeProvincia || despuesDeLaCiudad(e)) && (!LOCALES[id].desdePais || enPais(e)));
}

export function alquilarLocal(e, id = 'chico') {
  if (e.semanaEnCurso) return { ok: false, motivo: 'Eso se arregla el domingo.' };
  const l = LOCALES[id];
  if (!l || id === 'casa') return { ok: false, motivo: 'Ese local no existe.' };
  if ((e.local || 'casa') === id) return { ok: false, motivo: 'Ya estás en ese local.' };
  if (!localesDisponibles(e).includes(id)) return { ok: false, motivo: l.desdePais ? `El ${l.nombre.toLowerCase()} se consigue en el país.` : 'El local grande se consigue en la provincia.' };
  if (l.localesMin && (e.pais?.locales.length || 0) < l.localesMin) return { ok: false, motivo: `Para la ${l.nombre.toLowerCase()} necesitás ${l.localesMin} locales de venta abiertos.` };
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
    rasgoVisible: rasgoVisible || tieneRRHH(e), // con Recursos Humanos ves el rasgo antes de contratar
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
  if (ids.length === 1) return ids[0];
  const t = siguienteAzar(e);
  return t < 0.5 ? ids[0] : t < 0.85 ? ids[1] : ids[2];
}

// Bolsa de trabajo del municipio: cuesta horas del domingo, ves todo y cobran más.
export function irALaBolsa(e) {
  if (e.semanaEnCurso) return { ok: false, motivo: 'A la bolsa se va el domingo, antes de arrancar la semana.' };
  if (e.equipo.bolsa?.semana === e.semana) return { ok: true };
  const candidatos = [];
  const extra = enPais(e) ? ['costurero', 'bordador', 'rrhh', 'disenador'][Math.floor(siguienteAzar(e) * 4)] : despuesDeLaCiudad(e) ? 'disenador' : siguienteAzar(e) < 0.6 ? 'operario' : 'vendedor';
  const puestos = mezclar(e, ['operario', 'vendedor', extra]);
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
  if (PUESTOS[puesto].desdeProvincia && !despuesDeLaCiudad(e)) return { ok: false, motivo: 'Los diseñadores se consiguen en la provincia.' };
  if (PUESTOS[puesto].desdePais && !enPais(e)) return { ok: false, motivo: `${PUESTOS[puesto].nombre}: se consigue en el país.` };
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
  if (PUESTOS[puesto].desdeProvincia && !despuesDeLaCiudad(e)) return { ok: false, motivo: 'Los diseñadores se consiguen en la provincia.' };
  if (PUESTOS[puesto].desdePais && !enPais(e)) return { ok: false, motivo: `${PUESTOS[puesto].nombre}: se consigue en el país.` };
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
  if (tieneRRHH(e)) actualizarRRHH(e);
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
  if (tieneRRHH(e) || emp.puesto === 'rrhh') actualizarRRHH(e);
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
  if (emp.esLelo && (e.leloGerente || e.leloComercial)) return 0;
  if (emp.puesto === 'disenador' || emp.puesto === 'rrhh') return 0;
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

function horasPorUnidadEmp(emp, idProducto, e) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - expEn(emp, PRODUCTOS[idProducto].maquina) * 0.016) * factorEstacion(e, idProducto);
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
  const crear = (emp) => ({ emp, libres: horasEmpleado(e, emp, sem), unidades: {}, horas: 0, envios: 0 });
  const operarios = presentes(e, 'operario').map(crear);
  // Los bordadores solo trabajan en la estación de bordado (y los operarios no la tocan)
  const bordadores = presentes(e, 'bordador').map(crear);
  const vos = { unidades: {}, horas: 0, envios: 0, horasDiseno: 0, horasCostura: 0 };
  for (const [id, n] of Object.entries(producir || {})) {
    const grupo = PRODUCTOS[id].maquina === 'bordado' ? bordadores : operarios;
    for (let i = 0; i < (n || 0); i++) {
      const o = grupo.find((x) => x.libres + 1e-9 >= horasPorUnidadEmp(x.emp, id, e));
      if (o) {
        const h = horasPorUnidadEmp(o.emp, id, e);
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
  // Corte y costura de los combos (con la estación): costureros primero, el resto vos
  const costureros = presentes(e, 'costurero').map((emp) => ({ emp, libres: horasEmpleado(e, emp, sem), horas: 0, combos: 0 }));
  if (e.maquinas?.costura) {
    for (let i = 0; i < (producir?.combo || 0); i++) {
      const c = costureros.find((x) => x.libres + 1e-9 >= horasCostura(x.emp));
      if (c) { const h = horasCostura(c.emp); c.libres -= h; c.horas += h; c.combos++; } else vos.horasCostura += horasCostura(e);
    }
    vos.horas += vos.horasCostura;
  }
  return { operarios: [...operarios, ...bordadores], vos, disenadores, costureros };
}

export function capacidadEquipo(e, sem = e.semanaEnCurso) {
  const produccion = [...presentes(e, 'operario'), ...presentes(e, 'bordador')].reduce((s, x) => s + horasEmpleado(e, x, sem), 0);
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
    emp.falta = emp.rasgo === 'faltador' && siguienteAzar(e) < (cubiertoPorRRHH(e, emp) ? RRHH.probFalta : EQUIPO.probFalta);
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
  if (despuesDeLaCiudad(e) && e.licitacion?.proxima && e.semana >= e.licitacion.proxima && !e.licitacion.abierta) abrirLicitacion(e, evento);
  if (enPais(e) && e.licitacion?.proximaSegunda && e.semana >= e.licitacion.proximaSegunda) {
    if (e.licitacion.abierta) e.licitacion.proximaSegunda = e.semana + 1;
    else abrirLicitacion(e, evento, 'segunda');
  }
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
    sumarReputacion(e, d);
    e.exp = limitar(redondear(e.exp + d), 0, 100);
    sumarHistorial(e, d);
  };
  const numero = (x) => String(x).replace('.', ',');
  if (acepta) {
    ab.fin = true;
    ab.acepto = true;
    sumarLelo(e);
    if (enPais(e)) {
      e.leloComercial = true;
      e.equipo.empleados.find((x) => x.esLelo).sueldo = LELO_COMERCIAL.sueldo;
      if (!e.pais.lelo.local) e.pais.lelo.local = e.pais.locales[0]?.prov || null;
    } else if (e.mejorDeLaProvincia) {
      e.leloGerente = true;
      e.equipo.empleados.find((x) => x.esLelo).sueldo = LELO_GERENTE.sueldo;
    }
    mover(ABUELA.bonus);
    if (e.leloComercial) return { ok: true, mensaje: `Le dijiste que sí. La abuela está chocha y Lelo arranca el lunes como gerente comercial de los locales: no te ocupa un lugar en el equipo y cobra ${plata$(LELO_COMERCIAL.sueldo)} por mes. +${numero(ABUELA.bonus)} de reputación, de experiencia y de confianza del tío.` };
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
      emp.proximaQueja = e.semana + (cubiertoPorRRHH(e, emp) ? RRHH.mesesQuejoso : EQUIPO.mesesQuejoso) * 4 + 2;
      evento(`${emp.nombre} te pide un aumento a ${plata$(emp.pideAumento)}. Respondele el domingo.`, 'mala');
    }
  }
  actualizarRRHH(e, evento);
}

// ---------- Recursos Humanos ----------
export function tieneRRHH(e) {
  return e.equipo?.empleados.some((x) => x.puesto === 'rrhh') || false;
}

// Cada mes se sortea a quiénes atiende Recursos Humanos (cada uno, a 15).
export function actualizarRRHH(e, evento) {
  const n = e.equipo.empleados.filter((x) => x.puesto === 'rrhh').length;
  const resto = e.equipo.empleados.filter((x) => x.puesto !== 'rrhh' && !x.esLelo);
  if (!n) { e.equipo.rrhhCubre = []; return; }
  const cupo = n * RRHH.cubre;
  e.equipo.rrhhCubre = mezclar(e, resto.map((x) => x.id)).slice(0, cupo);
  const sin = Math.max(0, resto.length - cupo);
  if (sin && evento) evento(`Recursos Humanos llega a ${cupo} de tus ${resto.length} empleados: ${sin} ${sin === 1 ? 'queda' : 'quedan'} sin atender.`, 'info');
}

export function cubiertoPorRRHH(e, emp) {
  return Boolean(e.equipo?.rrhhCubre?.includes(emp.id));
}

export function coberturaRRHH(e) {
  const n = e.equipo.empleados.filter((x) => x.puesto === 'rrhh').length;
  const resto = e.equipo.empleados.filter((x) => x.puesto !== 'rrhh' && !x.esLelo).length;
  return { personas: n, cupo: n * RRHH.cubre, empleados: resto, sinAtender: Math.max(0, resto - n * RRHH.cubre) };
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
export function nuevaPartida(opcionPrestamo, semilla = Date.now() >>> 0, origen = null) {
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
    origen: origen && PROVINCIAS_AR[origen.provincia] ? { provincia: origen.provincia, municipio: String(origen.municipio || '').trim().slice(0, 40) || 'tu ciudad' } : null,
    genero: ['hombre', 'mujer'].includes(origen?.genero) ? origen.genero : null,
    pais: null,
    mejorDelPais: false,
    leloComercial: false,
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
    sumarReputacion(e, d);
    r.rep = e.rep;
    evento(`${carta.texto} (${formatoRep(d)} de reputación)`, tipoEv);
  }
}

// ---------- Acciones fuera del turno ----------
export function comprarMaquina(e, id) {
  const m = MAQUINAS[id];
  if (!m) return { ok: false, motivo: 'Esa máquina no existe.' };
  if (e.maquinas[id]) return { ok: false, motivo: 'Ya tenés esa máquina.' };
  if (m.desdePais && !enPais(e)) return { ok: false, motivo: `La ${m.nombre.toLowerCase()} se consigue en el país.` };
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
  if (EVENTOS_MARCA.lista.some((x) => x.id === d.id)) {
    if (!e.pais) { e.decisiones.shift(); return { ok: true, mensaje: 'Eso ya no corre.' }; }
    mensaje = resolverEventoMarca(e, d, opcion);
    if (mensaje === null) return { ok: false, motivo: 'Esa opción no existe.' };
    e.decisiones.shift();
    return { ok: true, mensaje };
  }
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
      if (siguienteAzar(e) < 0.5) { sumarReputacion(e, -2); mensaje = 'Usaste el lote fallado y un cliente lo notó: −2 de reputación.'; }
      else mensaje = 'Usaste el lote fallado y nadie se dio cuenta. Zafaste.';
      break;
    case 'quejoso.contesta': e.horasPerdidas += 2; sumarReputacion(e, -1); mensaje = 'Le contestaste con buena onda: −1 de reputación y 2 h de esta semana.'; break;
    case 'quejoso.ignora': sumarReputacion(e, -2); mensaje = 'Lo ignoraste y la queja juntó comentarios: −2 de reputación.'; break;
    case 'tintura.limpia': case 'tintura.tira': mensaje = resolverTintura(e, d, opcion === 'limpia'); break;
    case 'propaganda.desmiente': e.horasPerdidas += 3; sumarReputacion(e, -1 * d.factor); mensaje = `Lo desmentiste en todas las redes: −${formatoRep(d.factor).replace('+', '')} de reputación y 3 h de esta semana.`; break;
    case 'propaganda.ignora': sumarReputacion(e, -2 * d.factor); mensaje = `Lo dejaste pasar y mucha gente se lo creyó: ${formatoRep(-2 * d.factor)} de reputación.`; break;
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
  if (enPais(e) && (pub.feria || pub.volantes || pub.promo)) errores.push('En el país no vas a la feria ni repartís volantes: venden los locales.');
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

  // País: los pedidos los juntan los locales; tus horas (y las de los vendedores) son publicidad de marca.
  if (enPais(e)) {
    const horasMarca = horas + horasVendedores;
    const pedidosPais = pedidosDeLocales(e, { ...pub, horasMarca }, enDia, evento, diaAlAzar);
    if (!e.mejorDelPais || true) ofertasEspecialesPais(e, enDia, evento);
    const totalU = pedidosPais.reduce((t, p) => t + p.cantidad, 0);
    enDia(6, totalU ? `📦 Los locales juntaron ${totalU} producto${totalU === 1 ? '' : 's'} para mandar. Se producen hoy y llegan la semana que viene.` : '📦 Los locales no juntaron pedidos esta semana.', 'cierre');
    e.semanaEnCurso = {
      semana: e.semana, horasRedes: horas, horasMarca: redondear(horasMarca, 1), promo: false, cyber: Boolean(pub.cyber), volantes: false, horasDomingo: horasDomingo(e, { ...pub, curso: null }),
      pedidos: pedidosPais, pedidosLelo: 0, eventos, dias, feria: null, gastosDomingo, horasVendedores: redondear(horasVendedores, 1), ...semEquipo,
      transporte: e.pais.transporte,
    };
    return { ok: true, semana: e.semanaEnCurso };
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
  const partes = Object.keys(cuenta).filter((id) => cuenta[id]).map((id) => `${cuenta[id]} ${nombreUnidades(id, cuenta[id])}`);
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes.join('');
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
  const factorRep = enPais(e) ? 0.02 : enProvincia(e) ? PROVINCIA.factorRepVenta : 1;
  const pais = enPais(e);
  const transporte = pais ? (TRANSPORTE[plan.transporte]?.nombre ? plan.transporte : e.pais.transporte) : null;
  if (pais) e.pais.transporte = transporte;
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
    const aprende = emp.esLelo ? 1 : PUESTOS[emp.puesto].variantes[emp.variante].aprende;
    const res = fabricar(emp, o.unidades, (m) => probabilidadErrorEmpleado(emp, m, e), `${emp.nombre} arruinó`, aprende);
    delEquipo += res.hechas;
    emp.exp = limitar(redondear(emp.exp + res.intentos * 0.08 * aprende, 1), 0, 100);
    if (emp.rasgo === 'creativo') sumarRep(res.hechas * EQUIPO.repCreativo * factorRep);
  }
  for (const c of reparto.costureros || []) {
    if (!c.combos) continue;
    const ap = PUESTOS.costurero.variantes[c.emp.variante].aprende;
    c.emp.exp = limitar(redondear(c.emp.exp + c.combos * 0.08 * ap, 1), 0, 100);
    if (c.emp.retraso?.costura) c.emp.retraso.costura = Math.max(0, redondear(c.emp.retraso.costura - 0.08 * c.combos * ap, 2));
  }
  e.totales.producidas += producidas;
  if (producidas > 0 || Object.keys(plan.producir || {}).some((id) => plan.producir[id] > 0)) {
    linea(delEquipo ? `Se produjeron ${producidas} unidades (${delEquipo} las hizo tu equipo).` : `Produjiste ${producidas} unidades.`);
  }

  // 2. Entrega de pedidos (en el país: primero llega lo que mandaste la semana pasada)
  if (pais) llegadaEnvios(e, r, evento);
  let entregados = 0;
  let unidadesEntregadas = 0;
  const noLlegan = {};
  for (const p of sem.pedidos) {
    const nombre = `${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}`;
    if (p.pais) {
      const l = e.pais.locales.find((x) => x.prov === p.local);
      const gu = l ? repPorUnidadLocal(e, l) : 0;
      if (p.rechazado) { if (l) moverRepLocal(e, l, gu * PAIS.rechazado * p.cantidad); continue; }
      if (p.tercerizado || e.stock[p.producto] >= p.cantidad) {
        if (p.tercerizado) {
          if (siguienteAzar(e) < TERCERIZAR.falla) {
            const insumo = PRODUCTOS[p.producto].costo * p.cantidad;
            e.plata -= insumo; r.gastos += insumo;
            if (l) moverRepLocal(e, l, gu * PAIS.noEntregado * p.cantidad);
            evento(`🏭 La tercerizadora le erró a la calidad de ${nombre} para ${p.cliente}: perdiste el pedido y el insumo (−${plata$(insumo)}).`, 'desastre');
            continue;
          }
          const costo = Math.round(PRODUCTOS[p.producto].precio * p.cantidad * (p.factorTerc || TERCERIZAR.max));
          e.plata -= costo; r.gastos += costo;
        } else e.stock[p.producto] -= p.cantidad;
        enviarALocal(e, r, p, precioPedido(p, sem), transporte);
        entregados++;
        unidadesEntregadas += p.cantidad;
      } else {
        if (l) moverRepLocal(e, l, gu * PAIS.noEntregado * p.cantidad);
        noLlegan[p.local] = (noLlegan[p.local] || 0) + p.cantidad;
      }
      continue;
    }
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
  if (pais) {
    if (activos) linea(`Mandaste a los locales ${unidadesEntregadas} productos (${entregados} de ${activos} pedidos)${r.traslado ? ` en ${TRANSPORTE[transporte].nombre.toLowerCase()} (${plata$(r.traslado)} de traslado)` : ''}: llegan la semana que viene.`);
    const faltaron = Object.entries(noLlegan);
    if (faltaron.length) evento(`No te alcanzó para mandar todo: quedaron sin mercadería ${faltaron.map(([prov, n]) => `${PROVINCIAS_AR[prov].nombre} (${n})`).join(', ')}. Esos locales pierden reputación.`, 'mala');
  } else if (activos) linea(`Entregaste ${entregados} de ${activos} pedidos (${unidadesEntregadas} productos).`);
  const serv = serviciosDeLaSemana(sem);
  if (serv.envios || serv.diseno.length) {
    const partes = [];
    if (reparto.vos.envios || serv.envios) partes.push(`${serv.envios} envío${serv.envios === 1 ? '' : 's'} a domicilio${reparto.vos.envios ? ` (${reparto.vos.envios} los hiciste vos)` : ' (los hizo tu equipo)'}`);
    if (serv.diseno.length) partes.push(`${serv.diseno.length} diseño${serv.diseno.length === 1 ? '' : 's'} personalizado${serv.diseno.length === 1 ? '' : 's'}${reparto.disenadores.some((d) => d.horas > 0) ? (reparto.vos.horasDiseno > 0 ? ' (parte los hizo tu diseñador)' : ' (los hizo tu diseñador)') : ''}`);
    linea(`Servicios especiales: ${partes.join(' y ')}.`);
  }
  else if (!sem.pedidos.length && !pais) linea('No llegaron pedidos esta semana.');

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
  if (!pais) e.totales.vendidas += vendidas;
  let malHechos = 0;
  if (e.cansancio > 60) for (let i = 0; i < vendidas; i++) if (siguienteAzar(e) < 0.05) malHechos++;
  if (malHechos > 0) {
    const d = malHechos * REPUTACION.porPedidoMalHecho;
    deltaRep += d;
    evento(`Por el cansancio entregaste ${malHechos} producto${malHechos > 1 ? 's' : ''} mal hecho${malHechos > 1 ? 's' : ''}. Te reclamaron (${formatoRep(d)} de reputación).`, 'mala');
  }
  sumarReputacion(e, deltaRep);
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
  // 7c. País: Topa, las marcas, InfoArg y los eventos de marca
  if (pais) { semanaDelPais(e, r, evento); recalcularRepPais(e); }

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
  } else if (enPais(e) && !e.mejorDelPais && !e.fin) {
    if (e.rep >= PAIS.ganar) ganarPais(e, r, evento);
    else if (e.pais.topa.rep >= 100) perderPais(e, r, evento);
  }
  if (!despuesDeLaCiudad(e) && repInicial < VENTAS.reputacionMercadoLibre && e.rep >= VENTAS.reputacionMercadoLibre) {
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
  const res = cerrarSemana(e, { producir, transporte: plan.transporte });
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
  if (enPais(e)) cierreDeMesPais(e, c, r, evento);

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
  if (enPais(e)) evento(`Fiestas: el tío levanta la copa por ${nombreDelTaller(e)} y sus ${e.pais.locales.length} local${e.pais.locales.length === 1 ? '' : 'es'}. ${e.mejorDelPais ? 'La marca del país: la abuela lo cuenta en todos lados.' : `Todos te preguntan si le vas a ganar a ${TOPA.nombre}.`}`, 'buena');
  else if (enProvincia(e)) evento(`Fiestas: el tío levanta la copa por ${nombreDelTaller(e)}. ${e.mejorDeLaProvincia ? 'El mejor de la provincia: nadie habla de otra cosa.' : `Todos te preguntan por ${TRAICIO.empresa}.`}`, 'buena');
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

export function ponerNombreTaller(e, nombre, sa = false) {
  let n = String(nombre || '').trim().replace(/\s*S\.?\s*A\.?$/i, '').slice(0, 40);
  if (!n) return { ok: false, motivo: 'Escribí un nombre para tu taller.' };
  if (sa) n = `${n} S.A.`;
  e.nombreTaller = n;
  if (sa) e.pedirNombreSA = false;
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

// Ganar la provincia: Traicio se prende fuego el taller y arranca la pelea por el país.
function ganarProvincia(e, r, evento) {
  e.mejorDeLaProvincia = true;
  if (e.traicio) e.traicio.sabotaje = null;
  const lelo = e.equipo.empleados.find((x) => x.esLelo);
  r.hito = 'mejorDeLaProvincia';
  r.leloAsciende = Boolean(lelo);
  evento(`¡${nombreDelTaller(e)} es el mejor de la provincia! ${TRAICIO_TEXTOS.despedida}`, 'hito');
  iniciarPais(e);
  evento(`Arranca la pelea por el país contra ${TOPA.nombre}. Tu taller deja de vender: ahora venden los locales, y el primero es el de tu ciudad.${lelo ? ` Lelo pasa a ser gerente comercial de los locales (${plata$(LELO_COMERCIAL.sueldo)} por mes).` : ''}`, 'hito');
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
function nuevaOfertaEmpresa(e, tipo, enDia, evento, extra = false) {
  const def = EMPRESAS[tipo] || EMPRESAS_PAIS[tipo];
  if (!extra) {
    if (EMPRESAS[tipo]) e.empresas.proximo[tipo] = e.semana + enteroEntre(e, def.cada.min, def.cada.max);
    else e.pais.empresas[tipo] = e.semana + enteroEntre(e, def.cada.min, def.cada.max);
  }
  const conocidos = Object.keys(e.empresas.clientes).filter((c) => e.empresas.clientes[c].tipo === tipo);
  const cliente = conocidos.length && siguienteAzar(e) < 0.7 ? conocidos[0] : def.nombres[Math.floor(siguienteAzar(e) * def.nombres.length)];
  const info = e.empresas.clientes[cliente];
  const dia = 1 + Math.floor(siguienteAzar(e) * 4);
  if (!info?.fijo && siguienteAzar(e) < EMPRESAS.probTraicioSeLoLleva && enProvincia(e) && !e.mejorDeLaProvincia) {
    enDia(dia, `🏢 ${cliente} pidió presupuesto... y se lo dio a ${TRAICIO.empresa}.`, 'mala');
    evento(`${cliente} le dio su pedido a ${TRAICIO.empresa}. Con 3 entregas a tiempo, un cliente se vuelve fijo y ya no te lo pelean.`, 'mala');
    return;
  }
  const items = {};
  for (const it of def.items) items[it.producto] = enteroEntre(e, it.min, it.max);
  const precio = Math.round(Object.entries(items).reduce((t, [id, n]) => t + n * PRODUCTOS[id].precio, 0) * (1 - def.descuento));
  const cobro = def.cobroLargo && siguienteAzar(e) < def.probCobroLargo ? def.cobroLargo : def.cobroSemanas;
  e.pedidosEmpresa.push({
    id: `emp${e.semana}-${tipo}${extra ? '-x' : ''}`, tipo, cliente, items, precio, vence: e.semana + def.plazo, cobro,
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
          sumarReputacion(e, TERCERIZAR.repFalla);
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
      sumarReputacion(e, EMPRESAS.repNoEntrega);
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

// ---------- Licitaciones de clubes (ascenso desde la provincia; segunda desde el país) ----------
function abrirLicitacion(e, evento, tipo = 'ascenso') {
  const segunda = tipo === 'segunda';
  const L = segunda ? LICITACION_SEGUNDA : LICITACION;
  if (segunda) e.licitacion.proximaSegunda = e.semana + enteroEntre(e, L.cada.min, L.cada.max);
  else e.licitacion.proxima = e.semana + enteroEntre(e, L.cada.min, L.cada.max);
  if (e.licitacion.contrato) return;
  const rivales = [];
  if (enProvincia(e) && !e.mejorDeLaProvincia && e.traicio) rivales.push({ nombre: TRAICIO.empresa, rep: e.traicio.rep, calidad: 70, esTraicio: true });
  let especial = null;
  let grande = null;
  let mult = 1;
  let requisitos = [];
  if (segunda) {
    const tirada = siguienteAzar(e);
    let acum = 0;
    for (const [id, x] of Object.entries(L.especiales)) { acum += x.prob; if (tirada < acum) { especial = id; mult = x.mult; break; } }
    requisitos = mezclar(e, Object.keys(L.requisitos)).slice(0, L.cuantosRequisitos);
    if (siguienteAzar(e) < L.probGrandes) grande = GRANDES[Math.floor(siguienteAzar(e) * GRANDES.length)].nombre;
  }
  const precioRef = Math.round((L.precioRef * mult) / 1000) * 1000;
  const talleres = mezclar(e, [...LICITACION.talleres]);
  const n = enteroEntre(e, L.rivales.min, L.rivales.max);
  for (let i = 0; i < n; i++) rivales.push({ nombre: talleres[i % talleres.length], rep: Math.round(entre(e, L.rivales.repMin, L.rivales.repMax)), calidad: Math.round(entre(e, 40, 80)) });
  for (const x of rivales) {
    // En la segunda, a veces la competencia ofrece apenas un 5% arriba del mínimo
    const parte = segunda && siguienteAzar(e) < L.rivales.probAjustada ? L.rivales.ajustada : entre(e, L.rivales.ofertaMin, L.rivales.ofertaMax);
    x.oferta = Math.round((precioRef * parte) / 1000) * 1000;
  }
  const club = L.clubes[Math.floor(siguienteAzar(e) * L.clubes.length)];
  e.licitacion.abierta = {
    semana: e.semana, tipo, club, rivales, oferta: null, combos: L.combos, precioRef, costo: L.costo, sena: L.sena, plazo: L.plazo, multa: L.multa,
    cobroSemanas: L.cobroSemanas || 0, requisitos, especial, grande, repGanada: L.repGanada, repIncompleta: L.repIncompleta,
  };
  const extraTxt = especial ? ` Pide ${L.especiales[especial].texto} y paga más.` : '';
  const grandeTxt = grande ? ` Se presenta ${grande}: contra esa marca no hay con qué.` : '';
  evento?.(`🏟️ ${club} abrió una licitación${segunda ? ' de segunda división' : ''}: ${L.combos} combos para dentro de un mes.${extraTxt}${grandeTxt} Se ofertan el domingo.`, 'oportunidad');
}

export function calidadLicitacion(e) {
  const deportivo = presentes(e, 'disenador').some((x) => x.variante === 'deportivo');
  return limitar(Math.round((expEn(e, 'calandra') + formacionTotal(e)) / 2 + (deportivo ? 20 : 0)), 0, 100);
}

export function ofertarLicitacion(e, precio) {
  const a = e.licitacion.abierta;
  if (!a || a.semana !== e.semana) return { ok: false, motivo: 'No hay ninguna licitación abierta.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se oferta el domingo.' };
  if (precio === null) { a.oferta = null; return { ok: true }; }
  const puede = puedeOfertarLicitacion(e);
  if (!puede.ok) return puede;
  if (!(precio >= 10000)) return { ok: false, motivo: 'Poné un precio por combo.' };
  a.oferta = Math.round(precio / 1000) * 1000;
  return { ok: true, mensaje: `Ofertaste ${plata$(a.oferta)} por combo. El resultado sale al cerrar la semana.` };
}

function resolverLicitacion(e, r, evento) {
  const a = e.licitacion.abierta;
  e.licitacion.abierta = null;
  if (a.grande) { evento(`La licitación de ${a.club} se la llevó ${a.grande}. Ni miraron las otras ofertas.`, a.oferta ? 'mala' : 'info'); return; }
  if (!a.oferta) { evento(`La licitación de ${a.club} se la llevó otro taller.`, 'info'); return; }
  const L = LICITACION;
  const todos = [...a.rivales, { nombre: nombreDelTaller(e), rep: e.rep, calidad: calidadLicitacion(e), oferta: a.oferta, vos: true }];
  const min = Math.min(...todos.map((x) => x.oferta));
  for (const x of todos) x.puntaje = L.pesos.precio * 100 * (min / x.oferta) + L.pesos.rep * x.rep + L.pesos.calidad * x.calidad;
  const ganador = todos.sort((x, y) => y.puntaje - x.puntaje)[0];
  if (!ganador.vos) { evento(`La licitación de ${a.club} la ganó ${ganador.nombre} con ${plata$(ganador.oferta)} por combo.`, 'mala'); return; }
  const total = a.oferta * a.combos;
  const sena = Math.round(total * a.sena);
  e.plata += sena; r.ingresos += sena;
  e.licitacion.contrato = {
    club: a.club, tipo: a.tipo, combos: a.combos, precio: a.oferta, sena, vence: e.semana + a.plazo, costo: a.costo, multa: a.multa,
    cobroSemanas: a.cobroSemanas, repGanada: a.repGanada, repIncompleta: a.repIncompleta,
  };
  evento(`🏆 ¡Ganaste la licitación de ${a.club}! ${a.combos} combos a ${plata$(a.oferta)} cada uno. Te adelantaron ${plata$(sena)} de seña (${Math.round(a.sena * 100)}%). Plazo: ${a.plazo} semanas.${a.cobroSemanas ? ` El resto lo pagan ${a.cobroSemanas} semanas después de entregar.` : ''}`, 'buena');
}

// El contrato se entrega cuando tenés todos los combos o al vencer (con multa por lo que falte).
function entregarLicitacion(e, r, evento, sumarRep) {
  const c = e.licitacion.contrato;
  if (!c) return;
  if (e.stock.combo < c.combos && e.semana < c.vence) return;
  const costoRef = c.costo ?? LICITACION.costo;
  const multaVeces = c.multa ?? LICITACION.multa;
  const entregados = Math.min(e.stock.combo, c.combos);
  const faltan = c.combos - entregados;
  e.stock.combo -= entregados;
  // Los combos de segunda llevan telas de primera: la diferencia de insumo se paga al entregar
  const extraInsumo = Math.max(0, costoRef - PRODUCTOS.combo.costo) * entregados;
  if (extraInsumo) { e.plata -= extraInsumo; r.gastos += extraInsumo; }
  const saldo = entregados * c.precio - c.sena;
  const multa = faltan * costoRef * multaVeces;
  e.plata -= multa;
  r.gastos += multa;
  let textoCobro;
  if (saldo >= 0 && c.cobroSemanas) {
    e.cobros.push({ semana: e.semana + c.cobroSemanas, monto: saldo, cliente: c.club });
    textoCobro = `te pagan ${plata$(saldo)} más en ${c.cobroSemanas} semanas`;
  } else {
    e.plata += saldo;
    if (saldo >= 0) r.ingresos += saldo; else r.gastos -= saldo;
    textoCobro = saldo >= 0 ? `cobraste ${plata$(saldo)} más` : `devolviste ${plata$(-saldo)} de seña`;
  }
  e.licitacion.contrato = null;
  const ganada = c.repGanada ?? LICITACION.repGanada;
  const incompleta = c.repIncompleta ?? LICITACION.repIncompleta;
  if (!faltan) {
    sumarRep(ganada);
    evento(`Entregaste los ${c.combos} combos de ${c.club}: ${textoCobro}${extraInsumo ? ` (telas de primera: ${plata$(extraInsumo)})` : ''} (+${ganada} de reputación).`, 'buena');
  } else {
    sumarReputacion(e, incompleta);
    evento(`Al vencer el plazo entregaste ${entregados} de ${c.combos} combos a ${c.club}: ${textoCobro} y pagaste ${plata$(multa)} de multa (${incompleta} de reputación).`, 'mala');
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

// =====================================================================
// ---------- País: locales, logística, marcas, Topa y licitaciones de segunda ----------
// =====================================================================

const POB_TOTAL = Object.values(PROVINCIAS_AR).reduce((t, p) => t + p.pob, 0);

// Origen del jugador (provincia y municipio), elegido al arrancar la partida.
export function elegirOrigen(e, provincia, municipio) {
  if (!PROVINCIAS_AR[provincia]) return { ok: false, motivo: 'Elegí una provincia.' };
  const muni = String(municipio || '').trim().slice(0, 40);
  if (!muni) return { ok: false, motivo: 'Escribí tu municipio o ciudad.' };
  const antes = e.origen?.provincia;
  e.origen = { provincia, municipio: muni };
  // Si ya estás en el país y el local de origen todavía no vendió nada, se muda a la provincia nueva
  const l = e.pais?.locales.find((x) => x.origen);
  if (l && antes !== provincia && !l.vendidas && !e.pais.locales.some((x) => x.prov === provincia && !x.origen)) l.prov = provincia;
  return { ok: true };
}

export function nombreCiudad(e) {
  return e.origen?.municipio || 'tu ciudad';
}

// Parte del mercado de cada local: el de origen suma la base (1,5) y su provincia; el resto, su provincia.
export function parteMercado(prov, origen = false) {
  return (origen ? PAIS.mercadoBase : 0) + (PAIS.mercadoLocales * PROVINCIAS_AR[prov].pob) / POB_TOTAL;
}

// Pistas sin números sobre una provincia.
export function pistaProvincia(prov) {
  const pob = PROVINCIAS_AR[prov].pob;
  const gente = pob >= 3000 ? 'un mar de gente' : pob >= 1400 ? 'mucha gente' : pob >= 700 ? 'gente como para un buen local' : 'poca gente';
  const alq = pob >= 3000 ? 'el alquiler te va a doler' : pob >= 1400 ? 'el alquiler es caro' : pob >= 700 ? 'el alquiler es razonable' : 'el alquiler es accesible';
  return `Hay ${gente} y ${alq}.`;
}

function maquinasDeReferencia() {
  return Object.fromEntries(Object.keys(MAQUINAS).map((m) => [m, !MAQUINAS[m].desdePais]));
}

// Lo que pide un local por semana de un producto (sin azar).
export function demandaLocal(e, l, idProducto, semana = e.semana, opciones = {}) {
  const p = PRODUCTOS[idProducto];
  const maquinas = opciones.maquinas || e.maquinas;
  if (!maquinas[p.maquina] || p.soloPedido || !p.base) return 0;
  const c = calendario(semana);
  const temporada = p.temporada[c.estacion] ?? 1;
  const especial = opciones.sinFecha ? 1 : multiplicadorFecha(semana, idProducto, Boolean(opciones.cyber));
  const nacional = p.base * (1 + (PAIS.mercadoProvincia - 1) * p.sens) * (1 + VENTAS.extraMercadoLibre);
  const rep = opciones.rep ?? l.rep;
  const porRep = PAIS.repMinima + (1 - PAIS.repMinima) * (rep / 100);
  return nacional * parteMercado(l.prov, l.origen) * porRep * temporada * especial * (opciones.sinEncargado ? 1 : factorVentaLocal(e, l));
}

// Lo que rinde el local según su encargado, Lelo y la publicidad nacional.
export function factorVentaLocal(e, l) {
  const enc = l.encargado;
  if (!enc) return 0;
  let f = ENCARGADO.variantes[enc.variante].rinde;
  for (const r of enc.rasgos) {
    if (r === 'vendedorNato') f *= 1.1;
    if (r === 'siestas') f *= 0.9;
    if (r === 'futbol') f *= 0.92;
  }
  if (e.leloComercial && e.pais?.lelo?.local === l.prov && e.equipo.empleados.some((x) => x.esLelo)) f *= 1 + LELO_COMERCIAL.clientes;
  if (e.pais?.publicidadNacional && e.semana <= e.pais.publicidadNacional) f *= 1.2;
  return f;
}

export function unidadesEsperadasLocal(e, l, opciones = {}) {
  return Object.keys(PRODUCTOS).reduce((t, id) => t + demandaLocal(e, l, id, e.semana, { ...opciones, sinFecha: true }), 0);
}

// Alquiler: una parte de lo que factura el local por mes con 75 de reputación (con las máquinas de la provincia).
export function alquilerProvincia(prov, origen = false) {
  const l = { prov, origen, rep: PAIS.alquiler.repReferencia };
  const fake = { maquinas: maquinasDeReferencia(), semana: 20 };
  let semanal = 0;
  for (const id of Object.keys(PRODUCTOS)) {
    const p = PRODUCTOS[id];
    if (p.soloPedido || !p.base || !fake.maquinas[p.maquina]) continue;
    const nacional = p.base * (1 + (PAIS.mercadoProvincia - 1) * p.sens) * (1 + VENTAS.extraMercadoLibre);
    const porRep = PAIS.repMinima + (1 - PAIS.repMinima) * (l.rep / 100);
    semanal += nacional * parteMercado(prov, origen) * porRep * p.precio;
  }
  const mensual = semanal * 4.33;
  return Math.max(PAIS.alquiler.minimo, Math.round((mensual * PAIS.alquiler.parte) / 10000) * 10000);
}

export function alquilerLocal(e, l) {
  const base = alquilerProvincia(l.prov); // el de origen paga el alquiler de su provincia, aunque venda más
  return l.encargado?.rasgos.includes('ahorrativo') ? Math.round((base * 0.85) / 1000) * 1000 : base;
}

export function costoAbrirLocal(e, prov) {
  const alq = alquilerProvincia(prov);
  const armado = alq * PAIS.armado;
  const descuento = e.pais?.expansion && e.semana <= e.pais.expansion ? 0.5 : 1;
  return { alquiler: alq, armado: Math.round(armado * descuento), total: Math.round(alq + armado * descuento), descuento: descuento < 1 };
}

export function provinciasLibres(e) {
  const abiertas = new Set((e.pais?.locales || []).map((l) => l.prov));
  return Object.keys(PROVINCIAS_AR).filter((p) => !abiertas.has(p));
}

export function sueldoEncargado(e, variante) {
  return Math.round((ENCARGADO.variantes[variante].sueldo * e.equipo.mercado) / 1000) * 1000;
}

function crearEncargado(e, variante) {
  const v = ENCARGADO.variantes[variante];
  const buenos = mezclar(e, Object.keys(ENCARGADO.rasgos).filter((r) => ENCARGADO.rasgos[r].bueno)).slice(0, v.pros);
  const malos = mezclar(e, Object.keys(ENCARGADO.rasgos).filter((r) => !ENCARGADO.rasgos[r].bueno)).slice(0, v.contras);
  const usados = new Set((e.pais?.locales || []).map((l) => l.encargado?.nombre));
  const libres = ENCARGADO.nombres.filter((n) => !usados.has(n));
  const lista = libres.length ? libres : ENCARGADO.nombres;
  return {
    nombre: lista[Math.floor(siguienteAzar(e) * lista.length)], variante, rasgos: [...buenos, ...malos],
    visible: tieneRRHH(e), sueldo: sueldoEncargado(e, variante), semanasMes: 0, desde: e.semana,
  };
}

export function abrirLocal(e, prov, variante = 'junior') {
  if (!enPais(e)) return { ok: false, motivo: 'Los locales se abren en el país.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Los locales se abren el domingo.' };
  if (!PROVINCIAS_AR[prov]) return { ok: false, motivo: 'Esa provincia no existe.' };
  if (!provinciasLibres(e).includes(prov)) return { ok: false, motivo: 'Ya tenés un local ahí.' };
  if (!ENCARGADO.variantes[variante]) return { ok: false, motivo: 'Elegí un encargado.' };
  const c = costoAbrirLocal(e, prov);
  if (e.plata < c.total) return { ok: false, motivo: `Abrir el local cuesta ${plata$(c.total)} y tenés ${plata$(e.plata)}.` };
  e.plata -= c.total;
  e.finanzas.mesActual -= c.total;
  let falla = false;
  if (c.descuento && siguienteAzar(e) < 0.01) falla = true; // 1 de cada 100, la expansión inmediata sale mal
  if (c.descuento) e.pais.expansion = null;
  const l = { prov, rep: 0, abierto: e.semana, armado: c.armado, encargado: crearEncargado(e, variante), vendidas: 0, origen: false, semanasMes: 0 };
  e.pais.locales.push(l);
  recalcularRepPais(e);
  const enc = l.encargado;
  let mensaje = `¡Abriste el local de ${PROVINCIAS_AR[prov].nombre}! Pagaste ${plata$(c.total)} (alquiler del mes y armado). Queda a cargo ${enc.nombre} (${ENCARGADO.variantes[variante].nombre.toLowerCase()}, ${plata$(enc.sueldo)} por mes).`;
  if (falla) {
    const extra = Math.round(c.armado);
    e.plata -= extra; e.finanzas.mesActual -= extra;
    mensaje += ` Mala suerte: la empresa de la expansión inmediata se borró y hubo que pagar el armado completo (−${plata$(extra)}).`;
  }
  mensaje += enc.visible ? ` Recursos Humanos ya lo conoce: ${enc.rasgos.map((r) => ENCARGADO.rasgos[r].nombre.toLowerCase()).join(' y ') || 'sin nada para destacar'}.` : ' Cómo es lo vas a ver trabajando.';
  return { ok: true, mensaje };
}

export function cambiarEncargado(e, prov, variante) {
  const l = e.pais?.locales.find((x) => x.prov === prov);
  if (!l) return { ok: false, motivo: 'No tenés local ahí.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se cambia el domingo.' };
  if (!ENCARGADO.variantes[variante]) return { ok: false, motivo: 'Elegí un encargado.' };
  const viejo = l.encargado;
  const costo = viejo ? Math.round(viejo.sueldo * EQUIPO.despido + (viejo.sueldo * viejo.semanasMes) / semanasDelMes(e.semana)) : 0;
  e.plata -= costo; e.finanzas.mesActual -= costo;
  l.encargado = crearEncargado(e, variante);
  return { ok: true, mensaje: `${viejo ? `Despediste a ${viejo.nombre} (${plata$(costo)}). ` : ''}Ahora el local de ${PROVINCIAS_AR[prov].nombre} lo lleva ${l.encargado.nombre} (${ENCARGADO.variantes[variante].nombre.toLowerCase()}, ${plata$(l.encargado.sueldo)} por mes).` };
}

export function asignarLelo(e, prov) {
  if (!e.leloComercial || !e.equipo.empleados.some((x) => x.esLelo)) return { ok: false, motivo: 'Lelo no trabaja con vos como gerente comercial.' };
  if (!e.pais.locales.some((l) => l.prov === prov)) return { ok: false, motivo: 'No tenés local ahí.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se decide el domingo.' };
  const lel = e.pais.lelo;
  if (lel.local === prov) return { ok: true };
  if (lel.local && e.semana < lel.cambio + LELO_COMERCIAL.cambioCada) return { ok: false, motivo: `A Lelo lo podés cambiar de local una vez por mes (en ${lel.cambio + LELO_COMERCIAL.cambioCada - e.semana} semana(s)).` };
  lel.local = prov;
  lel.cambio = e.semana;
  return { ok: true, mensaje: `Lelo se fue al local de ${PROVINCIAS_AR[prov].nombre}: ahí consigue un ${Math.round(LELO_COMERCIAL.clientes * 100)}% más de clientes y la reputación crece el triple.` };
}

export function elegirTransporte(e, id) {
  if (!TRANSPORTE[id]?.nombre) return { ok: false, motivo: 'Ese transporte no existe.' };
  e.pais.transporte = id;
  return { ok: true };
}

export function cambiarDefensaPais(e, marca, activa) {
  if (!enPais(e) || !DEFENSAS_PAIS[marca]) return { ok: false, motivo: 'Esa defensa no existe.' };
  e.pais.defensas[marca] = Boolean(activa);
  const d = DEFENSAS_PAIS[marca];
  return { ok: true, mensaje: activa ? `Activaste ${d.nombre.toLowerCase()}${d.descuento ? '' : `: ${plata$(costoDefensaPais(e, marca))} por mes`}.` : `Diste de baja ${d.nombre.toLowerCase()}.` };
}

export function costoDefensaPais(e, marca) {
  const d = DEFENSAS_PAIS[marca];
  if (d.descuento) return 0;
  return Math.max(d.minimo, Math.round((baseMazo(e) * d.parte) / 1000) * 1000);
}

function costoDefensasPais(e) {
  return Object.keys(DEFENSAS_PAIS).filter((m) => e.pais.defensas[m]).reduce((t, m) => t + costoDefensaPais(e, m), 0);
}

export function gastosLocalesDelMes(e) {
  if (!enPais(e) || !e.pais) return { alquileres: 0, encargados: 0, defensas: 0 };
  return {
    alquileres: e.pais.locales.reduce((t, l) => t + alquilerLocal(e, l), 0),
    encargados: e.pais.locales.reduce((t, l) => t + (l.encargado?.sueldo || 0), 0),
    defensas: costoDefensasPais(e),
  };
}

// ---------- Arrancar el país ----------
export function iniciarPais(e) {
  e.meta = 'pais';
  e.reconquista = false;
  const prov = e.origen?.provincia && PROVINCIAS_AR[e.origen.provincia] ? e.origen.provincia : 'buenosAires';
  e.pais = {
    inicio: e.semana,
    locales: [],
    transporte: 'flete',
    envios: [],
    lelo: { local: prov, cambio: -99 },
    topa: { rep: 0, visible: null, mesVisible: null, aviso99: false, aviso2: false },
    ataque: null,
    defensas: Object.fromEntries(Object.keys(DEFENSAS_PAIS).map((m) => [m, false])),
    eventoProximo: e.semana + enteroEntre(e, EVENTOS_MARCA.cada.min, EVENTOS_MARCA.cada.max),
    impulso: null, // { factor, hasta }
    ofertaProxima: e.semana + enteroEntre(e, 6, 10),
    oferta: null, // { id, hasta, precio }
    publicidadNacional: null, expansion: null,
    empresas: { belleza: e.semana + enteroEntre(e, 1, 3), merchandising: e.semana + enteroEntre(e, 3, 6), eventos: e.semana + enteroEntre(e, 2, 5) },
    marcaFactor: 1,
  };
  const enc = crearEncargado(e, 'junior');
  e.pais.locales.push({ prov, rep: 0, abierto: e.semana, armado: 0, encargado: enc, vendidas: 0, origen: true, semanasMes: 0 });
  recalcularRepPais(e);
  // Lelo pasa a ser gerente comercial de los locales
  e.leloGerente = false;
  const lelo = e.equipo.empleados.find((x) => x.esLelo);
  e.leloComercial = Boolean(lelo);
  if (lelo) lelo.sueldo = LELO_COMERCIAL.sueldo;
  if (e.traicio) { e.traicio.sabotaje = null; e.traicio.robo = null; e.traicio.malDemanda = null; }
  e.defensas = { proteccion: false, seguro: false };
  e.licitacion.proximaSegunda = e.semana + enteroEntre(e, 3, 6);
  if (!e.licitacion.proxima) e.licitacion.proxima = e.semana + enteroEntre(e, LICITACION.cada.min, LICITACION.cada.max);
  planearAtaque(e);
  e.pedirNombreSA = true;
}

// Si Topa te gana el país: vendés los locales y volvés a la provincia con 25. Vuelve Traicio.
function perderPais(e, r, evento) {
  let recupero = 0;
  for (const l of e.pais.locales) recupero += Math.round((l.armado || alquilerProvincia(l.prov)) * PAIS.ventaLocal);
  e.plata += recupero; r.ingresos += recupero;
  const lelo = e.equipo.empleados.find((x) => x.esLelo);
  if (lelo) lelo.sueldo = LELO_EMPLEADO.sueldo;
  e.leloComercial = false;
  e.leloGerente = false;
  e.pais = null;
  e.mejorDeLaProvincia = false;
  e.pedidosEmpresa = e.pedidosEmpresa.filter((p) => EMPRESAS[p.tipo]);
  e.licitacion.abierta = null;
  e.licitacion.proximaSegunda = null;
  iniciarProvincia(e, true);
  e.rep = PAIS.repAlPerder;
  e.traicio.rep = PAIS.repTraicioVuelve;
  r.hito = 'perdistePais';
  r.recupero = recupero;
  evento(`${TOPA.nombre} llegó a 100: es la marca del país. Tuviste que vender los locales (recuperaste ${plata$(recupero)}) y volvés a pelear la provincia con ${PAIS.repAlPerder} de reputación.`, 'hito');
  evento(`🗡️ ${TRAICIO_TEXTOS.vuelta}`, 'desastre');
}

function ganarPais(e, r, evento) {
  e.mejorDelPais = true;
  e.rep = 100;
  for (const l of e.pais.locales) l.rep = 100;
  e.pais.ataque = null;
  r.hito = 'mejorDelPais';
  evento(`¡${nombreDelTaller(e)} es la marca del país! ${TOPA.nombre} tuvo que conformarse con el segundo puesto.`, 'hito');
}

// ---------- Pedidos de los locales (domingo a sábado) ----------
// Cada local junta pedidos durante la semana: se producen el sábado y se mandan; llegan la semana que viene.
function pedidosDeLocales(e, pub, enDia, evento, diaAlAzar) {
  const pedidos = [];
  let n = 0;
  const horasMarca = pub.horasMarca || 0;
  e.pais.marcaFactor = 1 + PAIS.marca.extra * Math.min(1, horasMarca / PAIS.marca.horasCompletas);
  const ids = Object.keys(PRODUCTOS);
  for (const l of e.pais.locales) {
    if (!l.encargado) continue;
    const enc = l.encargado;
    const pierde = ENCARGADO.variantes[enc.variante].pierde;
    const resumen = {};
    let perdidos = 0;
    for (const id of ids) {
      const esperado = demandaLocal(e, l, id, e.semana, { cyber: Boolean(pub.cyber) });
      if (!esperado) continue;
      let cant = Math.max(0, Math.round(esperado * entre(e, 0.85, 1.15)));
      if (pierde && cant > 0) {
        const p = Math.round(cant * pierde * entre(e, 0, 2));
        perdidos += p;
        cant -= p;
      }
      if (cant <= 0) continue;
      resumen[id] = cant;
      pedidos.push({ id: `p${e.semana}-${++n}`, producto: id, cantidad: cant, cliente: `el local de ${PROVINCIAS_AR[l.prov].nombre}`, local: l.prov, rechazado: false, dia: 6, pais: true });
    }
    const total = Object.values(resumen).reduce((a, b) => a + b, 0);
    const dia = diaAlAzar();
    if (total) enDia(dia, `🏪 Local de ${PROVINCIAS_AR[l.prov].nombre}: ${total} pedido${total === 1 ? '' : 's'} (${describirUnidades(resumen)}).`, 'pedido');
    else enDia(dia, `🏪 Local de ${PROVINCIAS_AR[l.prov].nombre}: semana flojita, sin pedidos.`, 'info');
    if (perdidos) enDia(Math.min(6, dia + 1), `🤦 ${enc.nombre}, del local de ${PROVINCIAS_AR[l.prov].nombre}, perdió ${perdidos} pedido${perdidos === 1 ? '' : 's'} (anotados en una servilleta).`, 'mala');
  }
  if (horasMarca > 0) enDia(0, `📣 Publicidad de marca desde el taller: ${String(redondear(horasMarca, 1)).replace('.', ',')} h. Ayuda a que los locales ganen reputación más rápido.`, 'buena');
  else evento('Sin publicidad de marca: los locales crecen más despacio.', 'info');
  return pedidos;
}

// Ofertas especiales de la semana: clubes de barrio y empresas, con un tope de 3 en todo el país.
function ofertasEspecialesPais(e, enDia, evento) {
  const candidatos = [];
  for (const tipo of ['catering', 'colectivos']) if (e.empresas.proximo[tipo] && e.semana >= e.empresas.proximo[tipo]) candidatos.push({ tipo });
  for (const tipo of ['belleza', 'merchandising', 'eventos']) if (e.pais.empresas[tipo] && e.semana >= e.pais.empresas[tipo]) candidatos.push({ tipo });
  for (const l of e.pais.locales) {
    if (l.encargado && siguienteAzar(e) < CLUBES_BARRIO.probPorLocal) candidatos.push({ tipo: 'club', local: l.prov });
    if (l.encargado?.rasgos.includes('puntual') && siguienteAzar(e) < EMPRESAS_PAIS.probPuntual) {
      const t = ['belleza', 'merchandising', 'eventos'][Math.floor(siguienteAzar(e) * 3)];
      candidatos.push({ tipo: t, extra: true });
    }
  }
  const elegidos = mezclar(e, candidatos).slice(0, PAIS.topeEspeciales);
  for (const c of elegidos) {
    if (c.tipo === 'club') nuevaOfertaClub(e, c.local, enDia);
    else nuevaOfertaEmpresa(e, c.tipo, enDia, evento, c.extra);
  }
}

function nuevaOfertaClub(e, prov, enDia) {
  const C = CLUBES_BARRIO;
  const deportivo = presentes(e, 'disenador').some((x) => x.variante === 'deportivo');
  const nombre = `${C.nombres[Math.floor(siguienteAzar(e) * C.nombres.length)]} (${PROVINCIAS_AR[prov].nombre})`;
  const escudo = e.maquinas.bordado && siguienteAzar(e) < C.probEscudo;
  const producto = escudo ? 'camisetaEscudo' : 'camisetaBarrio';
  const cant = enteroEntre(e, C.min, C.max);
  const diseno = siguienteAzar(e) < (deportivo ? PUESTOS.disenador.variantes.deportivo.probDiseno : C.diseno.prob);
  const precio = Math.round(cant * PRODUCTOS[producto].precio * (diseno ? 1 + C.diseno.recargo : 1));
  e.pedidosEmpresa.push({
    id: `club${e.semana}-${prov}`, tipo: 'club', cliente: nombre, items: { [producto]: cant }, precio, vence: e.semana + C.plazo, cobro: C.cobroSemanas,
    estado: 'oferta', tercerizar: false, factorTerc: redondear(entre(e, TERCERIZAR.min, TERCERIZAR.max), 3), fijo: false, diseno, local: prov,
  });
  enDia(1 + Math.floor(siguienteAzar(e) * 4), `⚽ ${nombre} te encargó ${cant} ${nombreUnidades(producto, cant)}${diseno ? ' con su escudo y diseño propio 🎨' : ''} para dentro de ${C.plazo} semanas.`, 'oportunidad');
}

// ---------- Traslado y llegada a los locales ----------
export function costoTraslado(e, valor, prov, transporte = e.pais?.transporte) {
  const l = e.pais.locales.find((x) => x.prov === prov);
  if (!l || l.origen) return 0;
  return Math.round(valor * TRANSPORTE[transporte].parte);
}

// Reputación que suma cada unidad entregada en un local: lo que gana por semana, repartido en lo que vende.
export function repPorUnidadLocal(e, l) {
  const esperadas = Math.max(1, unidadesEsperadasLocal(e, l));
  const red = 1 + PAIS.redPorLocal * (e.pais.locales.length - 1);
  const impulso = e.pais.impulso && e.semana <= e.pais.impulso.hasta ? e.pais.impulso.factor : 1;
  const lelo = e.leloComercial && e.pais.lelo?.local === l.prov && e.equipo.empleados.some((x) => x.esLelo) ? LELO_COMERCIAL.rep : 1;
  const conocido = l.encargado?.rasgos.includes('conocido') ? 1.3 : 1;
  return (PAIS.repSemanal * red * (e.pais.marcaFactor || 1) * impulso * lelo * conocido) / esperadas;
}

function moverRepLocal(e, l, d) {
  l.rep = limitar(redondear(l.rep + d, 3), 0, 100);
}

// Mandás lo que entregás esta semana: llega a cada local la semana que viene.
function enviarALocal(e, r, p, precio, transporte) {
  const l = e.pais.locales.find((x) => x.prov === p.local);
  if (!l) return;
  const costo = costoTraslado(e, precio, p.local, transporte);
  if (costo) { e.plata -= costo; r.gastos += costo; r.traslado = (r.traslado || 0) + costo; }
  // Amigo de los proveedores: el insumo de lo que vende ese local sale un 10% menos
  if (l.encargado?.rasgos.includes('proveedores')) {
    const ahorro = Math.round(PRODUCTOS[p.producto].costo * p.cantidad * 0.1);
    e.plata += ahorro; r.gastos -= ahorro;
  }
  let envio = e.pais.envios.find((x) => x.local === p.local && x.llega === e.semana + 1);
  if (!envio) { envio = { local: p.local, llega: e.semana + 1, items: {}, valor: 0, transporte: l.origen ? null : transporte }; e.pais.envios.push(envio); }
  envio.items[p.producto] = (envio.items[p.producto] || 0) + p.cantidad;
  envio.valor += precio;
}

function llegadaEnvios(e, r, evento) {
  const llegan = e.pais.envios.filter((x) => x.llega <= e.semana);
  e.pais.envios = e.pais.envios.filter((x) => x.llega > e.semana);
  let cobrado = 0;
  let perdidasTotales = 0;
  for (const env of llegan) {
    const l = e.pais.locales.find((x) => x.prov === env.local);
    if (!l) continue;
    const nombre = PROVINCIAS_AR[env.local].nombre;
    let parte = 1; // lo que llega
    if (env.transporte) {
      const t = TRANSPORTE[env.transporte];
      if (siguienteAzar(e) < t.falla) {
        const total = siguienteAzar(e) < t.total;
        parte = total ? 0 : 1 - entre(e, TRANSPORTE.parcial.min, TRANSPORTE.parcial.max);
      }
    }
    const unidades = Object.values(env.items).reduce((a, b) => a + b, 0);
    const llegaron = {};
    const perdidas = {};
    if (parte < 1) {
      // Se pierden unidades al azar de lo que iba
      const lista = [];
      for (const [id, n] of Object.entries(env.items)) for (let i = 0; i < n; i++) lista.push(id);
      mezclar(e, lista);
      const pierde = parte === 0 ? lista.length : Math.max(1, Math.round(lista.length * (1 - parte)));
      lista.forEach((id, i) => { if (i < pierde) perdidas[id] = (perdidas[id] || 0) + 1; else llegaron[id] = (llegaron[id] || 0) + 1; });
    } else Object.assign(llegaron, env.items);
    const nLlegaron = Object.values(llegaron).reduce((a, b) => a + b, 0);
    const nPerdidas = unidades - nLlegaron;
    // Se cobra lo que llegó (proporcional al valor), con la defensa "precio de batalla" para los simples
    let ingreso = Math.round(env.valor * (nLlegaron / Math.max(1, unidades)));
    if (e.pais.defensas.remeraFeliz) {
      const simples = PRODUCTOS_SIMPLES.reduce((t, id) => t + (llegaron[id] || 0) * PRODUCTOS[id].precio, 0);
      ingreso -= Math.round(simples * DEFENSAS_PAIS.remeraFeliz.descuento);
    }
    if (l.encargado?.rasgos.includes('manosLargas')) {
      const robo = Math.round(ingreso * 0.05);
      ingreso -= robo;
      r.manosLargas = (r.manosLargas || 0) + robo;
    }
    e.plata += ingreso; r.ingresos += ingreso; cobrado += ingreso;
    l.vendidas += nLlegaron;
    e.totales.vendidas += nLlegaron;
    const gu = repPorUnidadLocal(e, l);
    moverRepLocal(e, l, gu * nLlegaron + gu * PAIS.noEntregado * nPerdidas);
    if (nPerdidas) {
      perdidasTotales += nPerdidas;
      const plantilla = parte === 0
        ? TRANSPORTE.textosTotal[Math.floor(siguienteAzar(e) * TRANSPORTE.textosTotal.length)]
        : TRANSPORTE.textosParcial[Math.floor(siguienteAzar(e) * TRANSPORTE.textosParcial.length)];
      evento(`🚚 ${plantilla.replace('{local}', nombre).replace('{u}', describirUnidades(perdidas))} Lo que no llegó cuenta como no entregado en ese local.`, parte === 0 ? 'desastre' : 'mala');
    }
  }
  if (cobrado) r.lineas.push(`Los locales cobraron ${plata$(cobrado)} por lo que llegó esta semana.`);
  if (r.manosLargas) evento(`Al hacer la caja de los locales faltaron ${plata$(r.manosLargas)}. Alguien tiene manos largas...`, 'mala');
  return perdidasTotales;
}

// Mercadería en camino (para mostrar).
export function enCamino(e) {
  return (e.pais?.envios || []).reduce((t, x) => t + Object.values(x.items).reduce((a, b) => a + b, 0), 0);
}

// ---------- Topa, las marcas e InfoArg ----------
function semanasEnPais(e) {
  return e.semana - e.pais.inicio + 1;
}

function avanzarTopa(e, evento) {
  const t = e.pais.topa;
  const s = semanasEnPais(e);
  let objetivo;
  if (s >= TOPA.llega100) objetivo = 100;
  else if (s >= TOPA.llega99) objetivo = 99;
  else objetivo = Math.min(98.9, (99 * s) / TOPA.llega99 + TOPA.ruido * (siguienteAzar(e) * 2 - 1));
  t.rep = redondear(Math.max(t.rep, objetivo), 1);
  if (t.rep >= 99 && !t.aviso99) {
    t.aviso99 = true;
    t.visible = 99;
    evento(`📰 InfoArg, en tapa: "${TOPA.nombre} ya huele el título: tiene 99 puntos y en dos meses sería la marca del país."`, 'desastre');
  } else if (t.aviso99 && !t.aviso2 && s >= TOPA.llega99 + 4) {
    t.aviso2 = true;
    evento(`📰 InfoArg: "A ${TOPA.nombre} le falta nada: un mes y es la marca del país."`, 'desastre');
  }
}

function planearAtaque(e, desde = e.semana) {
  const marcas = Object.keys(MARCAS);
  const marca = marcas[Math.floor(siguienteAzar(e) * marcas.length)];
  const anuncio = desde + enteroEntre(e, ATAQUES_PAIS.cada.min, ATAQUES_PAIS.cada.max);
  const d = MARCAS[marca].demora;
  e.pais.ataque = { marca, anuncio, semana: anuncio + enteroEntre(e, d.min, d.max), anunciado: false };
}

function ejecutarAtaque(e, evento) {
  const a = e.pais.ataque;
  const m = MARCAS[a.marca];
  const objetivos = e.pais.locales.filter((l) => l.rep > 0);
  planearAtaque(e);
  if (!objetivos.length) return;
  const pesos = objetivos.map((l) => (l.encargado?.rasgos.includes('buchon') ? ATAQUES_PAIS.pesoBuchon : 1));
  let tirada = siguienteAzar(e) * pesos.reduce((x, y) => x + y, 0);
  let l = objetivos[0];
  for (let i = 0; i < objetivos.length; i++) { tirada -= pesos[i]; if (tirada <= 0) { l = objetivos[i]; break; } }
  const defensa = e.pais.defensas[a.marca];
  const parte = ATAQUES_PAIS.dano * (defensa ? ATAQUES_PAIS.conDefensa : 1);
  const d = -l.rep * parte;
  moverRepLocal(e, l, d);
  const texto = m.ataque.replace('{local}', PROVINCIAS_AR[l.prov].nombre);
  evento(`💥 ${texto} El local perdió ${String(Math.abs(redondear(d, 1))).replace('.', ',')} de reputación${defensa ? ` (tu ${DEFENSAS_PAIS[a.marca].nombre.toLowerCase()} frenó la mitad)` : ''}.`, 'desastre');
}

function infoArgMensual(e, c, evento) {
  const t = e.pais.topa;
  t.visible = Math.round(Math.min(t.rep, 99));
  t.mesVisible = c.nombreMes;
  const chisme = INFOARG[Math.floor(siguienteAzar(e) * INFOARG.length)];
  evento(`📰 InfoArg: "${TOPA.nombre} ya tiene ${t.visible} de reputación en el país." Además: ${chisme}`, 'info');
}

// ---------- Eventos de marca y ofertas esporádicas ----------
function sacarEventoMarca(e, evento) {
  const ev = EVENTOS_MARCA.lista[Math.floor(siguienteAzar(e) * EVENTOS_MARCA.lista.length)];
  e.pais.eventoProximo = e.semana + enteroEntre(e, EVENTOS_MARCA.cada.min, EVENTOS_MARCA.cada.max);
  e.decisiones.push({ id: ev.id, texto: ev.texto, monto: baseMazo(e) });
  evento(`🌟 ${ev.texto} Lo decidís el domingo.`, 'oportunidad');
}

function impulsar(e, semanas) {
  const hasta = e.semana + semanas - 1;
  e.pais.impulso = { factor: EVENTOS_MARCA.impulso, hasta: Math.max(hasta, e.pais.impulso?.hasta || 0) };
}

// Resuelve un evento de marca (lo llama resolverDecision).
function resolverEventoMarca(e, d, opcion) {
  const gastar = (m) => { m = Math.round(m / 1000) * 1000; e.plata -= m; e.finanzas.mesActual -= m; return m; };
  const todos = (x) => { for (const l of e.pais.locales) moverRepLocal(e, l, x); recalcularRepPais(e); };
  const base = d.monto || baseMazo(e);
  switch (`${d.id}.${opcion}`) {
    case 'diez.aprovecha': { const m = gastar(base * 0.2); todos(3); impulsar(e, 4); return `Saliste con todo: campaña nacional (−${plata$(m)}). +3 de reputación en todos los locales y van a crecer al triple 4 semanas.`; }
    case 'diez.nada': todos(1); return 'Dejaste que pase solo: igual sumaste +1 en todos los locales.';
    case 'comedor.dona': {
      const meta = base * 0.1;
      let valor = 0;
      const donado = {};
      while (valor < meta) { const id = venderUnaDelStock(e); if (!id) break; valor += PRODUCTOS[id].costo; donado[id] = (donado[id] || 0) + 1; }
      const plataPuesta = valor < meta ? gastar(meta - valor) : 0;
      todos(2); impulsar(e, 3);
      return `Donaste ${describirUnidades(donado) || 'productos'}${plataPuesta ? ` y pusiste ${plata$(plataPuesta)}` : ''}. Los chicos felices: +2 en todos los locales y crecen al triple 3 semanas.`;
    }
    case 'maraton.participa': { const m = gastar(base * 0.15); e.horasPerdidas += 6; todos(2.5); impulsar(e, 4); return `Fuiste sponsor de la maratón (−${plata$(m)} y 6 h): +2,5 en todos los locales y crecen al triple 4 semanas.`; }
    case 'streamer.paga': { const m = gastar(base * 0.25); todos(2); impulsar(e, 6); return `La streamer mostró tu marca toda la semana (−${plata$(m)}): +2 en todos los locales y crecen al triple 6 semanas.`; }
    case 'tele.nota': { const m = gastar(base * 0.05); e.horasPerdidas += 6; todos(2); impulsar(e, 3); return `Saliste en la tele (−${plata$(m)} y 6 h ordenando todo): +2 en todos los locales y crecen al triple 3 semanas.`; }
    case 'comedor.no': case 'maraton.no': case 'streamer.no': case 'tele.no': return 'Lo dejaste pasar.';
    default: return null;
  }
}

// Ofertas esporádicas (en amarillo): campaña de lanzamiento, publicidad nacional y expansión inmediata.
const OFERTAS_PAIS = {
  lanzamiento: { nombre: 'Campaña de lanzamiento', detalle: '+20 de reputación de golpe en el local que elijas.', parte: 0.3 },
  publicidad: { nombre: 'Publicidad nacional', detalle: 'Todos los locales venden un 20% más durante 4 semanas.', parte: 0.4 },
  expansion: { nombre: 'Expansión inmediata', detalle: 'El próximo local que abras en las próximas 4 semanas paga la mitad del armado.', parte: 0 },
};
export { OFERTAS_PAIS };

function sacarOfertaPais(e, evento) {
  const ids = Object.keys(OFERTAS_PAIS);
  const id = ids[Math.floor(siguienteAzar(e) * ids.length)];
  e.pais.ofertaProxima = e.semana + enteroEntre(e, 8, 12);
  const precio = Math.max(100000, Math.round((baseMazo(e) * OFERTAS_PAIS[id].parte) / 10000) * 10000);
  e.pais.oferta = { id, hasta: e.semana + 2, precio: id === 'expansion' ? 0 : precio };
  evento(`💡 Te ofrecen: ${OFERTAS_PAIS[id].nombre}. ${OFERTAS_PAIS[id].detalle} Está disponible 2 domingos.`, 'oportunidad');
}

export function ofertaPaisVigente(e) {
  const o = e.pais?.oferta;
  return o && e.semana <= o.hasta ? { ...o, ...OFERTAS_PAIS[o.id] } : null;
}

export function tomarOfertaPais(e, prov) {
  const o = ofertaPaisVigente(e);
  if (!o) return { ok: false, motivo: 'No hay ninguna oferta vigente.' };
  if (e.semanaEnCurso) return { ok: false, motivo: 'Se decide el domingo.' };
  if (o.precio > e.plata) return { ok: false, motivo: `Cuesta ${plata$(o.precio)} y tenés ${plata$(e.plata)}.` };
  const l = o.id === 'lanzamiento' ? e.pais.locales.find((x) => x.prov === prov) : null;
  if (o.id === 'lanzamiento' && !l) return { ok: false, motivo: 'Elegí el local.' };
  e.plata -= o.precio; e.finanzas.mesActual -= o.precio;
  e.pais.oferta = null;
  if (o.id !== 'expansion' && siguienteAzar(e) < 0.01) return { ok: true, mensaje: `Pagaste ${plata$(o.precio)}... y la agencia desapareció con la plata. Una vez en cien pasa.` };
  if (o.id === 'lanzamiento') { moverRepLocal(e, l, 20); recalcularRepPais(e); return { ok: true, mensaje: `Campaña de lanzamiento en ${PROVINCIAS_AR[l.prov].nombre} (${plata$(o.precio)}): +20 de reputación en ese local.` }; }
  if (o.id === 'publicidad') { e.pais.publicidadNacional = e.semana + 3; return { ok: true, mensaje: `Publicidad nacional (${plata$(o.precio)}): todos los locales venden un 20% más durante 4 semanas.` }; }
  e.pais.expansion = e.semana + 3;
  return { ok: true, mensaje: 'Expansión inmediata: el próximo local que abras en 4 semanas paga la mitad del armado.' };
}

// ---------- La semana del país (al cerrar) ----------
function semanaDelPais(e, r, evento) {
  if (e.mejorDelPais) return;
  avanzarTopa(e, evento);
  const a = e.pais.ataque;
  if (a && !a.anunciado && e.semana >= a.anuncio) {
    a.anunciado = true;
    evento(`📰 InfoArg: "${MARCAS[a.marca].anuncio}"`, 'rumor');
  }
  if (a && e.semana >= a.semana) ejecutarAtaque(e, evento);
  if (e.semana >= e.pais.eventoProximo) sacarEventoMarca(e, evento);
  if (e.semana >= e.pais.ofertaProxima && !ofertaPaisVigente(e)) sacarOfertaPais(e, evento);
  // Encargados: se les conoce el carácter después de una semana
  for (const l of e.pais.locales) {
    const enc = l.encargado;
    if (!enc) continue;
    enc.semanasMes++;
    if (!enc.visible && e.semana > enc.desde) {
      enc.visible = true;
      const rs = enc.rasgos.map((x) => ENCARGADO.rasgos[x]);
      evento(`Ya conocés a ${enc.nombre}, del local de ${PROVINCIAS_AR[l.prov].nombre}: ${rs.length ? rs.map((x) => `${x.nombre.toLowerCase()} (${x.efecto})`).join('; ') : 'ni fu ni fa'}.`, rs.some((x) => !x.bueno) ? 'mala' : 'buena');
    }
  }
}

function cierreDeMesPais(e, c, r, evento) {
  const g = gastosLocalesDelMes(e);
  const total = g.alquileres + g.encargados + g.defensas;
  e.plata -= total; r.gastos += total; e.finanzas.mesActual -= total;
  evento(`Locales: pagaste ${plata$(g.alquileres)} de alquileres y ${plata$(g.encargados)} de encargados${g.defensas ? `, más ${plata$(g.defensas)} de defensas` : ''}.`);
  for (const l of e.pais.locales) {
    if (l.encargado) l.encargado.semanasMes = 0;
    if (l.encargado?.rasgos.includes('peleador')) {
      moverRepLocal(e, l, -1);
      if (l.encargado.visible) evento(`${l.encargado.nombre} se volvió a pelear con un cliente en ${PROVINCIAS_AR[l.prov].nombre}: −1 de reputación en ese local.`, 'mala');
    }
  }
  recalcularRepPais(e);
  if (!e.mejorDelPais) infoArgMensual(e, c, evento);
}

// ---------- Licitación de segunda: requisitos ----------
export function cumpleRequisito(e, id) {
  const tiene = (v) => presentes(e, 'disenador').some((x) => x.variante === v) || e.equipo.empleados.some((x) => x.puesto === 'disenador' && x.variante === v);
  const provs = new Set((e.pais?.locales || []).map((l) => l.prov));
  switch (id) {
    case 'deportivo': return tiene('deportivo');
    case 'textil': return tiene('textil');
    case 'locales': return provs.size >= 5;
    case 'grandes': return ['buenosAires', 'cordoba', 'santaFe'].every((p) => provs.has(p));
    case 'rep': return e.rep >= 30;
    case 'fijos': return Object.values(e.empresas.clientes).filter((x) => x.fijo).length >= 3;
    default: return false;
  }
}

export function puedeOfertarLicitacion(e) {
  const a = e.licitacion.abierta;
  if (!a) return { ok: false, motivo: 'No hay ninguna licitación abierta.' };
  if (!e.maquinas.calandra) return { ok: false, motivo: 'Para participar necesitás la calandra.' };
  if (e.licitacion.contrato) return { ok: false, motivo: 'Todavía estás con otro contrato.' };
  if (a.tipo === 'segunda') {
    const faltan = a.requisitos.filter((id) => !cumpleRequisito(e, id));
    if (faltan.length) return { ok: false, motivo: `Te falta: ${faltan.map((id) => LICITACION_SEGUNDA.requisitos[id].toLowerCase()).join('; ')}.` };
    if (a.especial) {
      const sin = LICITACION_SEGUNDA.especiales[a.especial].requiere.filter((m) => !e.maquinas[m]);
      if (sin.length) return { ok: false, motivo: `Pide ${LICITACION_SEGUNDA.especiales[a.especial].texto}: necesitás la ${sin.map((m) => MAQUINAS[m].nombre.toLowerCase()).join(' y la ')}.` };
    }
  }
  return { ok: true };
}

export function fmt(n) {
  return Math.round(n).toLocaleString('es-AR');
}

export {
  HORAS_POR_SEMANA, PRODUCTOS, MAQUINAS, CURSOS, VENTAS, PRESTAMO, TUTORIAL, PROMO, CANSANCIO, PUESTOS, RASGOS, EQUIPO, CAPACITACION,
  MAZO, LOCALES, VOLANTES, SERVICIOS, CYBER, TRAICIO, LELO_VIAJE, PROVINCIA, LELO_GERENTE, DEFENSAS, SEGURIDAD, EMPRESAS, LICITACION, TERCERIZAR,
  LELO_EMPLEADO, ABUELA, RRHH, PROVINCIAS_AR, PAIS, ENCARGADO, TRANSPORTE, LELO_COMERCIAL, TOPA, MARCAS, DEFENSAS_PAIS, GRANDES,
  EMPRESAS_PAIS, CLUBES_BARRIO, LICITACION_SEGUNDA, EVENTOS_MARCA, TRAICIO_TEXTOS,
};

// Cómo te mostramos en el taller.
export function elegirGenero(e, genero) {
  if (!['hombre', 'mujer'].includes(genero)) return { ok: false, motivo: 'Elegí cómo te mostramos.' };
  e.genero = genero;
  return { ok: true };
}
