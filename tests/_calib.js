// Calibración de la economía: el buen jugador (tests/bot.js) juega ciudad, provincia y país.
// Muestra quiebras por etapa, cuántos ganan la provincia de primera, semanas por etapa, ganancia semanal y cuándo compra cada máquina.
// Uso: N=48 node tests/_calib.js
import { nuevaPartida, enProvincia, enPais } from '../js/engine.js';
import { semanaBuenJugador, PROVS } from './bot.js';

const prom = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const N = +process.env.N || 30;
const r = { ciudad: [], prov: [], pais: [], quiebraEn: { ciudad: 0, provincia: 0, pais: 0 }, provSem: [], ganaProvPrimera: 0, llegaProv: 0, llegaPais: 0, ganaPais: 0, paisSem: [], compras: {} };
const pq = (xs, p) => { const y = [...xs].sort((a, b) => a - b); return y.length ? y[Math.floor(p * (y.length - 1))] : NaN; };
for (let semilla = 1; semilla <= N; semilla++) {
  const e = nuevaPartida('A', semilla, { provincia: PROVS[semilla % PROVS.length], municipio: 'Prueba' });
  let provIni = null, perdioProv = false, paisIni = null;
  for (let s = 1; s <= 330 && !e.fin; s++) {
    const etapa = enPais(e) ? 'pais' : enProvincia(e) ? 'prov' : 'ciudad';
    const a = { plata: e.plata, maq: Object.keys(e.maquinas).filter((m) => e.maquinas[m]).length, loc: e.pais?.locales.length || 0, lugar: e.local, pag: e.prestamo?.pagado, deuda: e.prestamo?.deuda };
    const res = semanaBuenJugador(e, true);
    if (!res.ok) break;
    const h = res.resumen.hito;
    if (enProvincia(e) && provIni === null) { provIni = e.semana; r.llegaProv++; }
    if (h === 'perdisteProvincia') { perdioProv = true; if (process.env.DBG) console.log('P', semilla, e.semana - provIni); }
    if (h === 'mejorDeLaProvincia') { if (!perdioProv) { r.ganaProvPrimera++; r.provSem.push(e.semana - provIni); } paisIni = e.semana; r.llegaPais++; }
    if (h === 'mejorDelPais') { r.ganaPais++; r.paisSem.push(e.semana - paisIni); break; }
    if (h === 'perdistePais') break;
    const maq = Object.keys(e.maquinas).filter((m) => e.maquinas[m]);
    if (maq.length > a.maq) { const n = maq[maq.length - 1]; (r.compras[n] ||= []).push(e.semana - (n === 'costura' || n === 'bordado' ? paisIni : n === 'gorras' ? 0 : provIni || 0)); }
    const limpia = maq.length === a.maq && (e.pais?.locales.length || 0) === a.loc && e.local === a.lugar && e.prestamo?.pagado === a.pag && e.prestamo?.deuda === a.deuda && !h;
    if (limpia && e.semana > 8) r[etapa].push(e.plata - a.plata);
  }
  if (e.fin === 'quiebra') { r.quiebraEn[e.meta]++; if (process.env.DBG) console.log('Q', semilla, e.meta, 'sem', e.semana, 'local', e.local, 'maq', Object.keys(e.maquinas).filter((m) => e.maquinas[m]).join(','), 'emp', e.empleados?.length, 'rep', e.reputacion, 'prest', JSON.stringify(e.prestamo), 'ev', (e.eventos || []).slice(-4).map((x) => x.texto || x).join(' / ').slice(0, 300)); }
}
const f = (x) => (Math.round(x / 1000) + 'k');
console.log(`N=${N} | quiebras ciudad ${r.quiebraEn.ciudad} prov ${r.quiebraEn.provincia} pais ${r.quiebraEn.pais}`);
console.log(`provincia: llegan ${r.llegaProv}, ganan de primera ${r.ganaProvPrimera} (${Math.round(100 * r.ganaProvPrimera / r.llegaProv)}%) en ${Math.round(prom(r.provSem))} sem | país: llegan ${r.llegaPais}, ganan ${r.ganaPais} en ${Math.round(prom(r.paisSem))} sem`);
for (const k of ['ciudad', 'prov', 'pais']) console.log(`${k}: ganancia/sem p50 ${f(pq(r[k], .5))} p75 ${f(pq(r[k], .75))} prom ${f(prom(r[k]))}`);
console.log('compras (semanas desde el inicio de la etapa):', Object.entries(r.compras).map(([k, v]) => `${k} ${Math.round(prom(v))} (${v.length})`).join(' | '));
