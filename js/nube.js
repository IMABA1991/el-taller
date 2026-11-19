// Cuenta de Google y partida en la nube (Firebase, plan gratuito).
// El juego funciona igual sin esto: si Firebase no carga (sin internet, bloqueado), se juega solo en este navegador.
// La configuración de Firebase es pública: lo que protege las partidas son las reglas de Firestore
// (cada jugador solo puede leer y escribir partidas/{su uid}).

const CONFIG = {
  apiKey: 'AIzaSyATw1nKrqmYBt6La3_BBEIyPbCDbnqC1Xw',
  authDomain: 'el-taller-38851.firebaseapp.com',
  projectId: 'el-taller-38851',
  storageBucket: 'el-taller-38851.firebasestorage.app',
  messagingSenderId: '966236098132',
  appId: '1:966236098132:web:014ae2b33a7ff641b9e7c1',
};
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

let fb = null; // { auth, db, ...funciones }
let usuario = null; // { uid, nombre, email }
let listo = false; // ya se sabe si hay alguien conectado (o Firebase no cargó)
let fallo = '';
const avisos = new Set();

export const estadoNube = () => ({ listo, usuario, fallo, disponible: !!fb });
export const alCambiar = (f) => avisos.add(f);
const avisar = () => avisos.forEach((f) => { try { f(estadoNube()); } catch { /* nada */ } });

export async function iniciarNube() {
  try {
    const [app, auth, fs] = await Promise.all([
      import(`${SDK}firebase-app.js`),
      import(`${SDK}firebase-auth.js`),
      import(`${SDK}firebase-firestore.js`),
    ]);
    const a = app.initializeApp(CONFIG);
    fb = { auth: auth.getAuth(a), db: fs.getFirestore(a), authMod: auth, fs };
    fb.auth.languageCode = 'es';
    auth.onAuthStateChanged(fb.auth, (u) => {
      usuario = u ? { uid: u.uid, nombre: u.displayName || '', email: u.email || '' } : null;
      listo = true;
      avisar();
    });
  } catch {
    fallo = 'No se pudo conectar con la nube: por ahora la partida se guarda solo en este navegador.';
    listo = true;
    avisar();
  }
  // Si en 4 segundos no respondió, seguimos sin nube (se avisa cuando conteste)
  setTimeout(() => { if (!listo) { listo = true; avisar(); } }, 4000);
}

// Navegadores de adentro de Instagram, Facebook, etc.: Google no deja entrar desde ahí
export const navegadorDeApp = () => /Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|; wv\)/i.test(navigator.userAgent || '');

export async function entrarConGoogle() {
  if (!fb) return { ok: false, motivo: fallo || 'La nube todavía no cargó. Probá de nuevo en unos segundos.' };
  if (navegadorDeApp()) return { ok: false, motivo: 'Desde el navegador de esta app Google no deja entrar. Abrí el juego en Chrome o Safari (menú ⋮ → "Abrir en el navegador").' };
  try {
    const { GoogleAuthProvider, signInWithPopup } = fb.authMod;
    const prov = new GoogleAuthProvider();
    prov.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(fb.auth, prov);
    return { ok: true };
  } catch (err) {
    const c = err?.code || '';
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return { ok: false, motivo: '' };
    if (c === 'auth/popup-blocked') return { ok: false, motivo: 'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes para este sitio y probá de nuevo.' };
    if (c === 'auth/network-request-failed') return { ok: false, motivo: 'No hay conexión. Probá de nuevo cuando tengas internet.' };
    return { ok: false, motivo: `No se pudo entrar con Google (${c || 'error desconocido'}).` };
  }
}

export async function salir() {
  if (fb) await fb.authMod.signOut(fb.auth);
}

// La partida en la nube: { partida, actualizado } o null
export async function bajarPartida() {
  if (!fb || !usuario) return null;
  const { doc, getDoc } = fb.fs;
  const s = await getDoc(doc(fb.db, 'partidas', usuario.uid));
  if (!s.exists()) return null;
  const d = s.data();
  try {
    return { partida: JSON.parse(d.datos), actualizado: d.actualizado || 0 };
  } catch {
    return null;
  }
}

export async function subirPartida(partida) {
  if (!fb || !usuario || !partida) return false;
  const { doc, setDoc } = fb.fs;
  await setDoc(doc(fb.db, 'partidas', usuario.uid), {
    datos: JSON.stringify(partida),
    actualizado: partida._guardado || Date.now(),
    version: partida.version || 0,
    semana: partida.semana || 0,
    meta: String(partida.meta || ''),
  });
  return true;
}

export async function borrarPartidaNube() {
  if (!fb || !usuario) return;
  const { doc, deleteDoc } = fb.fs;
  await deleteDoc(doc(fb.db, 'partidas', usuario.uid));
}
