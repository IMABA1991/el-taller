// Mapa del país: cada provincia se pinta según la reputación de tu local ahí.
// Los camiones viajan desde tu ciudad a los locales que tienen mercadería en camino.
import { MAPA } from './mapa-datos.js';
import { PROVINCIAS_AR, REGIONES, diaRegion } from './data.js';

const CARPETA = 'assets/img/';
// Vehículos del traslado (miran a la derecha; se dan vuelta cuando van a la izquierda). w y h en unidades del mapa.
const VEHICULO = {
  flete: { archivo: 'mapa-camion.png', w: 38, h: 24 },
  avion: { archivo: 'mapa-avion.png', w: 40, h: 20 },
  amigo: { archivo: 'mapa-auto.png', w: 40, h: 22 },
};

// De gris (sin local) a durazno (reputación 0) y a verde (100).
function colorRep(rep) {
  const t = Math.max(0, Math.min(1, rep / 100));
  const a = [246, 201, 168];
  const b = [30, 138, 76];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c.join(',')})`;
}

export function mapaPais(e, { seleccion = null, conCamiones = true, clase = '' } = {}) {
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

  // Vehículos: uno por local con mercadería en camino (salen de tu ciudad)
  const destinos = [...new Set((e.pais?.envios || []).filter((x) => x.transporte).map((x) => x.local))];
  const img = VEHICULO[e.pais?.transporte] || VEHICULO.flete;
  const camiones = origen && c[origen] ? destinos.filter((d) => c[d]).map((d, i) => {
    const [x1, y1] = c[origen];
    const [x2, y2] = c[d];
    const dur = 2.5 + (Math.hypot(x2 - x1, y2 - y1) / 120);
    const espejo = x2 < x1 ? ' transform="scale(-1,1)"' : '';
    return `<path d="M${x1},${y1} L${x2},${y2}" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3" opacity=".35" fill="none"/>
      <g transform="translate(${x1},${y1})" opacity="0"><g${espejo}><image href="${CARPETA}${img.archivo}" x="${-img.w / 2}" y="${-img.h / 2}" width="${img.w}" height="${img.h}"/></g><set attributeName="opacity" to="1" begin="${(i * 0.4).toFixed(1)}s"/><animateMotion dur="${dur.toFixed(1)}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" path="M0,0 L${(x2 - x1).toFixed(1)},${(y2 - y1).toFixed(1)}"/></g>`;
  }).join('') : '';

  return `<svg class="mapa${clase ? ` ${clase}` : ''}" viewBox="-4 -14 ${MAPA.w + 8} ${MAPA.h + 18}" role="img" aria-label="Mapa de tus locales" xmlns="http://www.w3.org/2000/svg">
    ${provincias}${caba}${pines(e, origen, lelo)}${conCamiones ? camiones : ''}<g class="capa-anim"></g>
  </svg>`;
}

// Pines: tu taller (dorado) y cada local (amarillo). Lelo, gerente comercial, con su cara.
function pines(e, origen, lelo) {
  const c = MAPA.centros;
  const out = [];
  for (const l of e.pais?.locales || []) {
    if (l.prov === origen || !c[l.prov]) continue;
    const [x, y] = c[l.prov];
    out.push(`<image class="pin" href="${CARPETA}mapa-local.png" x="${x - 6}" y="${y - 17}" width="12" height="18" data-pin="${l.prov}"/>`);
  }
  if (origen && c[origen]) {
    const [x, y] = c[origen];
    out.push(`<g class="pin-base" data-pin="${origen}"><image href="${CARPETA}mapa-base.png" x="${x - 9}" y="${y - 26}" width="18" height="27"/></g>`);
  }
  if (lelo && c[lelo]) out.push(`<text x="${c[lelo][0] + 9}" y="${c[lelo][1] + 2}" font-size="11" text-anchor="middle">😏</text>`);
  return out.join('');
}

export function leyendaMapa() {
  return `<div class="leyenda-mapa">
    <span><i style="background:#e3e6ec"></i>Sin local</span>
    <span><i style="background:${colorRep(0)}"></i>Reputación baja</span>
    <span><i style="background:${colorRep(100)}"></i>Alta</span>
    <span><img src="${CARPETA}mapa-base.png" alt="" class="ico-leyenda">tu taller</span><span><img src="${CARPETA}mapa-local.png" alt="" class="ico-leyenda">local</span><span>😏 Lelo</span><span><img src="${CARPETA}mapa-camion.png" alt="" class="ico-leyenda ancho">en camino</span>
  </div>`;
}

// ---------- La semana en el mapa: de lunes a sábado, un viaje por región; el domingo, descanso ----------

// Lo que pasa cada día en el mapa: el viaje de la región y los sobres de pedidos que vuelven.
export function datosMapaSemana(e, sem) {
  const origen = (e.pais?.locales || []).find((l) => l.origen)?.prov || e.origen?.provincia;
  const dias = Array.from({ length: 7 }, (_, i) => ({ region: REGIONES.find((r) => r.dia === i) || null, viaje: null, sobres: [] }));
  for (const env of (e.pais?.envios || []).filter((x) => x.llega === sem.semana && x.transporte)) {
    const d = dias[diaRegion(env.local) ?? 6];
    d.viaje ||= { transporte: env.transporte, paradas: [] };
    const parte = env.resuelto?.parte ?? 1;
    d.viaje.paradas.push({ prov: env.local, problema: parte === 0 ? 'total' : parte < 1 ? 'parcial' : null });
  }
  for (const prov of new Set((sem.pedidos || []).filter((p) => p.local).map((p) => p.local))) {
    dias[diaRegion(prov) ?? 6].sobres.push(prov);
  }
  // Paradas en orden: siempre a la más cercana
  for (const d of dias) {
    if (!d.viaje || !origen) continue;
    let actual = MAPA.centros[origen];
    const quedan = d.viaje.paradas.filter((p) => MAPA.centros[p.prov]);
    const orden = [];
    while (quedan.length) {
      quedan.sort((a, b) => dist(actual, MAPA.centros[a.prov]) - dist(actual, MAPA.centros[b.prov]));
      const p = quedan.shift();
      orden.push(p);
      actual = MAPA.centros[p.prov];
    }
    d.viaje.paradas = orden;
  }
  return { origen, dias };
}

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Cuánto dura la animación de un día (para que la semana espere al vehículo).
export function duracionDiaMapa(dm, origen) {
  if (!dm) return 0;
  let t = 0;
  if (dm.viaje && MAPA.centros[origen]) {
    let actual = MAPA.centros[origen];
    for (const p of dm.viaje.paradas) {
      t += tramo(actual, MAPA.centros[p.prov]) * (p.problema ? 1.1 : 1) + PARADA + (p.problema ? PAUSA : 0);
      actual = MAPA.centros[p.prov];
    }
    t += 400;
  }
  if (dm.sobres.length) t = Math.max(t, 400 + dm.sobres.length * 150 + VUELO_SOBRE);
  return t;
}
// Los tramos cortos son rápidos y los largos, un poco más lentos (con tope)
const tramo = (a, b) => Math.min(1100, 300 + dist(a, b) * 6);
const PARADA = 200; // ms en cada local
const PAUSA = 800; // ms parado con el cartel en rojo
const VUELO_SOBRE = 1000;

// Anima el mapa ya dibujado (un <svg class="mapa">). Devuelve { dia(i), parar() }.
export function animadorMapa(svg, datos) {
  const NS = 'http://www.w3.org/2000/svg';
  const capa = svg.querySelector('.capa-anim');
  const c = MAPA.centros;
  let vivo = true;
  const frames = new Set();
  const esperar = (ms) => new Promise((ok) => { const id = setTimeout(ok, ms); frames.add({ t: id }); });
  const el = (tag, attrs, padre = capa) => {
    const x = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    padre.appendChild(x);
    return x;
  };
  // Mueve un grupo por una curva (bezier cuadrática) de a hasta b. desde/hasta: tramo (0 a 1) a recorrer.
  const mover = (g, a, b, alto, dur, { desde = 0, hasta = 1, giro = null } = {}) => new Promise((ok) => {
    const cx = (a[0] + b[0]) / 2;
    const cy = (a[1] + b[1]) / 2 - alto;
    const t0 = performance.now();
    const paso = (ahora) => {
      if (!vivo) return ok();
      const k = Math.min(1, (ahora - t0) / dur);
      const s = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2; // suave al salir y al llegar
      const t = desde + (hasta - desde) * s;
      const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
      const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
      g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})${giro ? ` ${giro}` : ''}`);
      if (k < 1) { const id = requestAnimationFrame(paso); frames.add({ f: id }); } else ok();
    };
    const id = requestAnimationFrame(paso);
    frames.add({ f: id });
  });
  // Cartelito que aparece y se va (✓ verde, ! naranja, 💥 rojo)
  const cartel = (x, y, texto, color, ms = 1200) => {
    const g = el('g', { class: 'cartel-mapa', transform: `translate(${x},${y})` });
    el('circle', { r: 7, fill: color, stroke: '#fff', 'stroke-width': 1.5 }, g);
    const t = el('text', { 'text-anchor': 'middle', dy: '3.5', 'font-size': 9, 'font-weight': 800, fill: '#fff' }, g);
    t.textContent = texto;
    setTimeout(() => g.remove(), ms);
    return g;
  };
  const sprite = (archivo, w, h) => {
    const g = el('g', { class: 'sprite' });
    const inner = el('g', {}, g);
    el('image', { href: `${CARPETA}${archivo}`, x: -w / 2, y: -h / 2, width: w, height: h }, inner);
    return { g, inner };
  };
  const latir = (prov) => {
    const p = svg.querySelector(`[data-pin="${prov}"]`);
    if (!p) return;
    p.classList.remove('late');
    void p.getBBox();
    p.classList.add('late');
  };

  async function viaje(v) {
    const o = c[datos.origen];
    if (!o) return;
    const veh = VEHICULO[v.transporte] || VEHICULO.flete;
    const avion = v.transporte === 'avion';
    const { g, inner } = sprite(veh.archivo, veh.w, veh.h);
    let actual = o;
    for (const p of v.paradas) {
      if (!vivo) return;
      const destino = c[p.prov];
      inner.setAttribute('transform', destino[0] < actual[0] ? 'scale(-1,1)' : '');
      const alto = avion ? Math.max(18, dist(actual, destino) * 0.3) : 0;
      if (p.problema) {
        await mover(g, actual, destino, alto, tramo(actual, destino) * 0.55, { hasta: 0.5 });
        if (!vivo) return;
        const t = 0.5;
        const mx = (actual[0] + destino[0]) / 2;
        const my = (actual[1] + destino[1]) / 2 - alto / 2;
        cartel(mx, my - 14, p.problema === 'total' ? '✕' : '!', p.problema === 'total' ? '#d63b3b' : '#e8892c', PAUSA + 300);
        g.classList.add('tiembla');
        await esperar(PAUSA);
        g.classList.remove('tiembla');
        await mover(g, actual, destino, alto, tramo(actual, destino) * 0.55, { desde: t });
      } else {
        await mover(g, actual, destino, alto, tramo(actual, destino));
      }
      if (!vivo) return;
      cartel(destino[0], destino[1] - 26, p.problema === 'total' ? '✕' : '✓', p.problema === 'total' ? '#d63b3b' : p.problema ? '#e8892c' : '#2a9d5b');
      latir(p.prov);
      await esperar(PARADA);
      actual = destino;
    }
    g.classList.add('se-va');
    await esperar(400);
    g.remove();
  }

  async function sobre(prov, demora) {
    const a = c[prov];
    const b = c[datos.origen];
    if (!a || !b) return;
    await esperar(demora);
    if (!vivo) return;
    const { g } = sprite('mapa-sobre.png', 16, 12);
    if (prov === datos.origen) {
      g.setAttribute('transform', `translate(${a[0]},${a[1] - 30})`);
      g.classList.add('aparece');
      await esperar(700);
    } else {
      await mover(g, a, [b[0], b[1] - 12], Math.max(20, dist(a, b) * 0.25), VUELO_SOBRE);
    }
    g.remove();
    latir(datos.origen);
  }

  return {
    dia(i) {
      const d = datos.dias[i];
      if (!vivo || !d) return;
      if (d.viaje) viaje(d.viaje);
      d.sobres.forEach((prov, k) => sobre(prov, 400 + k * 150));
    },
    parar() {
      vivo = false;
      for (const x of frames) { if (x.f) cancelAnimationFrame(x.f); if (x.t) clearTimeout(x.t); }
      frames.clear();
      capa.innerHTML = '';
    },
  };
}
