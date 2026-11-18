// Escena del taller, dibujada en código (SVG). Cambia según dónde trabajás (casa, local, galpón, planta),
// las máquinas que compraste, tu equipo y el stock guardado. Las animaciones están en css/style.css (.esc-*).
import { MAQUINAS, PRODUCTOS, NOMBRES_FEMENINOS } from './data.js';

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
    <rect x="138" y="30" width="44" height="58" fill="#fff" stroke="#e0b97e" stroke-width="2"/><circle cx="160" cy="56" r="13" fill="#fff" stroke="#1d2433" stroke-width="2"/><path d="M160 47l7 5-3 8h-8l-3-8z" fill="#1d2433"/>
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
    <rect x="252" y="26" width="96" height="6" fill="#6b4a2b"/><rect x="252" y="50" width="96" height="6" fill="#6b4a2b"/><rect x="252" y="74" width="96" height="6" fill="#6b4a2b"/>
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

// Una persona: pelo según si es hombre o mujer, cuerpo y piernas. Pasea un poco a los costados (--dx) y se mueve al trabajar.
function persona({ x, y, color, retraso = 0, etiqueta = '', piel = '#f1c27d', mujer = false, pelo = '#3b2a1e', escala = 1, dx = 0, t = 4, zona = '' }) {
  const peloAtras = mujer ? `<path d="M-7 -36 q0 -9 7 -9 q7 0 7 9 v9 h-14 z" fill="${pelo}"/>` : '';
  const peloArriba = mujer ? `<path d="M-6.5 -37 q1 -8 6.5 -8 q5.5 0 6.5 8 q-6 -4 -13 0z" fill="${pelo}"/>`
    : `<path d="M-6.2 -37 q0 -7.5 6.2 -7.5 q6.2 0 6.2 7.5 q-3 -3 -6.2 -3 q-3.2 0 -6.2 3z" fill="${pelo}"/>`;
  return `<g transform="translate(${x},${y}) scale(${escala})"${zona ? ` data-zona="${zona}" class="zona"` : ''}>
    <g class="esc-pasea" style="--dx:${dx}px;--t:${t}s;animation-delay:-${retraso * 3}s">
      <rect x="-10" y="-50" width="20" height="52" fill="transparent"/>
      <g class="esc-trabaja" style="animation-delay:${retraso}s">
        ${peloAtras}
        <rect x="-6" y="-30" width="12" height="18" rx="4" fill="${color}"/>
        <circle cy="-36" r="6" fill="${piel}"/>
        ${peloArriba}
        <rect x="-4" y="-12" width="3" height="12" fill="#2d3436"/><rect x="1" y="-12" width="3" height="12" fill="#2d3436"/>
      </g>
      ${etiqueta === 'Vos' ? '<path d="M-5 -60 h10 l-5 6z" fill="#f5c518" stroke="#1d2433" stroke-width="1" class="esc-latido"/>' : ''}
      ${etiqueta ? `<text y="${etiqueta === 'Vos' ? -62 : -50}" font-size="8" text-anchor="middle" font-weight="700" fill="#1d2433" stroke="#fff" stroke-width="2.5" paint-order="stroke">${escapar(etiqueta)}</text>` : ''}
    </g>
  </g>`;
}

const COLORES_PUESTO = { operario: '#2f6fde', vendedor: '#ef6b6b', disenador: '#8e44ad', costurero: '#1e8a4c', bordador: '#ef9f27', rrhh: '#555' };
const PIELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const PELOS = ['#3b2a1e', '#1d1d1d', '#7a4a1e', '#c99a4a', '#5a3825'];

// Objetos fijos del taller que se tocan (en todos los lugares, en el mismo lugar)
const MUEBLES = {
  corcho: () => `<rect x="196" y="54" width="48" height="36" rx="2" fill="#c49a6c" stroke="#8b6a3e" stroke-width="2"/>
    <rect x="201" y="59" width="14" height="12" fill="#fff" transform="rotate(-6 208 65)"/><rect x="219" y="58" width="12" height="15" fill="#ffe08a"/><rect x="226" y="74" width="14" height="11" fill="#bfe3ff" transform="rotate(5 233 79)"/>
    <circle cx="208" cy="60" r="1.6" fill="#c0392b"/><circle cx="225" cy="59" r="1.6" fill="#2f6fde"/><circle cx="233" cy="75" r="1.6" fill="#1e8a4c"/>`,
  pc: () => `<rect x="212" y="128" width="50" height="5" rx="1" fill="#8b5a2b"/><rect x="215" y="133" width="4" height="35" fill="#6b4423"/><rect x="255" y="133" width="4" height="35" fill="#6b4423"/>
    <rect x="218" y="104" width="30" height="20" rx="2" fill="#1d2433"/><rect x="221" y="107" width="24" height="14" fill="#7fc8ff" class="esc-pantalla"/><rect x="230" y="124" width="6" height="4" fill="#1d2433"/>`,
  celular: () => `<rect x="251" y="115" width="8" height="13" rx="1.5" fill="#1d2433"/><rect x="252.3" y="116.5" width="5.4" height="9" fill="#9be3a8" class="esc-pantalla"/>`,
  cajas: () => '',
  puerta: () => `<rect x="318" y="98" width="34" height="70" rx="2" fill="#8b5a2b" stroke="#5e3b1c" stroke-width="2"/><rect x="323" y="104" width="24" height="26" rx="1" fill="#a06a35"/><rect x="323" y="136" width="24" height="26" rx="1" fill="#a06a35"/><circle cx="345" cy="136" r="2" fill="#f5c518"/>`,
};
// Dónde está cada cosa (para tocarla y para el ❗)
const CAJAS_ZONA = { corcho: [194, 52, 52, 40], pc: [210, 100, 40, 68], celular: [248, 108, 16, 26], cajas: [266, 100, 50, 68], puerta: [316, 96, 38, 72] };

function alerta(x, y) {
  return `<g transform="translate(${x},${y})" class="esc-alerta"><circle r="6" fill="#e74c3c" stroke="#fff" stroke-width="1.5"/><text y="3.5" font-size="9" font-weight="800" text-anchor="middle" fill="#fff">!</text></g>`;
}

function marco([x, y, w, h], activa) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="transparent" ${activa ? 'stroke="#f5c518" stroke-width="2.5" stroke-dasharray="5 3" class="esc-elegida"' : ''}/>`;
}

// Máquinas que se ven: las que tenés y las que podés comprar (en gris, con un "+").
export function maquinasDeLaEscena(e, { fantasmas = true, enPais = false } = {}) {
  return Object.keys(MAQUINAS).filter((m) => e.maquinas[m] || (fantasmas && (!MAQUINAS[m].desdePais || enPais)));
}

// opciones: zona elegida, alertas (Set de zonas con ❗), fantasmas (máquinas por comprar), enPais.
export function escenaTaller(e, { zona = null, alertas = new Set(), fantasmas = false, enPais = false, interactiva = false } = {}) {
  const lugar = FONDOS[e.local] ? e.local : 'casa';
  const titulo = e.nombreTaller || (e.origen?.municipio ? `Taller · ${e.origen.municipio}` : 'Tu taller');
  const maquinas = maquinasDeLaEscena(e, { fantasmas, enPais });
  const anchoMesa = 200;
  const ancho = Math.min(46, (anchoMesa - 8) / Math.max(1, maquinas.length));
  const escala = ancho / 46;
  const MESA = PISO - 58; // las máquinas van arriba de una mesa larga, contra la pared
  const z = (id) => (interactiva ? ` data-zona="${id}" class="zona"` : '');
  const dibMaquinas = maquinas.map((m, i) => {
    const x = 8 + i * ancho;
    const tiene = e.maquinas[m];
    const caja = [x - 1, MESA - 52 * escala - 4, ancho, 52 * escala + 10];
    return `<g${z(m)}>
      <g transform="translate(${x},${MESA}) scale(${escala})" ${tiene ? '' : 'opacity=".28" class="esc-fantasma"'}>${DIBUJOS[m]()}</g>
      ${tiene ? '' : `<g transform="translate(${x + ancho / 2},${MESA - 20 * escala})"><circle r="${Math.max(6, 8 * escala)}" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text y="${Math.max(6, 8 * escala) * 0.5}" font-size="${Math.max(10, 13 * escala)}" font-weight="800" text-anchor="middle" fill="#1f2a44">+</text></g>`}
      ${interactiva ? marco(caja, zona === m) : ''}
      ${alertas.has(m) ? alerta(x + ancho - 4, MESA - 50 * escala) : ''}
    </g>`;
  }).join('');

  // Stock: cajas apiladas (una cada tanto)
  const stock = Object.keys(PRODUCTOS).reduce((t, id) => t + (e.stock[id] || 0), 0);
  const cajas = Math.max(interactiva ? 1 : 0, Math.min(8, Math.ceil(stock / 6)));
  const dibCajas = Array.from({ length: cajas }, (_, i) => `<rect x="${292 - (i % 2) * 22}" y="${PISO - 16 - Math.floor(i / 2) * 15}" width="20" height="14" fill="#c9a26b" stroke="#8b6a3e"/>`).join('');

  const muebles = ['corcho', 'pc', 'celular', 'puerta'].map((id) => `<g${z(id)}>${MUEBLES[id]()}${interactiva ? marco(CAJAS_ZONA[id], zona === id) : ''}</g>`).join('');
  const cajasG = `<g${z('cajas')}>${dibCajas}${interactiva ? marco(CAJAS_ZONA.cajas, zona === 'cajas') : ''}</g>`;
  const alertasMuebles = ['corcho', 'pc', 'celular', 'cajas', 'puerta'].filter((id) => alertas.has(id)).map((id) => { const [x, y, w] = CAJAS_ZONA[id]; return alerta(x + w - 2, y + 2); }).join('');

  // Equipo: vos, Lelo y cada empleado, paseando por el piso (en tres filas)
  const emps = e.equipo.empleados.filter((x) => !x.esLelo);
  const lelo = e.equipo.empleados.some((x) => x.esLelo);
  const total = 1 + (lelo ? 1 : 0) + emps.length;
  const esc = total <= 12 ? 1 : total <= 30 ? 0.8 : 0.62;
  const filas = [180, 194, 208];
  const gente = [];
  emps.forEach((x, i) => {
    const k = i + (lelo ? 2 : 1);
    gente.push({ fila: k % 3, html: persona({
      x: 18 + ((k * 61) % 300), y: filas[k % 3], color: COLORES_PUESTO[x.puesto] || '#2f6fde', retraso: (i % 7) * 0.19,
      piel: PIELES[(x.nombre.length + i) % PIELES.length], pelo: PELOS[(x.nombre.length * 3 + i) % PELOS.length],
      mujer: (x.genero || (NOMBRES_FEMENINOS.includes(x.nombre) ? 'mujer' : 'hombre')) === 'mujer', escala: esc, dx: ((i % 5) - 2) * 9 || 12, t: 3 + (i % 4), zona: interactiva ? 'equipo' : '',
    }) });
  });
  if (lelo) gente.push({ fila: 1, html: persona({ x: 80, y: filas[1], color: '#f5c518', retraso: 0.3, etiqueta: 'Lelo', escala: esc, dx: -14, t: 5, zona: interactiva ? 'equipo' : '' }) });
  gente.push({ fila: 2, html: persona({ x: 40, y: filas[2], color: '#1f2a44', etiqueta: 'Vos', mujer: e.genero === 'mujer', escala: Math.max(esc, 0.8), dx: 16, t: 4.5, zona: interactiva ? 'vos' : '' }) });
  gente.sort((a, b) => a.fila - b.fila);
  const marcoGente = interactiva && (zona === 'equipo' || zona === 'vos') ? `<rect x="2" y="${PISO - 2}" width="${W - 4}" height="${H - PISO}" rx="4" fill="none" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="5 3"/>` : '';
  const alertaGente = alertas.has('equipo') ? alerta(W - 14, PISO + 8) : '';
  const cansado = e.cansancio >= 70 ? '<text x="40" y="150" font-size="12" text-anchor="middle" class="esc-zzz">💦</text>' : '';

  return `<svg class="escena${interactiva ? ' interactiva' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tu taller: ${escapar(titulo)}, con ${maquinas.filter((m) => e.maquinas[m]).length} máquinas y ${emps.length} empleados" xmlns="http://www.w3.org/2000/svg">
    ${FONDOS[lugar](titulo)}
    ${maquinas.length ? `<rect x="4" y="${MESA}" width="${anchoMesa}" height="6" rx="2" fill="#8b5a2b"/><rect x="10" y="${MESA + 6}" width="5" height="52" fill="#6b4423"/><rect x="${anchoMesa - 6}" y="${MESA + 6}" width="5" height="52" fill="#6b4423"/>` : ''}
    ${dibMaquinas}
    ${muebles}
    ${cajasG}
    ${alertasMuebles}
    ${gente.map((g) => g.html).join('')}
    ${marcoGente}${alertaGente}${cansado}
  </svg>`;
}
