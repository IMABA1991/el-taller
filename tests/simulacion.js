// Simulación de balance: un "jugador razonable" juega muchas partidas automáticas
// y se comparan los resultados con lo que dice el documento de reglas.
// Uso: node tests/simulacion.js
import {
  nuevaPartida, jugarSemana, demandaEsperada, horasPorUnidad, horasPorVenta, validarPlan, validarPublicidad,
  comprarMaquina, pagarPrestamoA, costoPagoAnticipadoA, calendario, unidadesPedidas, horasDelPlan, PRODUCTOS, VENTAS,
} from '../js/engine.js';

// Un jugador razonable: publicidad para cubrir lo que pide el mercado, después produce
// lo que le pidieron (+1 por si se arruina alguna) y unas de más para la feria.
function planRazonable(e) {
  const ids = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  const totalEsperado = ids.reduce((s, id) => s + demandaEsperada(e, id), 0);
  const plan = { horasRedes: Math.ceil(totalEsperado * 1.2 * horasPorVenta(e)), feria: true, curso: false };
  if (e.semana >= 7 && e.curso.semanasRestantes === 0 && e.formacion.actualizacion < 10 && e.plata > 60000) plan.curso = true;
  plan.producir = (sem) => {
    const pedidas = unidadesPedidas(sem);
    const producir = {};
    for (const id of ids) producir[id] = Math.max(0, pedidas[id] + (pedidas[id] ? 1 : 0) + 2 - e.stock[id]);
    const p2 = { producir, feria: plan.feria, curso: plan.curso };
    for (let i = 0; i < 300 && !validarPlan(e, p2).ok; i++) {
      const id = ids.find((x) => p2.producir[x] > pedidas[x] - e.stock[x] && p2.producir[x] > 0) || ids.find((x) => p2.producir[x] > 0);
      if (p2.curso) p2.curso = false;
      else if (p2.feria) p2.feria = false;
      else if (id) p2.producir[id]--;
      else break;
    }
    plan.feria = p2.feria; plan.curso = p2.curso;
    return p2.producir;
  };
  return plan;
}

function jugarPartida(opcion, semilla, semanas = 104) {
  const e = nuevaPartida(opcion, semilla);
  const registro = { tutorial: 0, semanaGorras: null, semanaMejorCiudad: null, semanaPagoA: null, quiebra: false, meses: [] };
  for (let s = 1; s <= semanas && !e.fin; s++) {
    if (!e.maquinas.gorras && e.semana > 8 && e.plata > 150000 + 60000) {
      comprarMaquina(e, 'gorras');
      registro.semanaGorras = e.semana;
    }
    if (opcion === 'A' && !e.prestamo.pagado && e.plata > costoPagoAnticipadoA(e.semana) + 80000) {
      if (pagarPrestamoA(e).ok) registro.semanaPagoA = e.semana;
    }
    const plataAntes = e.plata;
    const res = jugarSemana(e, planRazonable(e));
    if (!res.ok) throw new Error(`Plan inválido en semana ${e.semana}: ${res.errores.join(' ')}`);
    if (res.resumen.semana <= 8) registro.tutorial += 0; // se mide por meses abajo
    if (res.resumen.gananciaMes !== undefined) registro.meses.push(res.resumen.gananciaMes);
    if (Number.isNaN(e.plata) || Number.isNaN(e.rep)) throw new Error('Apareció un NaN');
    if (res.resumen.hito === 'mejorDeLaCiudad') registro.semanaMejorCiudad = res.resumen.semana;
    void plataAntes;
  }
  registro.quiebra = e.fin === 'quiebra';
  registro.final = { plata: e.plata, rep: e.rep, exp: e.exp, primo: e.primo.rep, prestamo: e.prestamo, confianza: e.tio.confianza };
  return registro;
}

const promedio = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const fmt = (n) => Math.round(n).toLocaleString('es-AR');

let fallas = 0;
const chequear = (cond, texto) => { console.log(`${cond ? 'OK  ' : 'FALLA'} ${texto}`); if (!cond) fallas++; };

for (const opcion of ['A', 'B']) {
  const partidas = Array.from({ length: 200 }, (_, i) => jugarPartida(opcion, 1000 + i));
  // Ganancia de enero y febrero (sin contar cuota en A): meses[0], meses[1]
  const tutorialMes = promedio(partidas.map((p) => promedio(p.meses.slice(0, 2))));
  const ciudad = partidas.map((p) => p.semanaMejorCiudad).filter(Boolean);
  const gorras = partidas.map((p) => p.semanaGorras).filter(Boolean);
  const quiebras = partidas.filter((p) => p.quiebra).length;
  console.log(`\n=== Opción ${opcion} (200 partidas) ===`);
  console.log(`Resultado neto por mes en el tutorial: $${fmt(tutorialMes)} (después de gastos fijos${opcion === 'B' ? ' y cuota' : ''})`);
  console.log(`Compra de la máquina de gorras: semana ${fmt(promedio(gorras))} en promedio (${gorras.length}/200 partidas)`);
  console.log(`Mejor de la ciudad: semana ${fmt(promedio(ciudad))} en promedio (${ciudad.length}/200 partidas)`);
  if (opcion === 'A') {
    const pagos = partidas.map((p) => p.semanaPagoA).filter(Boolean);
    console.log(`Pago anticipado al tío: semana ${fmt(promedio(pagos))} (${pagos.length}/200)`);
  } else {
    console.log(`Préstamo B saldado: ${partidas.filter((p) => p.final.prestamo.pagado).length}/200`);
  }
  console.log(`Quiebras: ${quiebras}/200. Plata final (2 años): $${fmt(promedio(partidas.map((p) => p.final.plata)))}. Primo: ${promedio(partidas.map((p) => p.final.primo)).toFixed(1)}`);

  chequear(quiebras === 0, `Opción ${opcion}: un jugador razonable no quiebra`);
  chequear(ciudad.length >= 180, `Opción ${opcion}: casi siempre llega a ser el mejor de la ciudad en 2 años`);
  chequear(promedio(ciudad) >= 18 && promedio(ciudad) <= 45, `Opción ${opcion}: ser el mejor de la ciudad lleva entre 18 y 45 semanas (objetivo ~26)`);
  chequear(promedio(gorras) <= 24, `Opción ${opcion}: la máquina de gorras llega antes de mitad de año`);
}

// Chequeos puntuales del calendario y del préstamo
chequear(calendario(8).finDeMes && calendario(8).nombreMes === 'Febrero', 'La semana 8 cierra febrero (fin del tutorial)');
chequear(calendario(52).nombreMes === 'Diciembre' && calendario(53).nombreMes === 'Enero', 'El año tiene 52 semanas');
chequear(costoPagoAnticipadoA(26) === 220000, 'Pago anticipado en la semana 26 = $220.000');
chequear(VENTAS.feria.costoMesa === 10000, 'La mesa de la feria cuesta $10.000');
chequear(Math.abs(horasPorUnidad({ exp: 35 }, 'tazaCeramica') - 0.44) < 0.01, 'Con 35 de experiencia una taza lleva ~26 minutos');

const b = nuevaPartida('B', 7);
let pagadoB = 0;
for (let s = 0; s < 8; s++) { const antes = b.plata; jugarSemana(b, { producir: {}, horasRedes: 0, feria: false }); void antes; }
pagadoB = b.prestamo.cuotasPagadas;
chequear(b.prestamo.cuotasPerdonadas === 1, 'Opción B: se perdona la cuota de febrero');
void pagadoB;

// Rumores de Lelo: siempre avisan una campaña agresiva, y a veces son falsa alarma.
let conRumor = 0; let rumorCierto = 0; let agresivas = 0; let agresivasAvisadas = 0;
for (let i = 0; i < 100; i++) {
  const e = nuevaPartida('A', 5000 + i);
  for (let s = 0; s < 30; s++) {
    const rumor = Boolean(e.primo.rumor);
    if (e.fin) break;
    const res = jugarSemana(e, { producir: {}, horasRedes: 0, feria: false });
    if (!res.ok) throw new Error(res.errores.join(' '));
    if (e.semana - 1 < 4) continue;
    if (rumor) { conRumor++; if (e.primo.comportamiento === 'agresivo') rumorCierto++; }
    if (e.primo.comportamiento === 'agresivo') { agresivas++; if (rumor) agresivasAvisadas++; }
  }
}
console.log(`\nRumores: ${conRumor}, se cumplieron ${(100 * rumorCierto / conRumor).toFixed(0)}%. Campañas agresivas avisadas: ${agresivasAvisadas}/${agresivas}.`);
chequear(agresivasAvisadas === agresivas, 'Toda campaña agresiva de Lelo se avisa con un rumor una semana antes');
chequear(rumorCierto / conRumor > 0.5 && rumorCierto / conRumor < 0.75, 'Los rumores se cumplen a veces (entre 50% y 75%)');

// Promo de contraataque: conviene si Lelo ataca, pierde plata si era humo; en promedio, cerca de neutra.
const difs = { agresivo: [], humo: [] };
for (let i = 0; i < 150; i++) {
  const e = nuevaPartida('A', 9000 + i);
  for (let s = 0; s < 40 && !e.fin; s++) {
    const plan = planRazonable(e);
    if (e.primo.rumor && e.semana >= 4 && !e.mejorDeLaCiudad) {
      const con = JSON.parse(JSON.stringify(e));
      const sin = JSON.parse(JSON.stringify(e));
      const base = planRazonable(con);
      const planPromo = { ...base, horasRedes: Math.ceil(base.horasRedes * 1.2), promo: true };
      if (validarPublicidad(con, planPromo).ok) {
        jugarSemana(con, planPromo);
        jugarSemana(sin, planRazonable(sin));
        const valor = (x) => x.plata + x.rep * 2000; // la reputación también vale
        (con.primo.comportamiento === 'agresivo' ? difs.agresivo : difs.humo).push(valor(con) - valor(sin));
      }
    }
    jugarSemana(e, plan);
  }
}
const pa = promedio(difs.agresivo); const ph = promedio(difs.humo);
const total = promedio([...difs.agresivo, ...difs.humo]);
console.log(`\nPromo: si Lelo ataca, ${pa >= 0 ? '+' : ''}$${fmt(pa)}; si era humo, ${ph >= 0 ? '+' : ''}$${fmt(ph)}; promedio ${total >= 0 ? '+' : ''}$${fmt(total)} (${difs.agresivo.length + difs.humo.length} casos).`);
chequear(pa > 0, 'La promo conviene cuando Lelo ataca');
chequear(ph < pa, 'La promo rinde menos cuando el rumor era humo');

console.log(fallas ? `\n${fallas} chequeo(s) fallaron.` : '\nTodos los chequeos pasaron.');
process.exit(fallas ? 1 : 0);
