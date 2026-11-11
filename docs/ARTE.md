# Guía de arte de El Taller

Todo está preparado para sumar imágenes sin tocar el código del juego. Mientras una imagen no exista, el juego muestra un emoji.

## Cómo sumar una imagen

1. Generá la imagen con la herramienta que quieras (las descripciones de abajo sirven como prompt).
2. Guardala en `assets/img/` con el nombre sugerido.
3. Abrí `js/arte.js` y escribí el nombre del archivo en `archivo` (por ejemplo `tio: { archivo: 'tio.png', ... }`).
4. Subí los cambios a GitHub: en un par de minutos se ve en la web.

## Cómo cambiar los colores

Todos los colores están en `css/tema.css`, con un comentario en cada uno. Se pueden cambiar a mano o reemplazar el archivo entero por uno generado con otra herramienta, siempre que mantenga los mismos nombres de variables (`--fondo`, `--acento`, etc.).

## Estilo general (para todas las imágenes)

- Ilustración plana y cálida, con contornos suaves, tipo historieta argentina moderna. Nada de fotos.
- Fondo transparente (PNG) o color liso claro.
- Personajes con expresiones exageradas y humor; el juego es de barrio, no de oficina.
- Mismo estilo en todas: conviene generar todas las imágenes de personajes en la misma sesión y con la misma descripción de estilo.

Descripción de estilo para copiar al principio de cada prompt:

> Flat cartoon illustration, warm colors, soft outlines, friendly and humorous Argentine neighborhood vibe, simple shapes, transparent background, centered character, no text.

## Lista de imágenes

| Nombre en `arte.js` | Archivo sugerido | Tamaño | Dónde se ve | Descripción |
|---|---|---|---|---|
| `logo` | `logo.png` | 512 × 512 | Pantalla de inicio | Logo de "El Taller": una taza sublimada humeante con una plancha de sublimación detrás. Sin texto (el nombre ya está en la pantalla). |
| `tio` | `tio.png` | 256 × 256, cuadrada | Mensajes del tío y tutorial | Hombre de unos 60 años, bigote canoso, camisa a cuadros arremangada, sonrisa de "yo te lo dije". Mitad mentor, mitad prestamista. |
| `lelo` | `lelo.png` | 256 × 256, cuadrada | Rumores y Lelo como empleado | Joven de unos 19 años, flequillo, sonrisa canchera de costado, buzo con capucha, celular en la mano. Pícaro pero no malo. |
| `chuchu` | `chuchu.png` | 256 × 256, cuadrada | Recomendaciones y mensajes de Chuchu | Hombre de unos 30, gorra de maquinista de tren, pañuelo al cuello, sonrisa enorme, un trencito de juguete en la mano. Personaje original (no basado en ninguna persona real). |
| `operario` | `operario.png` | 256 × 256, cuadrada | Empleados de producción | Persona joven con delantal y guantes térmicos, sosteniendo una taza recién sublimada. |
| `vendedor` | `vendedor.png` | 256 × 256, cuadrada | Empleados de redes y feria | Persona joven con el celular en una mano y una bolsa de compras en la otra, entusiasta. |
| `tazaCeramica` | `taza-ceramica.png` | 256 × 256 | Producción del sábado | Taza blanca de cerámica con un diseño colorido sublimado. |
| `tazaPlastico` | `taza-plastico.png` | 256 × 256 | Producción del sábado | Taza de plástico de colores, tipo infantil, con un dibujo sublimado. |
| `gorra` | `gorra.png` | 256 × 256 | Producción del sábado | Gorra trucker con frente blanco sublimado y red de color atrás. |
| `feria` | `feria.png` | 256 × 256 | (reservada) | Puesto de feria con mantel, tazas y gorras exhibidas. |
| `calendario` | `calendario.png` | 256 × 256 | Avisos de fechas especiales | Hoja de calendario con un moño de regalo. |

Los avatares se muestran en círculo, así que conviene que el personaje esté centrado y con la cara en el medio.

## Próximas imágenes (provincia, en la siguiente versión)

- `traicio`: Traicio Nero, de Talleres Judas. Hombre de unos 35, peinado con gel, campera de cuero, sonrisa falsa y un contrato escondido atrás de la espalda.
- `plancha`: plancha de sublimación 30 × 30.
- `calandra`: calandra industrial para telas.
- `remera`, `camiseta`: productos textiles.
