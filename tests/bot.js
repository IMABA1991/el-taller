// El "buen jugador" de las simulaciones: lo usan tests/pais.js y tests/_calib.js.
// Juega ciudad, provincia y país con criterio: sueldos de mercado, colchón de caja (reserva + sueldos + alquileres),
// no contrata más de lo que puede pagar, achica si cierra el mes en rojo, se muda solo si el alquiler entra en lo que vende.
import {
  mediaSueldo, PUESTOS, alquilerLocal,
  nuevaPartida, jugarSemana, demandaEsperada, horasPorUnidad, horasPorVenta, validarPlan, validarPublicidad,
  comprarMaquina, pagarPrestamoA, costoPagoAnticipadoA, unidadesPedidas, stockTotal, PRODUCTOS, MAQUINAS,
  presentes, empleadosContratados, cupoEquipo, llamarAChuchu, chuchuDisponible, contratar, publicarAnuncio, despedir, responderAumento,
  horasEmpleado, enProvincia, enPais, unidadesEmpresa, responderPedidoEmpresa, tercerizarPedidoEmpresa, tercerizarPedido,
  ofertarLicitacion, cambiarDefensa, contratarSeguridad, alquilarLocal, localesDisponibles, prestamoDisponible, pedirPrestamo,
  proximaMaquina, irALaBolsa, fuisteALaBolsa, LOCALES, ponerNombreTaller, abrirLocal, provinciasLibres, costoAbrirLocal,
  asignarLelo, cambiarDefensaPais, ofertaPaisVigente, tomarOfertaPais, demandaLocal, tercerizarResto, puedeOfertarLicitacion,
  capacidadEquipo, LICITACION_SEGUNDA, PROVINCIAS_AR,
} from '../js/engine.js';

const RESERVA = 300000;
export const PROVS = Object.keys(PROVINCIAS_AR);

// Un buen jugador no se queda sin caja: guarda 2 meses de gastos fijos (sueldos y alquileres) además de la reserva.
function colchon(e) {
  const sueldos = e.equipo.empleados.reduce((t, x) => t + x.sueldo, 0);
  const alquileres = LOCALES[e.local || 'casa'].alquiler + (e.pais?.locales || []).reduce((t, l) => t + (l.encargado?.sueldo || 0), 0);
  return RESERVA + sueldos + alquileres;
}

function manejarTaller(e) {
  const prox = proximaMaquina(e);
  if (prox?.disponible && e.semana > 8 && !MAQUINAS[prox.id].desdePais) {
    const d = prestamoDisponible(e);
    if (d.ok && e.plata + d.tope >= prox.precio + colchon(e) && e.plata < prox.precio + colchon(e)) pedirPrestamo(e, 'A', d.tope);
    if (e.plata >= prox.precio + colchon(e)) comprarMaquina(e, prox.id);
  }
  if (e.prestamo.opcion === 'A' && !e.prestamo.pagado && e.plata > costoPagoAnticipadoA(e.semana, e.prestamo) + colchon(e) * 2) pagarPrestamoA(e);
  if (enProvincia(e)) {
    if (!e.defensas.proteccion) cambiarDefensa(e, 'proteccion', true);
    if (!e.defensas.seguro) cambiarDefensa(e, 'seguro', true);
    if (!e.seguridad && e.plata > RESERVA) contratarSeguridad(e);
  }
  for (const p of e.pedidosEmpresa) {
    // Un pedido de empresa se cobra semanas después: lo toma solo si puede bancar el costo sin tocar el colchón
    const valor = Object.entries(p.items).reduce((t, [id, n]) => t + PRODUCTOS[id].precio * n, 0);
    if (p.estado === 'oferta') responderPedidoEmpresa(e, p.id, e.plata >= valor + colchon(e));
    const sinMaquina = Object.keys(p.items).some((id) => !e.maquinas[PRODUCTOS[id].maquina]);
    if (p.estado === 'aceptado' && sinMaquina) tercerizarPedidoEmpresa(e, p.id, true);
  }
  const a = e.licitacion.abierta;
  if (a?.semana === e.semana && puedeOfertarLicitacion(e).ok && !a.grande) ofertarLicitacion(e, a.tipo === 'segunda' ? Math.round(a.precioRef * 0.93) : Math.round(e.licitacion.abierta.precioRef * 0.95));
}

// En el país: abrir locales (de las provincias más pobladas a las menos), defensas, Lelo y ofertas.
function manejarPais(e, eventos) {
  if (!enPais(e) || e.mejorDelPais) return;
  if (e.pedirNombreSA) ponerNombreTaller(e, 'Talleres Prueba', true);
  for (const m of Object.keys(e.pais.defensas)) if (!e.pais.defensas[m] && e.plata > 2_000_000) cambiarDefensaPais(e, m, true);
  // Lelo va al local con menos reputación (se puede cambiar una vez por mes)
  const peor = [...e.pais.locales].sort((x, y) => x.rep - y.rep)[0];
  if (peor) asignarLelo(e, peor.prov);
  const o = ofertaPaisVigente(e);
  if (o && eventos && o.precio < e.plata - 5_000_000) tomarOfertaPais(e, peor?.prov);
  // Abre locales mientras le alcance (con un colchón para sueldos y producción)
  const libres = provinciasLibres(e).sort((x, y) => PROVINCIAS_AR[y].pob - PROVINCIAS_AR[x].pob);
  for (const prov of libres) {
    const c = costoAbrirLocal(e, prov);
    const fijos = e.equipo.empleados.reduce((t, x) => t + x.sueldo, 0) + LOCALES[e.local || 'casa'].alquiler + e.pais.locales.reduce((t, l) => t + alquilerLocal(e, l) + (l.encargado?.sueldo || 0), 0);
    if (e.plata < c.total * 1.6 + 3_000_000 + fijos * 2) continue;
    abrirLocal(e, prov, e.plata > c.total * 3 ? 'senior' : 'junior');
    break;
  }
  // Mudanza cuando no entra más gente
  if (empleadosContratados(e) >= cupoEquipo(e)) {
    const sig = localesDisponibles(e).find((id) => LOCALES[id].cupo > cupoEquipo(e) && (!LOCALES[id].localesMin || e.pais.locales.length >= LOCALES[id].localesMin));
    if (sig && e.plata > LOCALES[sig].alquiler * 4 + colchon(e)) alquilarLocal(e, sig);
  }
}

function contratar1(e, puesto) {
  if (empleadosContratados(e) >= cupoEquipo(e)) return false;
  if (e.equipo.anuncio?.candidato?.puesto === puesto) return contratar(e, 'anuncio').ok;
  if (chuchuDisponible(e) && llamarAChuchu(e, puesto).ok && e.equipo.chuchu.candidato) return contratar(e, 'chuchu').ok;
  if (!e.equipo.anuncio) publicarAnuncio(e, puesto, Math.round(mediaSueldo(e, puesto, { operario: 'operario', vendedor: 'junior', disenador: 'textil', rrhh: 'rrhh', costurero: 'operario', bordador: 'operario' }[puesto]) / 1000) * 1000);
  return false;
}

function contratarSiHaceFalta(e, horasNecesarias) {
  if (e.semana <= 8) return;
  // Un buen jugador achica cuando el mes cerró en rojo
  const propios = e.equipo.empleados.filter((x) => !x.esLelo);
  if (e.mesesEnRojo > 0 && propios.length > 1) { despedir(e, propios[propios.length - 1].id); return; }
  if (e.plata < 100000) return;
  // ...y no contrata más de lo que puede pagar: sueldos hasta el 40% de lo que vende
  const ing = (e._ing || []).slice(-4);
  const venta = ing.length ? ing.reduce((a, b) => a + b, 0) / ing.length : 0;
  const nomina = e.equipo.empleados.reduce((t, x) => t + (x.sueldo || 0), 0);
  const tope = venta * 0.4 - nomina < (e.equipo.mercado || 1) * 40000 && e.plata < nomina * 8;
  for (const emp of e.equipo.empleados) if (emp.pideAumento) responderAumento(e, emp.id, true);
  if (horasNecesarias <= 26 || tope) return;
  if (empleadosContratados(e) >= cupoEquipo(e)) {
    const sig = localesDisponibles(e).find((id) => LOCALES[id].cupo > cupoEquipo(e) && (!LOCALES[id].localesMin || (e.pais?.locales.length || 0) >= LOCALES[id].localesMin));
    if (sig && e.plata > RESERVA / 2 + LOCALES[sig].alquiler * 2 && venta * 4 * 0.2 >= LOCALES[sig].alquiler) alquilarLocal(e, sig); else return;
  }
  const n = (p) => e.equipo.empleados.filter((x) => x.puesto === p && !x.esLelo).length;
  let puesto = n('operario') <= n('vendedor') ? 'operario' : 'vendedor';
  if (e.maquinas.plancha30 && !e.equipo.empleados.some((x) => x.puesto === 'disenador') && enProvincia(e)) puesto = 'disenador';
  if (n('vendedor') >= 2 && puesto === 'vendedor') puesto = 'operario';
  if (enPais(e) && n('operario') > 14 && !e.equipo.empleados.some((x) => x.puesto === 'rrhh')) puesto = 'rrhh';
  // En el país hace falta mucha gente: además del anuncio y Chuchu, va a la bolsa
  if (enPais(e)) {
    if (!fuisteALaBolsa(e)) irALaBolsa(e);
    if (fuisteALaBolsa(e)) {
      for (let i = e.equipo.bolsa.candidatos.length - 1; i >= 0; i--) {
        const c = e.equipo.bolsa.candidatos[i];
        if (c.puesto === 'operario' && empleadosContratados(e) < cupoEquipo(e)) contratar(e, 'bolsa', i);
      }
    }
  }
  contratar1(e, puesto);
}

export function planRazonable(e, eventos) {
  manejarTaller(e);
  manejarPais(e, eventos);
  const pais = enPais(e);
  const ids = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  const demanda = (id) => (pais ? e.pais.locales.reduce((t, l) => t + demandaLocal(e, l, id), 0) : demandaEsperada(e, id));
  const totalEsperado = ids.reduce((s, id) => s + demanda(id), 0);
  const redesNecesarias = pais ? 20 : totalEsperado * 1.2 * horasPorVenta(e);
  const emp = unidadesEmpresa(e);
  const prodNecesaria = ids.reduce((s, id) => s + (demanda(id) + emp[id] / 2) * horasPorUnidad(e, id), 0);
  const capacidad = capacidadEquipo(e).produccion;
  contratarSiHaceFalta(e, pais ? redesNecesarias + Math.max(0, prodNecesaria - capacidad) + 30 : redesNecesarias + prodNecesaria);
  const vendedor = presentes(e, 'vendedor')[0];
  const plan = { horasRedes: 0, feria: !pais && stockTotal(e) >= 2, curso: null, decision: { tintura: 'limpia', propaganda: 'desmiente', roboEmpleado: 'iguala', gripe: 'descansa' }, transporte: 'flete' };
  if (!eventos) Object.assign(plan.decision, { diez: 'nada', comedor: 'no', maraton: 'no', streamer: 'no', tele: 'no' });
  if (plan.feria && vendedor && horasEmpleado(e, vendedor, {}) >= 8) plan.feriaVendedor = vendedor.id;
  const horasVend = presentes(e, 'vendedor').reduce((t, v) => t + horasEmpleado(e, v, { feriaVendedor: plan.feriaVendedor }), 0);
  plan.horasRedes = Math.max(0, Math.ceil(redesNecesarias - horasVend));
  if (e.curso.semanasRestantes === 0 && e.plata > 80000) {
    const c = e.formacion.cursos;
    plan.curso = ['redes', 'sublimacion', 'ventas'].sort((a, b) => c[a] - c[b])[0];
  }
  for (let i = 0; i < 80 && !validarPublicidad(e, plan).ok; i++) {
    if (plan.curso) plan.curso = null; else if (plan.feria) { plan.feria = false; plan.feriaVendedor = null; } else plan.horasRedes = Math.max(0, plan.horasRedes - 1);
  }
  plan.producir = (sem) => {
    for (const p of e.pedidosEmpresa) if (p.estado === 'oferta') responderPedidoEmpresa(e, p.id, e.plata >= Object.entries(p.items).reduce((t, [id, n]) => t + PRODUCTOS[id].precio * n, 0) + colchon(e));
    const pedidas = unidadesPedidas(sem);
    const empresa = unidadesEmpresa(e);
    const producir = {};
    for (const id of ids) {
      const extra = PRODUCTOS[id].soloPedido || pais ? 0 : 2;
      const combos = id === 'combo' && e.licitacion.contrato ? e.licitacion.contrato.combos : 0;
      const margen = pedidas[id] ? (pais ? Math.ceil(pedidas[id] * 0.05) : 1) : 0;
      producir[id] = Math.max(0, pedidas[id] + empresa[id] + combos + margen + extra - e.stock[id]);
    }
    const p2 = { producir };
    if (pais && !validarPlan(e, p2).ok) {
      // Lo que no entra en las horas se terceriza (primero baja la producción hasta que entre)
      for (let i = 0; i < 3000 && !validarPlan(e, p2).ok; i++) {
        const id = ids.filter((x) => p2.producir[x] > 0 && !PRODUCTOS[x].soloPedido).sort((a, b) => p2.producir[b] - p2.producir[a])[0] || ids.find((x) => p2.producir[x] > 0);
        if (!id) break;
        p2.producir[id] = Math.max(0, p2.producir[id] - Math.max(1, Math.ceil(p2.producir[id] * 0.05)));
      }
      if (e.plata > 0) tercerizarResto(e, p2.producir);
    }
    for (let i = 0; i < 400 && !validarPlan(e, p2).ok; i++) {
      const terc = e.mejorDeLaCiudad && e.plata > 0 && sem.pedidos.find((x) => !x.rechazado && !x.tercerizado && p2.producir[x.producto] > 0);
      if (terc) { tercerizarPedido(e, terc.id, true); p2.producir[terc.producto] = Math.max(0, p2.producir[terc.producto] - terc.cantidad); continue; }
      const id = ids.find((x) => p2.producir[x] > 0 && !PRODUCTOS[x].soloPedido && p2.producir[x] > pedidas[x] + empresa[x] - e.stock[x]) || ids.find((x) => p2.producir[x] > 0);
      if (id) p2.producir[id]--;
      else {
        const conServicio = sem.pedidos.find((x) => !x.rechazado && (x.envio || x.diseno));
        if (conServicio) conServicio.rechazado = true; else break;
      }
    }
    for (const p of e.pedidosEmpresa) {
      if (p.estado !== 'aceptado' || p.tercerizar || e.semana < p.vence) continue;
      const llega = Object.entries(p.items).every(([id, n]) => e.stock[id] + (p2.producir[id] || 0) >= n);
      if (!llega) tercerizarPedidoEmpresa(e, p.id, true);
    }
    return p2.producir;
  };
  return plan;
}

// Juega una semana como buen jugador y anota lo que vendió (lo usa para decidir cuánta gente puede pagar)
export function semanaBuenJugador(e, eventos = true) {
  const res = jugarSemana(e, planRazonable(e, eventos));
  if (res.ok) (e._ing ||= []).push(res.resumen.ingresos || 0);
  return res;
}
