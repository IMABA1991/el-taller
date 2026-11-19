// Simulación de la provincia: un "jugador razonable" juega hasta 3 años y se mide
// cuántas veces le gana a Traicio Nero y en cuántas semanas.
// Uso: node tests/provincia.js
import { nuevaPartida, empleadosContratados, enProvincia, MAQUINAS } from '../js/engine.js';
import { semanaBuenJugador } from './bot.js';

function jugar(opcion, semilla, semanas = 156) {
  const e = nuevaPartida(opcion, semilla);
  const reg = { ciudad: null, provinciaInicio: null, gano: null, perdio: null, maquinas: {}, quiebra: false, trayecto: [] };
  for (let s = 1; s <= semanas && !e.fin; s++) {
    const res = semanaBuenJugador(e, true);
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
  if (process.env.DBG && reg.quiebra) console.log('Q', opcion, semilla, e.semana, e.meta, e.local, reg.perdio, Object.keys(e.maquinas).filter((m) => e.maquinas[m]).join(','), e.equipo.empleados.length, JSON.stringify(e.prestamo));
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
