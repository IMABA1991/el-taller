// Simulación de la provincia: un "jugador razonable" juega hasta 3 años y se mide
// cuántas veces le gana a Traicio Nero y en cuántas semanas.
// Uso: node tests/provincia.js
import {
  nuevaPartida, jugarSemana, demandaEsperada, horasPorUnidad, horasPorVenta, validarPlan, validarPublicidad,
  comprarMaquina, pagarPrestamoA, costoPagoAnticipadoA, unidadesPedidas, stockTotal, PRODUCTOS, MAQUINAS,
  presentes, empleadosContratados, cupoEquipo, llamarAChuchu, chuchuDisponible, contratar, publicarAnuncio, responderAumento,
  horasEmpleado, enProvincia, unidadesEmpresa, responderPedidoEmpresa, tercerizarPedidoEmpresa, tercerizarPedido,
  ofertarLicitacion, cambiarDefensa, contratarSeguridad, alquilarLocal, localesDisponibles, prestamoDisponible, pedirPrestamo,
  proximaMaquina, irALaBolsa, LOCALES,
} from '../js/engine.js';

const RESERVA = 300000;

function manejarTaller(e) {
  // Máquinas: con plata propia o con el préstamo del tío
  const prox = proximaMaquina(e);
  if (prox?.disponible && e.semana > 8) {
    const d = prestamoDisponible(e);
    if (d.ok && e.plata + d.tope >= prox.precio + RESERVA && e.plata < prox.precio + RESERVA) pedirPrestamo(e, 'A', d.tope);
    if (e.plata >= prox.precio + RESERVA) comprarMaquina(e, prox.id);
  }
  if (e.prestamo.opcion === 'A' && !e.prestamo.pagado && e.plata > costoPagoAnticipadoA(e.semana, e.prestamo) + RESERVA) pagarPrestamoA(e);
  if (!enProvincia(e)) return;
  // Defensas
  if (!e.defensas.proteccion) cambiarDefensa(e, 'proteccion', true);
  if (!e.defensas.seguro) cambiarDefensa(e, 'seguro', true);
  if (!e.seguridad && e.plata > RESERVA) contratarSeguridad(e);
  // Empresas: acepta todo; terceriza si le falta la máquina o si vence y no llega
  for (const p of e.pedidosEmpresa) {
    if (p.estado === 'oferta') responderPedidoEmpresa(e, p.id, true);
    const sinMaquina = Object.keys(p.items).some((id) => !e.maquinas[PRODUCTOS[id].maquina]);
    if (p.estado === 'aceptado' && sinMaquina) tercerizarPedidoEmpresa(e, p.id, true);
  }
  // Licitaciones
  if (e.licitacion.abierta?.semana === e.semana && e.maquinas.calandra && !e.licitacion.contrato) ofertarLicitacion(e, 90000);
}

function contratarSiHaceFalta(e, horasNecesarias) {
  if (e.semana <= 8 || e.plata < 100000) return;
  for (const emp of e.equipo.empleados) if (emp.pideAumento) responderAumento(e, emp.id, true);
  if (horasNecesarias <= 26) return;
  if (empleadosContratados(e) >= cupoEquipo(e)) {
    const sig = localesDisponibles(e).find((id) => LOCALES[id].cupo > cupoEquipo(e));
    if (sig && e.plata > RESERVA + LOCALES[sig].alquiler * 3) alquilarLocal(e, sig); else return;
  }
  const n = (p) => e.equipo.empleados.filter((x) => x.puesto === p && !x.esLelo).length;
  let puesto = n('operario') <= n('vendedor') ? 'operario' : 'vendedor';
  if (enProvincia(e) && e.maquinas.plancha30 && !e.equipo.empleados.some((x) => x.puesto === 'disenador')) puesto = 'disenador';
  if (n('vendedor') >= 2 && puesto === 'vendedor') puesto = 'operario';
  if (e.equipo.anuncio?.candidato?.puesto === puesto) { contratar(e, 'anuncio'); return; }
  if (chuchuDisponible(e) && llamarAChuchu(e, puesto).ok && e.equipo.chuchu.candidato) { contratar(e, 'chuchu'); return; }
  if (!e.equipo.anuncio) publicarAnuncio(e, puesto, puesto === 'operario' ? 40000 : puesto === 'vendedor' ? 30000 : 60000);
}

function planRazonable(e) {
  manejarTaller(e);
  const ids = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  const totalEsperado = ids.reduce((s, id) => s + demandaEsperada(e, id), 0);
  const redesNecesarias = totalEsperado * 1.2 * horasPorVenta(e);
  const emp = unidadesEmpresa(e);
  const prodNecesaria = ids.reduce((s, id) => s + (demandaEsperada(e, id) + emp[id] / 2) * horasPorUnidad(e, id), 0);
  contratarSiHaceFalta(e, redesNecesarias + prodNecesaria);
  const vendedor = presentes(e, 'vendedor')[0];
  const plan = { horasRedes: 0, feria: stockTotal(e) >= 2, curso: null, decision: { tintura: 'limpia', propaganda: 'desmiente', roboEmpleado: 'iguala', gripe: 'descansa' } };
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
    // Lo que vence esta semana y no llega, se terceriza
    for (const p of e.pedidosEmpresa) if (p.estado === 'oferta') responderPedidoEmpresa(e, p.id, true);
    const pedidas = unidadesPedidas(sem);
    const empresa = unidadesEmpresa(e);
    const producir = {};
    for (const id of ids) {
      const extra = PRODUCTOS[id].soloPedido ? 0 : 2;
      const combos = id === 'combo' && e.licitacion.contrato ? e.licitacion.contrato.combos : 0;
      producir[id] = Math.max(0, pedidas[id] + empresa[id] + combos + (pedidas[id] ? 1 : 0) + extra - e.stock[id]);
    }
    const p2 = { producir };
    for (let i = 0; i < 400 && !validarPlan(e, p2).ok; i++) {
      // Primero terceriza pedidos de redes (si puede), después baja la producción
      const terc = e.mejorDeLaCiudad && sem.pedidos.find((x) => !x.rechazado && !x.tercerizado && p2.producir[x.producto] > 0);
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

function jugar(opcion, semilla, semanas = 156) {
  const e = nuevaPartida(opcion, semilla);
  const reg = { ciudad: null, provinciaInicio: null, gano: null, perdio: null, maquinas: {}, quiebra: false, trayecto: [] };
  for (let s = 1; s <= semanas && !e.fin; s++) {
    const res = jugarSemana(e, planRazonable(e));
    if (!res.ok) throw new Error(`Semana ${e.semana}: ${res.errores.join(' ')}`);
    const h = res.resumen.hito;
    for (const ev of res.resumen.eventos) {
      if (ev.texto.startsWith('Al vencer el plazo')) reg.licFallida = (reg.licFallida || 0) + 1;
      if (ev.texto.startsWith('No llegaste con el pedido')) reg.empFallida = (reg.empFallida || 0) + 1;
      if (ev.texto.startsWith('🗡️')) reg.sabotajes = (reg.sabotajes || 0) + 1;
      if (ev.texto.startsWith('🏆')) reg.licGanada = (reg.licGanada || 0) + 1;
    }
    if (h === 'mejorDeLaCiudad') { reg.ciudad = res.resumen.semana; reg.provinciaInicio = res.resumen.semana; }
    if (h === 'mejorDeLaProvincia') { reg.gano = res.resumen.semana; break; }
    if (h === 'perdisteProvincia' && !reg.perdio) reg.perdio = res.resumen.semana;
    for (const m of Object.keys(MAQUINAS)) if (e.maquinas[m] && !reg.maquinas[m]) reg.maquinas[m] = e.semana;
    if (Number.isNaN(e.plata) || Number.isNaN(e.rep)) throw new Error('NaN');
    if (enProvincia(e) && s % 8 === 0) reg.trayecto.push([e.semana, Math.round(e.rep), Math.round(e.traicio.rep)]);
  }
  reg.quiebra = e.fin === 'quiebra';
  reg.final = { plata: e.plata, empleados: empleadosContratados(e), local: e.local };
  return reg;
}

const prom = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const N = Number(process.env.N || 120);
let fallas = 0;
const chequear = (c, t) => { console.log(`${c ? 'OK  ' : 'FALLA'} ${t}`); if (!c) fallas++; };
const total = { llegan: 0, ganan: 0 };
for (const opcion of ['A', 'B']) {
  const ps = Array.from({ length: N }, (_, i) => jugar(opcion, 2000 + i));
  const conProv = ps.filter((p) => p.provinciaInicio);
  const ganadas = conProv.filter((p) => p.gano && !p.perdio);
  const ganadasTotal = conProv.filter((p) => p.gano);
  const perdidas = conProv.filter((p) => p.perdio);
  const durac = ganadas.map((p) => p.gano - p.provinciaInicio);
  console.log(`\n=== Opción ${opcion} (${N} partidas, hasta 3 años) ===`);
  console.log(`Llegan a la provincia: ${conProv.length}. Le ganan a Traicio de primera: ${ganadas.length} (${Math.round((100 * ganadas.length) / conProv.length)}%). Pierden al menos una vez: ${perdidas.length}. Ganan alguna vez: ${ganadasTotal.length}.`);
  console.log(`Semanas para ganar la provincia (de primera): ${prom(durac).toFixed(0)} (mín ${Math.min(...durac)}, máx ${Math.max(...durac)}).`);
  for (const m of ['plancha30', 'plancha1m', 'calandra']) {
    const xs = ps.map((p) => p.maquinas[m]).filter(Boolean);
    console.log(`  ${MAQUINAS[m].nombre}: ${xs.length}/${N}, semana ${prom(xs).toFixed(0)}`);
  }
  console.log(`Licitaciones ganadas ${prom(ps.map((p) => p.licGanada || 0)).toFixed(1)}, incumplidas ${prom(ps.map((p) => p.licFallida || 0)).toFixed(1)}; empresas incumplidas ${prom(ps.map((p) => p.empFallida || 0)).toFixed(1)}; sabotajes ${prom(ps.map((p) => p.sabotajes || 0)).toFixed(1)}.`);
  console.log(`Quiebras: ${ps.filter((p) => p.quiebra).length}. Empleados al final: ${prom(ps.map((p) => p.final.empleados)).toFixed(1)}.`);
  console.log('Ejemplo (semana, vos, Traicio):', JSON.stringify(ps[0].trayecto.slice(0, 10)));
  chequear(ps.every((p) => !p.quiebra), `Opción ${opcion}: nadie quiebra`);
  chequear(prom(durac) >= 45 && prom(durac) <= 65, `Opción ${opcion}: la provincia lleva entre 50 y 60 semanas (±5)`);
  total.llegan += conProv.length; total.ganan += ganadas.length;
}
const pct = total.ganan / total.llegan;
console.log(`\nEn total le ganan a Traicio de primera ${Math.round(pct * 100)}% de las veces.`);
chequear(pct >= 0.65 && pct <= 0.85, 'Un jugador razonable le gana a Traicio de primera entre 7 y 8 de cada 10 (±5)');
console.log(fallas ? `\n${fallas} chequeo(s) fallaron.` : '\nTodos los chequeos pasaron.');
process.exit(fallas ? 1 : 0);
