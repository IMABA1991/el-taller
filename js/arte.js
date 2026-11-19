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
  operario: { archivo: 'operario.png', emoji: '👷', texto: 'Operario', genero: 'hombre' },
  vendedor: { archivo: 'vendedor.png', emoji: '🧑‍💼', texto: 'Vendedor', genero: 'hombre' },
  tazaCeramica: { archivo: 'taza-ceramica.png', emoji: '☕', texto: 'Taza de cerámica' },
  tazaPlastico: { archivo: 'taza-plastico.png', emoji: '🥤', texto: 'Taza de plástico' },
  gorra: { archivo: 'gorra.png', emoji: '🧢', texto: 'Gorra' },
  feria: { archivo: 'feria.png', emoji: '🛍️', texto: 'Feria' },
  calendario: { archivo: 'calendario.png', emoji: '📅', texto: 'Fecha especial' },
  disenador: { archivo: 'disenador.png', emoji: '🎨', texto: 'Diseñador', genero: 'hombre' },
  costurero: { archivo: 'costurero.png', emoji: '🧵', texto: 'Costurero', genero: 'mujer' },
  bordador: { archivo: 'bordador.png', emoji: '🪡', texto: 'Bordador', genero: 'mujer' },
  rrhh: { archivo: 'rrhh.png', emoji: '🗂️', texto: 'Recursos Humanos', genero: 'hombre' },
  encargado: { archivo: 'encargado.png', emoji: '🏪', texto: 'Encargado de local', genero: 'hombre' },
  // La otra versión de cada puesto (hombre o mujer). Mientras no tenga archivo, se muestra su emoji.
  operarioMujer: { archivo: 'operario-mujer.png', emoji: '👩‍🏭', texto: 'Operaria' },
  vendedorMujer: { archivo: 'vendedor-mujer.png', emoji: '👩‍💼', texto: 'Vendedora' },
  disenadorMujer: { archivo: 'disenador-mujer.png', emoji: '👩‍🎨', texto: 'Diseñadora' },
  rrhhMujer: { archivo: 'rrhh-mujer.png', emoji: '👩‍💼', texto: 'Recursos Humanos' },
  encargadoMujer: { archivo: 'encargado-mujer.png', emoji: '👩‍💼', texto: 'Encargada de local' },
  costureroHombre: { archivo: 'costurero-hombre.png', emoji: '🧑‍🔧', texto: 'Costurero' },
  bordadorHombre: { archivo: 'bordador-hombre.png', emoji: '🧑‍🎨', texto: 'Bordador' },
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
// genero ('hombre' o 'mujer'): si la imagen del puesto es del otro, usa su otra versión (o su emoji).
export function imagen(nombre, clase = 'avatar', genero = null) {
  const base = IMAGENES[nombre];
  const otra = base?.genero && genero && genero !== base.genero ? `${nombre}${genero === 'mujer' ? 'Mujer' : 'Hombre'}` : null;
  const im = otra && IMAGENES[otra] ? IMAGENES[otra] : base;
  if (!im) return '';
  const contenido = im.archivo
    ? `<img src="${CARPETA}${im.archivo}" alt="${im.texto}" loading="lazy">`
    : `<span role="img" aria-label="${im.texto}">${im.emoji}</span>`;
  return `<span class="${clase}">${contenido}</span>`;
}
