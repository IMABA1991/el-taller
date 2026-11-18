// Simulación del país: un "jugador razonable" juega la ciudad y la provincia (como en tests/provincia.js)
// y después pelea el país contra Topa. Se juega dos veces cada partida: aprovechando los eventos de marca
// y dejándolos pasar. Lo que se busca:
//   - aprovechando los eventos, el país se gana en 1,5 a 2 años;
//   - sin aprovecharlos, se tarda unos 3 años y Topa (que llega a 100 a los 2 años y medio) gana.
// Uso: node tests/pais.js   (N=40 por defecto)
import {
  nuevaPartida, jugarSemana, demandaEsperada, horasPorUnidad, horasPorVenta, validarPlan, validarPublicidad,
  comprarMaquina, pagarPrestamoA, costoPagoAnticipadoA, unidadesPedidas, stockTotal, PRODUCTOS, MAQUINAS,
  presentes, empleadosContratados, cupoEquipo, llamarAChuchu, chuchuDisponible, contratar, publicarAnuncio, responderAumento,
  horasEmpleado, enProvincia, enPais, unidadesEmpresa, responderPedidoEmpresa, tercerizarPedidoEmpresa, tercerizarPedido,
  ofertarLicitacion, cambiarDefensa, contratarSeguridad, alquilarLocal, localesDisponibles, prestamoDisponible, pedirPrestamo,
  proximaMaquina, irALaBolsa, fuisteALaBolsa, LOCALES, ponerNombreTaller, abrirLocal, provinciasLibres, costoAbrirLocal,
  asignarLelo, cambiarDefensaPais, ofertaPaisVigente, tomarOfertaPais, demandaLocal, tercerizarResto, puedeOfertarLicitacion,
  capacidadEquipo, LICITACION_SEGUNDA, PROVINCIAS_AR,
} from '../js/engine.js';

const RESERVA = 300000;
const PROVS = Object.keys(PROVINCIAS_AR);

function manejarTaller(e) {
  const prox = proximaMaquina(e);
  if (prox?.disponible && e.semana > 8 && !MAQUINAS[prox.id].desdePais) {
    const d = prestamoDisponible(e);
    if (d.ok && e.plata + d.tope >= prox.precio + RESERVA && e.plata < prox.precio + RESERVA) pedirPrestamo(e, 'A', d.tope);
    if (e.plata >= prox.precio + RESERVA) comprarMaquina(e, prox.id);
  }
  if (e.prestamo.opcion === 'A' && !e.prestamo.pagado && e.plata > costoPagoAnticipadoA(e.semana, e.prestamo) + RESERVA) pagarPrestamoA(e);
  if (enProvincia(e)) {
    if (!e.defensas.proteccion) cambiarDefensa(e, 'proteccion', true);
    if (!e.defensas.seguro) cambiarDefensa(e, 'seguro', true);
    if (!e.seguridad && e.plata > RESERVA) contratarSeguridad(e);
  }
  for (const p of e.pedidosEmpresa) {
    if (p.estado === 'oferta') responderPedidoEmpresa(e, p.id, true);
    const sinMaquina = Object.keys(p.items).some((id) => !e.maquinas[PRODUCTOS[id].maquina]);
    if (p.estado === 'aceptado' && sinMaquina) tercerizarPedidoEmpresa(e, p.id, true);
  }
  const a = e.licitacion.abierta;
  if (a?.semana === e.semana && puedeOfertarLicitacion(e).ok && !a.grande) ofertarLicitacion(e, a.tipo === 'segunda' ? Math.round(a.precioRef * 0.93) : 90000);
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
    if (e.plata < c.total * 1.6 + 3_000_000) continue;
    abrirLocal(e, prov, e.plata > c.total * 3 ? 'senior' : 'junior');
    break;
  }
  // Mudanza cuando no entra más gente
  if (empleadosContratados(e) >= cupoEquipo(e)) {
    const sig = localesDisponibles(e).find((id) => LOCALES[id].cupo > cupoEquipo(e) && (!LOCALES[id].localesMin || e.pais.locales.length >= LOCALES[id].localesMin));
    if (sig && e.plata > LOCALES[sig].alquiler * 4) alquilarLocal(e, sig);
  }
}

function contratar1(e, puesto) {
  if (empleadosContratados(e) >= cupoEquipo(e)) return false;
  if (e.equipo.anuncio?.candidato?.puesto === puesto) return contratar(e, 'anuncio').ok;
  if (chuchuDisponible(e) && llamarAChuchu(e, puesto).ok && e.equipo.chuchu.candidato) return contratar(e, 'chuchu').ok;
  if (!e.equipo.anuncio) publicarAnuncio(e, puesto, puesto === 'operario' ? 40000 : puesto === 'vendedor' ? 30000 : puesto === 'rrhh' ? 320000 : 60000);
  return false;
}

function contratarSiHaceFalta(e, horasNecesarias) {
  if (e.semana <= 8 || e.plata < 100000) return;
  for (const emp of e.equipo.empleados) if (emp.pideAumento) responderAumento(e, emp.id, true);
  if (horasNecesarias <= 26) return;
  if (empleadosContratados(e) >= cupoEquipo(e)) {
    const sig = localesDisponibles(e).find((id) => LOCALES[id].cupo > cupoEquipo(e) && (!LOCALES[id].localesMin || (e.pais?.locales.length || 0) >= LOCALES[id].localesMin));
    if (sig && e.plata > RESERVA + LOCALES[sig].alquiler * 3) alquilarLocal(e, sig); else return;
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

function planRazonable(e, eventos) {
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
    for (const p of e.pedidosEmpresa) if (p.estado === 'oferta') responderPedidoEmpresa(e, p.id, true);
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

function jugar(semilla, eventos, semanasMax = 400) {
  const e = nuevaPartida('A', semilla, { provincia: PROVS[semilla % PROVS.length], municipio: 'Prueba' });
  const reg = { paisInicio: null, gano: null, perdio: null, quiebra: false, locales: [], trayecto: [], plataInicio: null };
  for (let s = 1; s <= semanasMax && !e.fin; s++) {
    const res = jugarSemana(e, planRazonable(e, eventos));
    if (!res.ok) throw new Error(`Semana ${e.semana}: ${res.errores.join(' ')}`);
    const h = res.resumen.hito;
    if (h === 'mejorDeLaProvincia') { reg.paisInicio = res.resumen.semana; reg.plataInicio = e.plata; }
    if (h === 'mejorDelPais') { reg.gano = res.resumen.semana; break; }
    if (h === 'perdistePais') { reg.perdio = res.resumen.semana; break; }
    if (Number.isNaN(e.plata) || Number.isNaN(e.rep)) throw new Error(`NaN en la semana ${e.semana}`);
    if (enPais(e) && s % 13 === 0) reg.trayecto.push([e.semana - reg.paisInicio, Math.round(e.rep), e.pais.locales.length, Math.round(e.plata / 1e6), empleadosContratados(e)]);
  }
  reg.quiebra = e.fin === 'quiebra';
  reg.final = { plata: e.plata, locales: e.pais?.locales.length || 0, empleados: empleadosContratados(e), rep: e.rep };
  return reg;
}

const prom = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const N = Number(process.env.N || 40);
let fallas = 0;
const chequear = (c, t) => { console.log(`${c ? 'OK  ' : 'FALLA'} ${t}`); if (!c) fallas++; };
const resultados = {};
for (const eventos of [true, false]) {
  const ps = Array.from({ length: N }, (_, i) => jugar(3000 + i, eventos));
  const llegan = ps.filter((p) => p.paisInicio);
  const ganan = llegan.filter((p) => p.gano);
  const durac = ganan.map((p) => p.gano - p.paisInicio);
  resultados[eventos] = { llegan: llegan.length, ganan: ganan.length, durac: prom(durac) };
  console.log(`\n=== ${eventos ? 'Aprovechando' : 'Sin aprovechar'} los eventos de marca (${N} partidas) ===`);
  console.log(`Llegan al país: ${llegan.length}. Ganan el país: ${ganan.length}. Pierden con Topa: ${llegan.filter((p) => p.perdio).length}. Quiebras: ${ps.filter((p) => p.quiebra).length}.`);
  if (durac.length) console.log(`Semanas para ganar el país: ${prom(durac).toFixed(0)} (mín ${Math.min(...durac)}, máx ${Math.max(...durac)}).`);
  console.log(`Plata al llegar al país: $${(prom(llegan.map((p) => p.plataInicio)) / 1e6).toFixed(1)} M. Locales al final: ${prom(llegan.map((p) => p.final.locales)).toFixed(1)}. Empleados: ${prom(llegan.map((p) => p.final.empleados)).toFixed(1)}. Reputación final: ${prom(llegan.map((p) => p.final.rep)).toFixed(1)}.`);
  console.log('Ejemplo (semanas en el país, reputación, locales, plata en M, empleados):', JSON.stringify(llegan[0]?.trayecto));
  chequear(ps.every((p) => !p.quiebra), `${eventos ? 'Con' : 'Sin'} eventos: nadie quiebra`);
}
const conEv = resultados.true;
const sinEv = resultados.false;
chequear(conEv.ganan / conEv.llegan >= 0.7, 'Aprovechando los eventos, al menos 7 de cada 10 ganan el país');
chequear(conEv.durac >= 78 && conEv.durac <= 110, 'Aprovechando los eventos, el país lleva entre 1,5 y 2 años (78-110 semanas)');
chequear(sinEv.ganan / sinEv.llegan <= 0.35, 'Sin aprovecharlos, Topa gana la mayoría de las veces');
console.log(fallas ? `\n${fallas} chequeo(s) fallaron.` : '\nTodos los chequeos pasaron.');
process.exit(fallas ? 1 : 0);
