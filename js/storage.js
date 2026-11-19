// Guardado de la partida en el navegador (localStorage). Si hay cuenta de Google, main.js además la sube a la nube (nube.js).
// _guardado: cuándo se guardó por última vez (sirve para saber qué copia es la más nueva).
const CLAVE = 'elTaller.partida.v1';

export function guardar(partida, { marcar = true } = {}) {
  if (marcar && partida) partida._guardado = Date.now();
  try {
    localStorage.setItem(CLAVE, JSON.stringify(partida));
    return true;
  } catch {
    return false;
  }
}

export function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function borrar() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento disponible */
  }
}
