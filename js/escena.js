// Escena isométrica del taller: el lugar (pieza, local, galpón, planta) con las máquinas, los muebles y la gente.
// Cada cosa se toca y abre su menú (ver main.js). Las imágenes están en assets/iso/.
import { MAQUINAS, PRODUCTOS, NOMBRES_FEMENINOS } from './data.js';

const RUTA = 'assets/iso/';
// Tamaño de cada imagen (ancho, alto) en píxeles
const TAM = {
  'iso-bordado': [600, 527], 'iso-cajas': [385, 506], 'iso-calandra': [600, 580], 'iso-celular': [383, 571],
  'iso-corcho': [420, 559], 'iso-costura': [600, 527], 'iso-empleada': [246, 675], 'iso-empleado': [297, 669],
  'iso-gorras': [557, 659], 'iso-lelo': [219, 676], 'iso-pc': [548, 558], 'iso-plancha1m': [522, 660],
  'iso-plancha30': [557, 659], 'iso-puerta': [261, 547], 'iso-tazas': [557, 660], 'iso-vos-hombre': [217, 662],
  'iso-vos-mujer': [238, 675],
  'lugar-casa': [824, 679], 'lugar-chico': [808, 673], 'lugar-galpon': [837, 698], 'lugar-grande': [828, 682], 'lugar-planta': [832, 689],
};
const LUGARES = { casa: 'lugar-casa', chico: 'lugar-chico', grande: 'lugar-grande', galpon: 'lugar-galpon', planta: 'lugar-planta' };

// El piso de los cinco lugares ocupa casi el mismo rombo: atrás (B), izquierda (L), derecha (R) y adelante (F).
const PISO = { B: [400, 305], L: [28, 472], R: [786, 470], F: [404, 640] };
// Un punto del piso: u va del rincón del fondo (B) hacia la derecha (R); v, del rincón hacia la izquierda (L).
function punto(u, v) {
  const { B, L, R, F } = PISO;
  const x = B[0] + u * (R[0] - B[0]) + v * (L[0] - B[0]) + u * v * (F[0] - R[0] - L[0] + B[0]);
  const y = B[1] + u * (R[1] - B[1]) + v * (L[1] - B[1]) + u * v * (F[1] - R[1] - L[1] + B[1]);
  return [x, y];
}

// Alto de cada cosa en la escena (el lugar mide unos 830 de ancho)
const ALTO = {
  tazas: 132, gorras: 132, plancha30: 132, plancha1m: 146, calandra: 140, costura: 116, bordado: 124,
  pc: 104, celular: 44, cajas: 70, puerta: 205, corcho: 130, persona: 128,
};
const IMG_MAQ = { tazas: 'iso-tazas', gorras: 'iso-gorras', plancha30: 'iso-plancha30', plancha1m: 'iso-plancha1m', calandra: 'iso-calandra', costura: 'iso-costura', bordado: 'iso-bordado' };

function escapar(t) {
  return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Una imagen apoyada en el piso: (x, y) es el punto del piso donde apoya (abajo al centro).
function pieza(nombre, x, y, alto, { clase = '', espejo = false, subir = 0 } = {}) {
  const [w0, h0] = TAM[nombre];
  const ancho = (alto * w0) / h0;
  const x0 = x - ancho / 2;
  const y0 = y - alto * 0.95 - subir;
  const t = espejo ? ` transform="translate(${(2 * x).toFixed(1)},0) scale(-1,1)"` : '';
  return { svg: `<image href="${RUTA}${nombre}.png" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${ancho.toFixed(1)}" height="${alto.toFixed(1)}"${clase ? ` class="${clase}"` : ''}${t}/>`, caja: [x0, y0, ancho, alto] };
}

function alerta(x, y) {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})" class="esc-alerta"><circle r="15" fill="#e74c3c" stroke="#fff" stroke-width="3"/><text y="8" font-size="22" font-weight="800" text-anchor="middle" fill="#fff">!</text></g>`;
}

// Máquinas que se ven: las que tenés y las que podés comprar (en gris, con un "+").
// Para no llenar el taller, de las que no tenés se ven solo las dos próximas.
export function maquinasDeLaEscena(e, { fantasmas = true, enPais = false } = {}) {
  const proximas = Object.keys(MAQUINAS).filter((m) => !e.maquinas[m] && (!MAQUINAS[m].desdePais || enPais)).slice(0, 2);
  return Object.keys(MAQUINAS).filter((m) => e.maquinas[m] || (fantasmas && proximas.includes(m)));
}

// Número pseudoazaroso estable (para que la gente no salte de lugar en cada pantalla)
function azar(i, k = 1) {
  const s = Math.sin((i + 1) * 12.9898 * k + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// opciones: zona elegida, alertas (Set de zonas con ❗), fantasmas (máquinas por comprar), enPais.
export function escenaTaller(e, { zona = null, alertas = new Set(), fantasmas = false, enPais = false, interactiva = false } = {}) {
  const lugar = LUGARES[e.local] || LUGARES.casa;
  const [LW, LH] = TAM[lugar];
  const titulo = e.nombreTaller || (e.origen?.municipio ? `Taller · ${e.origen.municipio}` : 'Tu taller');
  const cosas = []; // { prof, svg } — se dibujan de atrás para adelante
  const zonaAttr = (id) => (interactiva ? ` data-zona="${id}" class="zona${zona === id ? ' elegida' : ''}"` : '');
  const agregar = (id, u, v, html, caja, extra = '') => {
    const marca = alertas.has(id) ? alerta(caja[0] + caja[2] * 0.5, caja[1] - 4) : '';
    cosas.push({ prof: u + v, svg: `<g${zonaAttr(id)}>${html}${extra}${marca}</g>` });
  };

  // Máquinas: en fila contra la pared izquierda (y una segunda fila si son más de 4)
  const maquinas = maquinasDeLaEscena(e, { fantasmas, enPais });
  maquinas.forEach((m, i) => {
    const fila = Math.floor(i / 3);
    const k = i % 3;
    const u = [0.15, 0.4, 0.63][fila] ?? 0.63;
    const v = [0.3, 0.58, 0.86][k];
    const [x, y] = punto(u, v);
    const tiene = e.maquinas[m];
    const p = pieza(IMG_MAQ[m], x, y, ALTO[m], { clase: tiene ? 'esc-maquina' : 'esc-fantasma' });
    const mas = tiene ? '' : `<g transform="translate(${x.toFixed(1)},${(p.caja[1] + p.caja[3] * 0.45).toFixed(1)})"><circle r="17" fill="#fff" stroke="#1f2a44" stroke-width="3"/><text y="9" font-size="26" font-weight="800" text-anchor="middle" fill="#1f2a44">+</text></g>`;
    agregar(m, u, v, p.svg, p.caja, mas);
  });

  // Muebles que se tocan
  {
    const [x, y] = punto(0.74, 0.16);
    const p = pieza('iso-pc', x, y, ALTO.pc);
    agregar('pc', 0.74, 0.16, p.svg, p.caja);
  }
  {
    const [x, y] = punto(0.93, 0.2);
    const p = pieza('iso-celular', x, y, ALTO.celular, { subir: 0 });
    agregar('celular', 0.93, 0.2, p.svg, p.caja);
  }
  {
    // El corcho, colgado en la pared derecha (arriba de la PC)
    const [x, y] = punto(0.8, 0.0);
    const p = pieza('iso-corcho', x, y, ALTO.corcho, { espejo: true, subir: 140 });
    cosas.push({ prof: -1, svg: `<g${zonaAttr('corcho')}>${p.svg}${alertas.has('corcho') ? alerta(p.caja[0] + p.caja[2] * 0.8, p.caja[1] + 10) : ''}</g>` });
  }
  {
    // La puerta, en la pared izquierda, adelante
    const [x, y] = punto(0.0, 0.9);
    const p = pieza('iso-puerta', x + 6, y, ALTO.puerta);
    cosas.push({ prof: 0.5, svg: `<g${zonaAttr('puerta')}>${p.svg}${alertas.has('puerta') ? alerta(p.caja[0] + p.caja[2] * 0.7, p.caja[1] + 10) : ''}</g>` });
  }
  {
    // Cajas: más grandes cuanto más stock
    const stock = Object.keys(PRODUCTOS).reduce((t, id) => t + (e.stock[id] || 0), 0);
    const alto = stock ? Math.min(110, 55 + stock * 0.6) : 46;
    const [x, y] = punto(0.55, 0.12);
    const p = pieza('iso-cajas', x, y, alto, { clase: stock ? '' : 'esc-vacio' });
    agregar('cajas', 0.55, 0.12, p.svg, p.caja);
  }

  // Gente: vos, Lelo y una persona por empleado, paseando por el medio del piso
  const emps = e.equipo.empleados.filter((x) => !x.esLelo);
  const lelo = e.equipo.empleados.some((x) => x.esLelo);
  const total = 1 + (lelo ? 1 : 0) + emps.length;
  const esc = total <= 8 ? 1 : total <= 20 ? 0.82 : 0.66;
  const persona = (nombre, i, id, { etiqueta = '', fijo = null, grande = 1 } = {}) => {
    const u = fijo ? fijo[0] : 0.4 + azar(i, 1) * 0.42;
    const v = fijo ? fijo[1] : 0.4 + azar(i, 2) * 0.55;
    const [x, y] = punto(u, v);
    const p = pieza(nombre, x, y, ALTO.persona * (fijo ? Math.max(esc, 0.9) * grande : esc));
    const paso = fijo ? 0 : (azar(i, 3) - 0.5) * 60;
    const flecha = etiqueta ? `<path d="M${x - 9},${p.caja[1] - 22} h18 l-9,11z" fill="#f5c518" stroke="#1d2433" stroke-width="2" class="esc-latido"/>` : '';
    cosas.push({
      prof: u + v + 0.01,
      svg: `<g${zonaAttr(id)}><g class="esc-pasea" style="--dx:${paso.toFixed(0)}px;--dy:${(paso * 0.5).toFixed(0)}px;--t:${(3.5 + azar(i, 4) * 3).toFixed(1)}s;animation-delay:-${(azar(i, 5) * 4).toFixed(1)}s">${p.svg}${flecha}</g></g>`,
    });
  };
  emps.forEach((x, i) => {
    const mujer = (x.genero || (NOMBRES_FEMENINOS.includes(x.nombre) ? 'mujer' : 'hombre')) === 'mujer';
    persona(mujer ? 'iso-empleada' : 'iso-empleado', i + 2, 'equipo');
  });
  if (lelo) persona('iso-lelo', 1, 'equipo');
  // Vos, en la esquina de la derecha, mirando todo
  persona(e.genero === 'mujer' ? 'iso-vos-mujer' : 'iso-vos-hombre', 0, 'vos', { etiqueta: 'Vos', fijo: [0.94, 0.5], grande: 1.08 });
  const alertaGente = alertas.has('equipo') ? (() => { const [x, y] = punto(0.95, 0.95); return alerta(x, y - 150); })() : '';

  cosas.sort((a, b) => a.prof - b.prof);
  const cansado = e.cansancio >= 70 ? (() => { const [x, y] = punto(0.42, 0.36); return `<text x="${x}" y="${y - 150}" font-size="30" class="esc-zzz">💦</text>`; })() : '';

  return `<svg class="escena iso${interactiva ? ' interactiva' : ''}" viewBox="0 0 ${LW} ${LH}" role="img" aria-label="Tu taller: ${escapar(titulo)}, con ${maquinas.filter((m) => e.maquinas[m]).length} máquinas y ${emps.length} empleados" xmlns="http://www.w3.org/2000/svg">
    <image href="${RUTA}${lugar}.png" x="0" y="0" width="${LW}" height="${LH}"/>
    ${cosas.map((c) => c.svg).join('')}
    ${alertaGente}${cansado}
    <g transform="translate(14,${LH - 14})"><text font-size="24" font-weight="800" fill="#1d2433" stroke="#fff" stroke-width="6" paint-order="stroke">${escapar(titulo).slice(0, 40)}</text></g>
  </svg>`;
}
