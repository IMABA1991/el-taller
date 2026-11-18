// Mapa del país: cada provincia se pinta según la reputación de tu local ahí.
// Los camiones viajan desde tu ciudad a los locales que tienen mercadería en camino.
import { MAPA } from './mapa-datos.js';
import { PROVINCIAS_AR } from './data.js';

// De gris (sin local) a durazno (reputación 0) y a verde (100).
function colorRep(rep) {
  const t = Math.max(0, Math.min(1, rep / 100));
  const a = [246, 201, 168];
  const b = [30, 138, 76];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c.join(',')})`;
}

export function mapaPais(e, { seleccion = null } = {}) {
  const locales = Object.fromEntries((e.pais?.locales || []).map((l) => [l.prov, l]));
  const origen = (e.pais?.locales || []).find((l) => l.origen)?.prov || e.origen?.provincia;
  const lelo = e.leloComercial && e.equipo.empleados.some((x) => x.esLelo) ? e.pais?.lelo?.local : null;
  const c = MAPA.centros;
  const provincias = Object.entries(MAPA.paths).filter(([id]) => id !== 'caba').map(([id, d]) => {
    const l = locales[id];
    const fill = l ? colorRep(l.rep) : '#e3e6ec';
    const sel = seleccion === id ? ' seleccionada' : '';
    return `<path d="${d}" fill="${fill}" class="prov${l ? ' con-local' : ''}${sel}" data-prov="${id}"><title>${PROVINCIAS_AR[id].nombre}${l ? ` · ${Math.floor(l.rep)}/100` : ' · sin local'}</title></path>`;
  }).join('');
  // La Ciudad de Buenos Aires es muy chica: va como un punto
  const lc = locales.caba;
  const caba = `<circle cx="${c.caba[0]}" cy="${c.caba[1]}" r="4.5" fill="${lc ? colorRep(lc.rep) : '#e3e6ec'}" class="prov${lc ? ' con-local' : ''}${seleccion === 'caba' ? ' seleccionada' : ''}" data-prov="caba" stroke="#fff" stroke-width="1.2"><title>Ciudad de Buenos Aires${lc ? ` · ${Math.floor(lc.rep)}/100` : ' · sin local'}</title></circle>`;

  // Camiones: uno por local con mercadería en camino (salen de tu ciudad)
  const destinos = [...new Set((e.pais?.envios || []).filter((x) => x.transporte).map((x) => x.local))];
  const camiones = origen && c[origen] ? destinos.filter((d) => c[d]).map((d, i) => {
    const [x1, y1] = c[origen];
    const [x2, y2] = c[d];
    const dur = 2.5 + (Math.hypot(x2 - x1, y2 - y1) / 120);
    return `<path d="M${x1},${y1} L${x2},${y2}" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3" opacity=".35" fill="none"/>
      <text font-size="11" text-anchor="middle" dy="4" transform="translate(${x1},${y1})" opacity="0">🚚<set attributeName="opacity" to="1" begin="${(i * 0.4).toFixed(1)}s"/><animateMotion dur="${dur.toFixed(1)}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" path="M0,0 L${(x2 - x1).toFixed(1)},${(y2 - y1).toFixed(1)}"/></text>`;
  }).join('') : '';

  const marcas = [];
  if (origen && c[origen]) marcas.push(`<text x="${c[origen][0]}" y="${c[origen][1] + 4}" font-size="12" text-anchor="middle">⭐</text>`);
  if (lelo && c[lelo]) marcas.push(`<text x="${c[lelo][0] + (lelo === origen ? 12 : 0)}" y="${c[lelo][1] + 4}" font-size="12" text-anchor="middle">😏</text>`);

  return `<svg class="mapa" viewBox="-4 -4 ${MAPA.w + 8} ${MAPA.h + 8}" role="img" aria-label="Mapa de tus locales" xmlns="http://www.w3.org/2000/svg">
    ${provincias}${caba}${camiones}${marcas.join('')}
  </svg>`;
}

export function leyendaMapa() {
  return `<div class="leyenda-mapa">
    <span><i style="background:#e3e6ec"></i>Sin local</span>
    <span><i style="background:${colorRep(0)}"></i>Reputación baja</span>
    <span><i style="background:${colorRep(100)}"></i>Alta</span>
    <span>⭐ tu ciudad</span><span>😏 Lelo</span><span>🚚 en camino</span>
  </div>`;
}
