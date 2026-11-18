// Escena del taller, dibujada en código (SVG). Cambia según dónde trabajás (casa, local, galpón, planta),
// las máquinas que compraste, tu equipo y el stock guardado. Las animaciones están en css/style.css (.esc-*).
import { MAQUINAS, PRODUCTOS } from './data.js';

const W = 360;
const H = 210;
const PISO = 168;

// Fondos por lugar de trabajo
const FONDOS = {
  casa: (titulo) => `
    <rect width="${W}" height="${PISO}" fill="#f7e6c8"/>
    <rect y="${PISO}" width="${W}" height="${H - PISO}" fill="#c08a55"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${i * 48}" y1="${PISO}" x2="${i * 48 - 20}" y2="${H}" stroke="#a87443" stroke-width="2"/>`).join('')}
    <rect x="24" y="24" width="70" height="56" rx="4" fill="#9fd3f5" stroke="#fff" stroke-width="5"/>
    <line x1="59" y1="24" x2="59" y2="80" stroke="#fff" stroke-width="3"/>
    <circle cx="80" cy="38" r="8" fill="#ffd54a" class="esc-sol"/>
    <rect x="260" y="108" width="92" height="60" rx="6" fill="#7aa6d8"/><rect x="260" y="100" width="30" height="20" rx="5" fill="#fff"/>
    <rect x="150" y="30" width="44" height="58" fill="#fff" stroke="#e0b97e" stroke-width="2"/><circle cx="172" cy="56" r="13" fill="#fff" stroke="#1d2433" stroke-width="2"/><path d="M172 47l7 5-3 8h-8l-3-8z" fill="#1d2433"/>
    ${cartel(titulo, '#1f2a44')}`,
  chico: (titulo) => `
    <rect width="${W}" height="${PISO}" fill="#e8f0fd"/>
    <rect y="${PISO}" width="${W}" height="${H - PISO}" fill="#9aa6b8"/>
    ${grilla('#8794a8')}
    <rect x="16" y="22" width="110" height="70" rx="4" fill="#bfe3ff" stroke="#1f2a44" stroke-width="4"/>
    <path d="M16 22h110l-8 14H24z" fill="#ef6b6b"/><path d="M38 22l-6 14M60 22l-4 14M82 22l-2 14M104 22v14" stroke="#fff" stroke-width="5"/>
    <rect x="250" y="40" width="96" height="6" fill="#8b5a2b"/><rect x="250" y="72" width="96" height="6" fill="#8b5a2b"/>
    ${cartel(titulo, '#2f6fde')}`,
  grande: (titulo) => `
    <rect width="${W}" height="${PISO}" fill="#eef3e6"/>
    <rect y="${PISO}" width="${W}" height="${H - PISO}" fill="#8f9c86"/>
    ${grilla('#7f8c77')}
    <rect x="14" y="20" width="70" height="60" rx="3" fill="#bfe3ff" stroke="#55624f" stroke-width="4"/>
    <rect x="96" y="20" width="70" height="60" rx="3" fill="#bfe3ff" stroke="#55624f" stroke-width="4"/>
    <rect x="252" y="30" width="96" height="6" fill="#6b4a2b"/><rect x="252" y="62" width="96" height="6" fill="#6b4a2b"/><rect x="252" y="94" width="96" height="6" fill="#6b4a2b"/>
    ${cartel(titulo, '#1e8a4c')}`,
  galpon: (titulo) => `
    <rect width="${W}" height="${PISO}" fill="#cfd6de"/>
    ${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 15}" y1="0" x2="${i * 15}" y2="${PISO}" stroke="#b6c0cb" stroke-width="2"/>`).join('')}
    <path d="M0 26 L${W / 2} 4 L${W} 26" fill="none" stroke="#7b8794" stroke-width="5"/>
    ${[40, 100, 180, 260, 320].map((x) => `<line x1="${x}" y1="${26 - (x < W / 2 ? x : W - x) * 22 / (W / 2)}" x2="${x}" y2="40" stroke="#7b8794" stroke-width="3"/>`).join('')}
    <rect y="${PISO}" width="${W}" height="${H - PISO}" fill="#7b8794"/>
    <rect x="0" y="${PISO + 2}" width="${W}" height="5" fill="#f5c518"/>
    ${cartel(titulo, '#55606e')}`,
  planta: (titulo) => `
    <rect width="${W}" height="${PISO}" fill="#dfe6ee"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${12 + i * 58}" y="14" width="46" height="34" fill="#bfe3ff" stroke="#5c6578" stroke-width="3"/>`).join('')}
    <rect y="${PISO}" width="${W}" height="${H - PISO}" fill="#6e7886"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect x="${i * 20}" y="${PISO + 2}" width="10" height="5" fill="#f5c518"/><rect x="${i * 20 + 10}" y="${PISO + 2}" width="10" height="5" fill="#1d2433"/>`).join('')}
    <rect x="300" y="56" width="16" height="40" fill="#8a94a3"/><circle cx="308" cy="50" r="6" fill="#fff" opacity=".8" class="esc-humo"/><circle cx="314" cy="40" r="8" fill="#fff" opacity=".6" class="esc-humo esc-d2"/>
    ${cartel(titulo, '#c0392b')}`,
};

function grilla(color) {
  return Array.from({ length: 9 }, (_, i) => `<line x1="${i * 45}" y1="${PISO}" x2="${i * 45 - 18}" y2="${H}" stroke="${color}" stroke-width="1.5"/>`).join('');
}

function escapar(t) {
  return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function cartel(titulo, color) {
  const t = escapar(titulo).slice(0, 34);
  const ancho = Math.max(90, t.length * 6.4 + 20);
  return `<g transform="translate(${W / 2 + 40 - ancho / 2},4)"><rect width="${ancho}" height="20" rx="4" fill="${color}"/><text x="${ancho / 2}" y="14" font-size="11" font-weight="700" text-anchor="middle" fill="#fff">${t}</text></g>`;
}

// Máquinas: cada una se dibuja en un lugar de 46 px de ancho, apoyada en el piso.
const DIBUJOS = {
  tazas: () => `
    <rect x="6" y="-34" width="30" height="34" rx="3" fill="#5c6578"/>
    <g class="esc-palanca"><rect x="18" y="-48" width="4" height="18" fill="#2f3542"/><circle cx="20" cy="-50" r="4" fill="#c0392b"/></g>
    <rect x="12" y="-24" width="16" height="14" rx="2" fill="#fff"/><path d="M28 -21 q6 4 0 8" stroke="#fff" stroke-width="2" fill="none"/>
    <path d="M16 -30 q2 -5 0 -9 M22 -30 q2 -5 0 -9" stroke="#bbb" stroke-width="1.5" fill="none" class="esc-vapor"/>`,
  gorras: () => `
    <rect x="6" y="-30" width="32" height="30" rx="3" fill="#6b4a8a"/>
    <path d="M10 -20 q12 -16 24 0 z" fill="#ef6b6b" class="esc-sube"/><rect x="8" y="-21" width="30" height="3" fill="#ef6b6b"/>`,
  plancha30: () => `
    <rect x="4" y="-8" width="38" height="8" fill="#3d4757"/><rect x="8" y="-14" width="30" height="6" fill="#fff"/>
    <g class="esc-plancha"><rect x="6" y="-30" width="34" height="8" rx="2" fill="#7b8794"/><rect x="20" y="-44" width="6" height="14" fill="#3d4757"/></g>`,
  plancha1m: () => `
    <rect x="0" y="-10" width="46" height="10" fill="#3d4757"/><rect x="3" y="-16" width="40" height="6" fill="#ffd54a"/>
    <g class="esc-plancha esc-d2"><rect x="1" y="-34" width="44" height="9" rx="2" fill="#2f6fde"/><rect x="20" y="-48" width="6" height="14" fill="#3d4757"/></g>`,
  calandra: () => `
    <rect x="2" y="-30" width="42" height="30" rx="4" fill="#c0392b"/>
    <g class="esc-gira" style="transform-origin:23px -16px"><circle cx="23" cy="-16" r="11" fill="#e8e8e8" stroke="#555" stroke-width="2"/><path d="M23 -27v22M12 -16h22" stroke="#999" stroke-width="2"/></g>
    <rect x="-4" y="-6" width="12" height="6" fill="#2f6fde"/>`,
  costura: () => `
    <rect x="4" y="-10" width="38" height="10" fill="#8b5a2b"/>
    <path d="M8 -10 v-18 h26 v8 h-6 v10" fill="#1e8a4c"/>
    <rect x="29" y="-18" width="2" height="8" fill="#333" class="esc-aguja"/>`,
  bordado: () => `
    <rect x="4" y="-10" width="38" height="10" fill="#5c6578"/>
    <rect x="8" y="-34" width="30" height="24" rx="3" fill="#ef9f27"/>
    <circle cx="23" cy="-22" r="7" fill="none" stroke="#fff" stroke-width="2"/><circle cx="23" cy="-22" r="2.5" fill="#c0392b" class="esc-latido"/>`,
};

// Una persona: cabeza, cuerpo y brazos que se mueven (cada uno con su ritmo).
function persona(x, color, retraso, etiqueta = '', piel = '#f1c27d') {
  return `<g transform="translate(${x},${PISO})">
    <g class="esc-trabaja" style="animation-delay:${retraso}s">
      <rect x="-6" y="-30" width="12" height="18" rx="4" fill="${color}"/>
      <circle cy="-36" r="6" fill="${piel}"/>
      <rect x="-4" y="-12" width="3" height="12" fill="#2d3436"/><rect x="1" y="-12" width="3" height="12" fill="#2d3436"/>
    </g>
    ${etiqueta ? `<text y="-46" font-size="8" text-anchor="middle" font-weight="700" fill="#1d2433">${escapar(etiqueta)}</text>` : ''}
  </g>`;
}

const COLORES_PUESTO = { operario: '#2f6fde', vendedor: '#ef6b6b', disenador: '#8e44ad', costurero: '#1e8a4c', bordador: '#ef9f27', rrhh: '#555' };
const PIELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];

export function escenaTaller(e) {
  const lugar = FONDOS[e.local] ? e.local : 'casa';
  const titulo = e.nombreTaller || (e.origen?.municipio ? `Taller · ${e.origen.municipio}` : 'Tu taller');
  const maquinas = Object.keys(MAQUINAS).filter((m) => e.maquinas[m]);
  const ancho = Math.min(46, (W - 20) / Math.max(1, maquinas.length));
  const escala = ancho / 46;
  const MESA = PISO - 58; // las máquinas van arriba de una mesa larga, contra la pared
  const dibMaquinas = maquinas.map((m, i) => `<g transform="translate(${10 + i * ancho},${MESA}) scale(${escala})">${DIBUJOS[m]()}</g>`).join('');

  // Stock: cajas apiladas (una cada tanto)
  const stock = Object.keys(PRODUCTOS).reduce((t, id) => t + (e.stock[id] || 0), 0);
  const cajas = Math.min(8, Math.ceil(stock / 6));
  const dibCajas = Array.from({ length: cajas }, (_, i) => `<rect x="${W - 34 - (i % 2) * 22}" y="${PISO - 16 - Math.floor(i / 2) * 15}" width="20" height="14" fill="#c9a26b" stroke="#8b6a3e"/>`).join('');

  // Equipo: vos, Lelo y hasta 12 empleados (el resto, "+N")
  const emps = e.equipo.empleados.filter((x) => !x.esLelo);
  const lelo = e.equipo.empleados.some((x) => x.esLelo);
  const visibles = emps.slice(0, 10);
  const gente = [persona(40, '#1f2a44', 0, 'Vos')];
  if (lelo) gente.push(persona(72, '#f5c518', 0.3, 'Lelo'));
  visibles.forEach((x, i) => {
    const col = COLORES_PUESTO[x.puesto] || '#2f6fde';
    gente.push(persona(100 + i * 18, col, (i % 5) * 0.17, '', PIELES[(x.nombre.length + i) % PIELES.length]));
  });
  const mas = emps.length - visibles.length;
  const masTxt = mas > 0 ? `<g transform="translate(${100 + visibles.length * 18 + 4},${PISO - 26})"><rect width="30" height="16" rx="8" fill="#1f2a44"/><text x="15" y="12" font-size="10" font-weight="700" text-anchor="middle" fill="#fff">+${mas}</text></g>` : '';
  const cansado = e.cansancio >= 70 ? '<text x="40" y="128" font-size="12" text-anchor="middle" class="esc-zzz">💦</text>' : '';

  return `<svg class="escena" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tu taller: ${escapar(titulo)}, con ${maquinas.length} máquina${maquinas.length === 1 ? '' : 's'} y ${emps.length} empleado${emps.length === 1 ? '' : 's'}" xmlns="http://www.w3.org/2000/svg">
    ${FONDOS[lugar](titulo)}
    ${maquinas.length ? `<rect x="4" y="${MESA}" width="${Math.min(W - 60, maquinas.length * ancho + 12)}" height="6" rx="2" fill="#8b5a2b"/><rect x="10" y="${MESA + 6}" width="5" height="52" fill="#6b4423"/><rect x="${Math.min(W - 60, maquinas.length * ancho + 12) - 6}" y="${MESA + 6}" width="5" height="52" fill="#6b4423"/>` : ''}
    ${dibMaquinas}
    ${dibCajas}
    ${gente.join('')}
    ${masTxt}${cansado}
  </svg>`;
}
