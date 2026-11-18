// Catálogo de imágenes del juego.
// Mientras una imagen no tenga archivo, se muestra su emoji. Para sumar arte:
//   1. Guardá la imagen en assets/img/ (ver docs/ARTE.md: tamaños y descripciones).
//   2. Escribí el nombre del archivo en "archivo" acá abajo.
export const IMAGENES = {
  logo: { archivo: 'logo.png', emoji: '☕', texto: 'El Taller' },
  tio: { archivo: 'tio.png', emoji: '🧔', texto: 'El tío' },
  tioCuerpo: { archivo: 'tio-cuerpo.png', emoji: '🧔', texto: 'El tío' },
  lelo: { archivo: 'lelo.png', emoji: '😏', texto: 'Lelo, tu primo' },
  leloCuerpo: { archivo: 'lelo-cuerpo.png', emoji: '😏', texto: 'Lelo, tu primo' },
  chuchu: { archivo: 'chuchu.png', emoji: '🚂', texto: 'Chuchu' },
  operario: { archivo: 'operario.png', emoji: '👷', texto: 'Operario' },
  vendedor: { archivo: 'vendedor.png', emoji: '🧑‍💼', texto: 'Vendedor' },
  tazaCeramica: { archivo: 'taza-ceramica.png', emoji: '☕', texto: 'Taza de cerámica' },
  tazaPlastico: { archivo: 'taza-plastico.png', emoji: '🥤', texto: 'Taza de plástico' },
  gorra: { archivo: 'gorra.png', emoji: '🧢', texto: 'Gorra' },
  feria: { archivo: '', emoji: '🛍️', texto: 'Feria' },
  calendario: { archivo: 'calendario.png', emoji: '📅', texto: 'Fecha especial' },
  disenador: { archivo: 'disenador.png', emoji: '🎨', texto: 'Diseñador' },
  costurero: { archivo: 'costurero.png', emoji: '🧵', texto: 'Costurero' },
  bordador: { archivo: 'bordador.png', emoji: '🪡', texto: 'Bordador' },
  rrhh: { archivo: 'rrhh.png', emoji: '🗂️', texto: 'Recursos Humanos' },
  encargado: { archivo: 'encargado.png', emoji: '🏪', texto: 'Encargado de local' },
  infoarg: { archivo: 'infoarg.png', emoji: '📰', texto: 'InfoArg' },
  abuela: { archivo: 'abuela.png', emoji: '👵', texto: 'La abuela' },
  traicio: { archivo: 'traicio.png', emoji: '🗡️', texto: 'Traicio Nero' },
  topa: { archivo: 'topa.png', emoji: '👟', texto: 'Topa' },
  niko: { archivo: 'niko.png', emoji: '🪈', texto: 'Niko' },
  ardidos: { archivo: 'ardidos.png', emoji: '🔥', texto: 'Ardidos' },
  remera: { archivo: 'remera.png', emoji: '👕', texto: 'Remera' },
  mangaLarga: { archivo: 'manga-larga.png', emoji: '👚', texto: 'Manga larga' },
  buzo: { archivo: 'buzo.png', emoji: '🧥', texto: 'Buzo' },
  remeraFC: { archivo: 'remera-fc.png', emoji: '👕', texto: 'Remera full color' },
  mangaLargaFC: { archivo: 'manga-larga-fc.png', emoji: '👚', texto: 'Manga larga full color' },
  buzoFC: { archivo: 'buzo-fc.png', emoji: '🧥', texto: 'Buzo full color' },
  combo: { archivo: 'combo.png', emoji: '⚽', texto: 'Combo de club' },
  camisetaBarrio: { archivo: 'camiseta-barrio.png', emoji: '🎽', texto: 'Camiseta de club de barrio' },
  camisetaEscudo: { archivo: 'camiseta-escudo.png', emoji: '🎽', texto: 'Camiseta con escudo bordado' },
  gorraBordada: { archivo: 'gorra-bordada.png', emoji: '🧢', texto: 'Gorra bordada' },
  remeraBordada: { archivo: 'remera-bordada.png', emoji: '👕', texto: 'Remera bordada' },
  chombaBordada: { archivo: 'chomba-bordada.png', emoji: '👔', texto: 'Chomba bordada' },
  mantel: { archivo: 'mantel.png', emoji: '🧺', texto: 'Mantel' },
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
