// Motor del juego "El Taller". Lógica pura: no toca la pantalla ni el guardado.
import {
  HORAS_POR_SEMANA, SEMANAS_POR_ANIO, MESES, MAQUINAS, PRODUCTOS, FECHAS_ESPECIALES,
  PRESTAMO, GASTOS_FIJOS, VENTAS, REPUTACION, PRIMO, CURSO_CORTO, MAZO, TUTORIAL, PROMO, CLIENTES,
} from './data.js';

export const VERSION_PARTIDA = 1;

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

export function fechaEspecial(semana) {
  const c = calendario(semana);
  return FECHAS_ESPECIALES.find((f) => f.mes === c.mes && f.semanas.includes(c.semanaDelMes)) || null;
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
  return limitar(e.formacion.fija + e.formacion.actualizacion, 0, 100);
}

export function horasPorUnidad(e, idProducto) {
  return PRODUCTOS[idProducto].horas * Math.max(0.35, 1 - e.exp * 0.016);
}

export function horasPorVenta(e) {
  return VENTAS.horasPorVentaRedes * (1 - e.exp / 200);
}

export function probabilidadError(e) {
  return limitar(0.04 * (1 - e.exp / 125) * (1 + e.cansancio / 40) * (1 - formacionTotal(e) / 200), 0.005, 0.5);
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
  const fecha = fechaEspecial(semana);
  const especial = fecha?.efecto[idProducto] ?? 1;
  const ml = e.rep >= VENTAS.reputacionMercadoLibre ? 1 + VENTAS.extraMercadoLibre : 1;
  return p.base * multiplicadorProducto(e.rep, p.sens) * temporada * especial * ml;
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
    formacion: { fija: 0, actualizacion: 0 },
    curso: { semanasRestantes: 0 },
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
  };
  prepararMazo(e);
  planearPrimo(e);
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
  const compite = e.semana >= 4 && !e.mejorDeLaCiudad;
  const hayRumor = compite && (e.primo.proximo === 'agresivo' || siguienteAzar(e) < PRIMO.rumor.probFalsaAlarma);
  e.primo.rumor = hayRumor ? PRIMO.rumores[Math.floor(siguienteAzar(e) * PRIMO.rumores.length)] : null;
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
function horasFijas(e, sem) {
  let horas = sem ? sem.horasRedes + (sem.promo ? PROMO.horas : 0) : 0;
  if (e.curso.semanasRestantes > 0) horas += CURSO_CORTO.horasPorSemana;
  return horas;
}

export function horasDelPlan(e, plan, sem = e.semanaEnCurso) {
  let horas = horasFijas(e, sem);
  for (const [id, n] of Object.entries(plan.producir || {})) horas += (n || 0) * horasPorUnidad(e, id);
  if (plan.feria) horas += VENTAS.feria.horas;
  if (plan.curso && e.curso.semanasRestantes === 0) horas += CURSO_CORTO.horasPorSemana;
  return redondear(horas, 1);
}

export function costoDelPlan(plan) {
  let costo = 0;
  for (const [id, n] of Object.entries(plan.producir || {})) costo += (n || 0) * PRODUCTOS[id].costo;
  if (plan.feria) costo += VENTAS.feria.costoMesa;
  if (plan.curso) costo += CURSO_CORTO.costo;
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
  const total = horas + (pub.promo ? PROMO.horas : 0) + (e.curso.semanasRestantes > 0 ? CURSO_CORTO.horasPorSemana : 0);
  if (total > HORAS_POR_SEMANA) errores.push(`Te pasaste de horas: ${total} de ${HORAS_POR_SEMANA}.`);
  return { ok: errores.length === 0, errores };
}

export function publicar(e, pub) {
  const v = validarPublicidad(e, pub);
  if (!v.ok) return { ok: false, errores: v.errores };
  const eventos = [];
  const evento = (t, tipo = 'info') => eventos.push({ texto: t, tipo });
  const compite = e.semana >= 4 && !e.mejorDeLaCiudad;

  // Lelo hace lo que planeó la semana anterior
  const comp = PRIMO.comportamientos.find((x) => x.id === (e.primo.proximo || sortearComportamiento(e)));
  const habiaRumor = Boolean(e.primo.rumor);
  e.primo.comportamiento = comp.id;
  if (compite) {
    if (pub.promo) {
      if (comp.id === 'agresivo') evento('¡Tu promo frenó a Lelo! Su campaña no te sacó ningún pedido y encima atrajiste clientes nuevos.', 'buena');
      else evento('Lanzaste la promo, pero el rumor era humo: Lelo ni apareció. Igual atrajiste algunos clientes.', 'info');
    } else {
      if (habiaRumor && comp.id !== 'agresivo') evento('El rumor era humo: Lelo no hizo ninguna campaña agresiva.', 'buena');
      else if (habiaRumor) evento('El rumor era cierto.', 'mala');
      evento(comp.texto, comp.id === 'tranquilo' ? 'info' : 'mala');
    }
  }
  const sacaLelo = compite && !pub.promo ? comp.saca : 0;
  const extraPromo = pub.promo ? 1 + PROMO.extraDemanda : 1;

  const fecha = fechaEspecial(e.semana);
  if (fecha) evento(`¡${fecha.nombre}! Llegan muchos más pedidos de algunos productos.`, 'buena');

  // Lo que pide el mercado esta semana
  const mercado = {};
  let totalMercado = 0;
  for (const id of Object.keys(PRODUCTOS)) {
    mercado[id] = Math.max(0, Math.round(demandaEsperada(e, id) * extraPromo * entre(e, 0.8, 1.2)));
    totalMercado += mercado[id];
  }

  // Cuánto alcanza tu publicidad
  const alcance = Math.min(totalMercado, Math.floor((pub.horasRedes || 0) / horasPorVenta(e) + 1e-9));
  const captadas = {};
  let resto = alcance;
  const ids = Object.keys(mercado).filter((id) => mercado[id] > 0);
  ids.forEach((id) => { captadas[id] = totalMercado ? Math.floor((alcance * mercado[id]) / totalMercado) : 0; resto -= captadas[id]; });
  for (const id of [...ids].sort((a, b) => mercado[b] - mercado[a])) {
    if (resto <= 0) break;
    if (captadas[id] < mercado[id]) { captadas[id]++; resto--; }
  }

  // Se arman los pedidos (1 a 3 unidades cada uno) y Lelo te pelea cada uno
  const pedidos = [];
  const deLelo = [];
  let n = 0;
  for (const id of ids) {
    let quedan = captadas[id] || 0;
    while (quedan > 0) {
      const cantidad = Math.min(quedan, enteroEntre(e, 1, 3));
      quedan -= cantidad;
      const cliente = CLIENTES[Math.floor(siguienteAzar(e) * CLIENTES.length)];
      const pedido = { id: `p${e.semana}-${++n}`, producto: id, cantidad, cliente, rechazado: false };
      if (siguienteAzar(e) < sacaLelo) deLelo.push(pedido);
      else pedidos.push(pedido);
    }
  }
  mezclar(e, pedidos);
  if (deLelo.length) {
    const u = unidadesPedidas({ pedidos: deLelo });
    const detalle = Object.keys(u).filter((id) => u[id]).map((id) => `${u[id]} ${nombreUnidades(id, u[id])}`).join(', ');
    evento(`Lelo se quedó con ${deLelo.length} pedido${deLelo.length > 1 ? 's' : ''} (${detalle}).`, 'mala');
  }
  const sinCaptar = totalMercado - alcance;
  if (sinCaptar > 0 && totalMercado > 0) {
    evento(`Con más horas de publicidad te podrían haber pedido ${sinCaptar} producto${sinCaptar > 1 ? 's' : ''} más.`, 'mala');
  }

  e.semanaEnCurso = {
    semana: e.semana, horasRedes: pub.horasRedes || 0, promo: Boolean(pub.promo),
    pedidos, pedidosLelo: deLelo.length, mercado: totalMercado, eventos,
  };
  return { ok: true, semana: e.semanaEnCurso };
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
  if (plan.curso && e.curso.semanasRestantes > 0) errores.push('Ya estás haciendo el curso.');
  if (plan.curso && e.semana < 7) errores.push('El curso se habilita en la semana 7.');
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

  // 1. Producción (con errores por producto)
  const pError = probabilidadError(e);
  let producidas = 0;
  const arruinadas = {};
  for (const [id, n] of Object.entries(plan.producir || {})) {
    for (let i = 0; i < (n || 0); i++) {
      e.plata -= PRODUCTOS[id].costo;
      r.gastos += PRODUCTOS[id].costo;
      if (siguienteAzar(e) < pError) { arruinadas[id] = (arruinadas[id] || 0) + 1; continue; }
      e.stock[id] += 1;
      producidas++;
    }
  }
  const totalArruinadas = Object.values(arruinadas).reduce((s, x) => s + x, 0);
  e.exp = limitar(e.exp + (producidas + totalArruinadas) * 0.08, 0, 100);
  e.totales.producidas += producidas;
  if (producidas + totalArruinadas > 0) linea(`Produjiste ${producidas} unidades.`);
  for (const [id, x] of Object.entries(arruinadas)) {
    evento(`Se te arruinaron ${x} ${nombreUnidades(id, x)} en la prensa (perdiste $${fmt(x * PRODUCTOS[id].costo)} de insumo).`, 'mala');
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
  const activos = sem.pedidos.filter((p) => !p.rechazado).length;
  if (activos) linea(`Entregaste ${entregados} de ${activos} pedidos (${unidadesEntregadas} productos).`);
  else if (!sem.pedidos.length) linea('No llegaron pedidos esta semana.');

  // 3. Feria (vende del stock que te sobró)
  let vendidasFeria = 0;
  if (plan.feria) {
    e.plata -= VENTAS.feria.costoMesa;
    r.gastos += VENTAS.feria.costoMesa;
    const multFeria = 1 + (multiplicadorReputacion(e.rep) - 1) * 0.5;
    let cupo = Math.round(enteroEntre(e, VENTAS.feria.min, VENTAS.feria.max) * multFeria);
    while (cupo > 0) {
      const conStock = Object.keys(e.stock).filter((id) => e.stock[id] > 0);
      if (!conStock.length) break;
      const totalStock = conStock.reduce((s, id) => s + e.stock[id], 0);
      let t = siguienteAzar(e) * totalStock;
      const id = conStock.find((x) => (t -= e.stock[x]) < 0) || conStock[0];
      e.stock[id]--;
      e.plata += PRODUCTOS[id].precio;
      r.ingresos += PRODUCTOS[id].precio;
      deltaRep += REPUTACION.porVenta;
      vendidasFeria++;
      cupo--;
    }
    linea(`En la feria vendiste ${vendidasFeria}${cupo > 0 ? ` (te quedaste sin stock: podrías haber vendido ${cupo} más)` : ''}.`);
  }

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
  e.cansancio = horas > 40
    ? limitar(e.cansancio + (horas - 40) * 1.2, 0, 100)
    : limitar(e.cansancio - (40 - horas) * 1.5, 0, 100);
  e.cansancio = redondear(e.cansancio, 1);
  if (e.cansancio >= 80) evento('Estás reventado. Si seguís así te vas a mandar macanas: descansá.', 'mala');
  if (plan.curso) {
    e.plata -= CURSO_CORTO.costo;
    r.gastos += CURSO_CORTO.costo;
    e.curso.semanasRestantes = CURSO_CORTO.semanas;
  }
  if (e.curso.semanasRestantes > 0) {
    e.curso.semanasRestantes--;
    if (e.curso.semanasRestantes === 0) {
      e.formacion.actualizacion = limitar(e.formacion.actualizacion + CURSO_CORTO.puntos, 0, 40);
      evento(`Terminaste el curso corto: +${CURSO_CORTO.puntos} de formación.`, 'buena');
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
    evento('¡Lograste ser el mejor de la ciudad! Lelo no pudo competir y cerró: ahora es empleado tuyo.', 'hito');
  }
  if (repInicial < VENTAS.reputacionMercadoLibre && e.rep >= VENTAS.reputacionMercadoLibre) {
    evento('Con tu reputación, Mercado Libre empieza a traerte pedidos en serio.', 'buena');
  }

  r.plata = e.plata;
  r.rep = e.rep;
  r.repDelta = redondear(e.rep - repInicial);
  e.semana += 1;
  e.semanaEnCurso = null;

  // 10. Lelo planea la semana que viene (puede correr un rumor)
  planearPrimo(e);
  if (e.primo.rumor) evento(e.primo.rumor, 'rumor');
  e.ultimoResumen = r;
  return { ok: true, resumen: r };
}

// Atajo para simulaciones: publicidad + producción en una sola llamada.
// plan.producir puede ser un objeto o una función (semanaEnCurso) => objeto.
export function jugarSemana(e, plan) {
  const p = publicar(e, { horasRedes: plan.horasRedes || 0, promo: plan.promo });
  if (!p.ok) return p;
  const producir = typeof plan.producir === 'function' ? plan.producir(e.semanaEnCurso) : (plan.producir || {});
  const res = cerrarSemana(e, { producir, feria: plan.feria, curso: plan.curso });
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

  // Actualización de formación: baja 5 por mes
  e.formacion.actualizacion = Math.max(0, e.formacion.actualizacion - 5);

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

export { HORAS_POR_SEMANA, PRODUCTOS, MAQUINAS, CURSO_CORTO, VENTAS, PRESTAMO, TUTORIAL, PROMO };
