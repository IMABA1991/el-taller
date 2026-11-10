// Guardado de la partida. Por ahora en el navegador (localStorage).
// En el próximo paso se reemplaza por Firebase (cuenta de usuario) sin tocar el resto del juego.
const CLAVE = 'elTaller.partida.v1';

export function guardar(partida) {
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
