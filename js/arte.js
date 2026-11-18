// Catálogo de imágenes del juego.
// Mientras una imagen no tenga archivo, se muestra su emoji. Para sumar arte:
//   1. Guardá la imagen en assets/img/ (ver docs/ARTE.md: tamaños y descripciones).
//   2. Escribí el nombre del archivo en "archivo" acá abajo.
export const IMAGENES = {
  logo: { archivo: '', emoji: '☕', texto: 'El Taller' },
  tio: { archivo: 'tio.png', emoji: '🧔', texto: 'El tío' },
  tioCuerpo: { archivo: 'tio-cuerpo.png', emoji: '🧔', texto: 'El tío' },
  lelo: { archivo: 'lelo.png', emoji: '😏', texto: 'Lelo, tu primo' },
  leloCuerpo: { archivo: 'lelo-cuerpo.png', emoji: '😏', texto: 'Lelo, tu primo' },
  chuchu: { archivo: '', emoji: '🚂', texto: 'Chuchu' },
  operario: { archivo: '', emoji: '👷', texto: 'Operario' },
  vendedor: { archivo: '', emoji: '🧑‍💼', texto: 'Vendedor' },
  tazaCeramica: { archivo: '', emoji: '☕', texto: 'Taza de cerámica' },
  tazaPlastico: { archivo: '', emoji: '🥤', texto: 'Taza de plástico' },
  gorra: { archivo: '', emoji: '🧢', texto: 'Gorra' },
  feria: { archivo: '', emoji: '🛍️', texto: 'Feria' },
  calendario: { archivo: '', emoji: '📅', texto: 'Fecha especial' },
  disenador: { archivo: '', emoji: '🎨', texto: 'Diseñador' },
  costurero: { archivo: '', emoji: '🧵', texto: 'Costurero' },
  bordador: { archivo: '', emoji: '🪡', texto: 'Bordador' },
  rrhh: { archivo: '', emoji: '🗂️', texto: 'Recursos Humanos' },
  encargado: { archivo: '', emoji: '🏪', texto: 'Encargado de local' },
  infoarg: { archivo: '', emoji: '📰', texto: 'InfoArg' },
  abuela: { archivo: '', emoji: '👵', texto: 'La abuela' },
  traicio: { archivo: '', emoji: '🗡️', texto: 'Traicio Nero' },
  topa: { archivo: '', emoji: '👟', texto: 'Topa' },
  niko: { archivo: '', emoji: '🪈', texto: 'Niko' },
  ardidos: { archivo: '', emoji: '🔥', texto: 'Ardidos' },
  remera: { archivo: '', emoji: '👕', texto: 'Remera' },
  mangaLarga: { archivo: '', emoji: '👚', texto: 'Manga larga' },
  buzo: { archivo: '', emoji: '🧥', texto: 'Buzo' },
  remeraFC: { archivo: '', emoji: '👕', texto: 'Remera full color' },
  mangaLargaFC: { archivo: '', emoji: '👚', texto: 'Manga larga full color' },
  buzoFC: { archivo: '', emoji: '🧥', texto: 'Buzo full color' },
  combo: { archivo: '', emoji: '⚽', texto: 'Combo de club' },
  camisetaBarrio: { archivo: '', emoji: '🎽', texto: 'Camiseta de club de barrio' },
  camisetaEscudo: { archivo: '', emoji: '🎽', texto: 'Camiseta con escudo bordado' },
  gorraBordada: { archivo: '', emoji: '🧢', texto: 'Gorra bordada' },
  remeraBordada: { archivo: '', emoji: '👕', texto: 'Remera bordada' },
  chombaBordada: { archivo: '', emoji: '👔', texto: 'Chomba bordada' },
  mantel: { archivo: '', emoji: '🧺', texto: 'Mantel' },
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
