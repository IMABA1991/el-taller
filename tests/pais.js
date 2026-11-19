// Simulación del país: un "jugador razonable" juega la ciudad y la provincia (como en tests/provincia.js)
// y después pelea el país contra Topa. Se juega dos veces cada partida: aprovechando los eventos de marca
// y dejándolos pasar. Lo que se busca:
//   - aprovechando los eventos, el país se gana en 1,5 a 2 años;
//   - sin aprovecharlos, se tarda unos 3 años y Topa (que llega a 100 a los 2 años y medio) gana.
// Uso: node tests/pais.js   (N=40 por defecto)
import { nuevaPartida, empleadosContratados, enPais } from '../js/engine.js';
import { semanaBuenJugador, PROVS } from './bot.js';

function jugar(semilla, eventos, semanasMax = 400) {
  const e = nuevaPartida('A', semilla, { provincia: PROVS[semilla % PROVS.length], municipio: 'Prueba' });
  const reg = { paisInicio: null, gano: null, perdio: null, quiebra: false, locales: [], trayecto: [], plataInicio: null };
  for (let s = 1; s <= semanasMax && !e.fin; s++) {
    const res = semanaBuenJugador(e, eventos);
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
