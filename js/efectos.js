// Efectos: sonidos cortos (sintetizados, sin archivos) y números que saltan.
// Todo es opcional: si el navegador no tiene audio, el juego sigue igual.

const CLAVE_SONIDO = 'el-taller-sonido';
let ctx = null;
let activo = true;
try { activo = localStorage.getItem(CLAVE_SONIDO) !== 'no'; } catch { activo = true; }

export function sonidoActivo() {
  return activo;
}

export function alternarSonido() {
  activo = !activo;
  try { localStorage.setItem(CLAVE_SONIDO, activo ? 'si' : 'no'); } catch { /* sin guardado */ }
  if (activo) sonido('click');
  return activo;
}

function audio() {
  if (!activo) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// Un tono: frecuencia, cuándo arranca (s), duración (s), tipo de onda y volumen.
function tono(a, f, inicio, dur, tipo = 'sine', vol = 0.12, fFinal = null) {
  const o = a.createOscillator();
  const g = a.createGain();
  const t = a.currentTime + inicio;
  o.type = tipo;
  o.frequency.setValueAtTime(f, t);
  if (fFinal) o.frequency.exponentialRampToValueAtTime(fFinal, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Ruido corto (golpe de la prensa).
function golpe(a, inicio = 0, vol = 0.2) {
  const n = Math.floor(a.sampleRate * 0.08);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  const s = a.createBufferSource();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 700;
  g.gain.value = vol;
  s.buffer = buf;
  s.connect(f).connect(g).connect(a.destination);
  s.start(a.currentTime + inicio);
}

const SONIDOS = {
  click: (a) => tono(a, 660, 0, 0.05, 'triangle', 0.06),
  cobro: (a) => { tono(a, 1046, 0, 0.09, 'square', 0.05); tono(a, 1568, 0.08, 0.18, 'square', 0.05); }, // caja registradora
  gasto: (a) => tono(a, 330, 0, 0.18, 'triangle', 0.08, 220),
  pedido: (a) => { tono(a, 880, 0, 0.07, 'sine', 0.08); tono(a, 1175, 0.07, 0.09, 'sine', 0.07); },
  prensa: (a) => { golpe(a, 0, 0.25); tono(a, 120, 0, 0.12, 'sine', 0.12, 60); },
  buena: (a) => { tono(a, 784, 0, 0.1, 'triangle', 0.08); tono(a, 1046, 0.09, 0.14, 'triangle', 0.08); },
  mala: (a) => tono(a, 300, 0, 0.22, 'sawtooth', 0.04, 200),
  desastre: (a) => { tono(a, 220, 0, 0.25, 'sawtooth', 0.06, 110); tono(a, 165, 0.18, 0.3, 'sawtooth', 0.05, 90); },
  oportunidad: (a) => { tono(a, 988, 0, 0.08, 'sine', 0.08); tono(a, 1319, 0.08, 0.08, 'sine', 0.08); tono(a, 1760, 0.16, 0.14, 'sine', 0.07); },
  logro: (a) => [523, 659, 784, 1046].forEach((f, i) => tono(a, f, i * 0.11, 0.3, 'triangle', 0.09)),
  camion: (a) => tono(a, 90, 0, 0.35, 'sawtooth', 0.04, 140),
};

export function sonido(tipo) {
  const a = audio();
  const f = SONIDOS[tipo];
  if (!a || !f) return;
  try { f(a); } catch { /* audio no disponible */ }
}

// Sonido para un ítem de la semana animada o del resumen.
export function sonidoDeEvento(tipo) {
  const mapa = { pedido: 'pedido', buena: 'buena', mala: 'mala', desastre: 'desastre', oportunidad: 'oportunidad', hito: 'logro', rumor: 'mala' };
  if (mapa[tipo]) sonido(mapa[tipo]);
}

// Número que salta y se desvanece arriba de un elemento (por ejemplo, "+$12.000").
export function flotar(el, texto, tipo = 'positivo') {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const s = document.createElement('span');
  s.className = `flotante ${tipo}`;
  s.textContent = texto;
  s.style.left = `${r.left + r.width / 2}px`;
  s.style.top = `${r.top + window.scrollY}px`;
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1600);
}

// Cuenta de un número a otro (para el resumen). formato: (n) => texto.
export function contar(el, hasta, formato, ms = 900) {
  if (!el) return;
  const t0 = performance.now();
  const paso = (t) => {
    const p = Math.min(1, (t - t0) / ms);
    const suave = 1 - (1 - p) ** 3;
    el.textContent = formato(hasta * suave);
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
