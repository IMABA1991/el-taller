// Catálogo de imágenes del juego.
// Mientras una imagen no tenga archivo, se muestra su emoji. Para sumar arte:
//   1. Guardá la imagen en assets/img/ (ver docs/ARTE.md: tamaños y descripciones).
//   2. Escribí el nombre del archivo en "archivo" acá abajo.
export const IMAGENES = {
  logo: { archivo: '', emoji: '☕', texto: 'El Taller' },
  tio: { archivo: '', emoji: '🧔', texto: 'El tío' },
  lelo: { archivo: '', emoji: '😏', texto: 'Lelo, tu primo' },
  chuchu: { archivo: '', emoji: '🚂', texto: 'Chuchu' },
  operario: { archivo: '', emoji: '👷', texto: 'Operario' },
  vendedor: { archivo: '', emoji: '🧑‍💼', texto: 'Vendedor' },
  tazaCeramica: { archivo: '', emoji: '☕', texto: 'Taza de cerámica' },
  tazaPlastico: { archivo: '', emoji: '🥤', texto: 'Taza de plástico' },
  gorra: { archivo: '', emoji: '🧢', texto: 'Gorra' },
  feria: { archivo: '', emoji: '🛍️', texto: 'Feria' },
  calendario: { archivo: '', emoji: '📅', texto: 'Fecha especial' },
};

const CARPETA = 'assets/img/';

// Devuelve el HTML de la imagen (o su emoji). clase: 'avatar' (redonda) o 'logo'.
export function imagen(nombre, clase = 'avatar') {
  const im = IMAGENES[nombre];
  if (!im) return '';
  const contenido = im.archivo
    ? `<img src="${CARPETA}${im.archivo}" alt="${im.texto}" loading="lazy">`
    : `<span role="img" aria-label="${im.texto}">${im.emoji}</span>`;
  return `<span class="${clase}">${contenido}</span>`;
}
