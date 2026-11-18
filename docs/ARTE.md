# Guía de arte de El Taller

**Estilo elegido (v0.21):** caricatura plana para todo el juego (personajes, productos, íconos), y **solo la escena del taller en isométrico**, como una maqueta que se va llenando a medida que crecés.

Mientras una imagen no exista, el juego muestra un emoji (o el dibujo hecho en código). No hace falta tenerlas todas para empezar: cada imagen que se suma reemplaza a su emoji.

## Cómo sumar una imagen

1. Generá la imagen con Gemini usando la descripción de estilo y la de la imagen (abajo).
2. Guardala en `assets/img/` con el nombre de archivo de la tabla, en PNG con fondo transparente.
3. Pasala por [squoosh.app](https://squoosh.app) (o similar) para achicarla: que pese menos de lo que dice la tabla.
4. En `js/arte.js`, escribí el nombre del archivo en `archivo` (por ejemplo `tio: { archivo: 'tio.png', ... }`).
5. Subí los cambios a GitHub: en un par de minutos se ve en la web.

Las piezas isométricas del taller no van en `arte.js`: cuando estén todas (o casi), se arma la escena nueva en `js/escena.js` usando esos archivos. Hasta entonces sigue la escena dibujada en código.

## Cómo lograr que salgan parejas

- Generá todas las de un mismo grupo **en la misma conversación de Gemini**.
- Pegá siempre la **descripción de estilo** completa al principio de cada pedido, igual, sin cambiarle palabras.
- Con la primera que te guste, pedile a Gemini: "usá esta imagen como referencia de estilo para todas las que siguen".
- Pedí **una sola cosa por imagen**, centrada, sin texto ni letras.
- Si una sale distinta, no la arregles: descartala y pedila de nuevo.

## Parte 1 · Caricatura plana (personajes, productos e íconos)

**Descripción de estilo** (pegarla al principio de cada pedido):

> Ilustración vectorial plana estilo caricatura, colores vivos y planos, contornos suaves sin línea negra gruesa, sombras simples de un solo tono, personajes cabezones y expresivos con humor de barrio argentino, un solo elemento centrado, fondo transparente, sin texto ni letras.

Los avatares se ven en círculo: el personaje tiene que estar centrado, con la cara en el medio. Tamaño: 512 × 512 (el juego lo achica). Peso: menos de 60 KB.

### Personajes

| Nombre en `arte.js` | Archivo | Descripción |
|---|---|---|
| `tio` | `tio.png` | Hombre de unos 60 años, bigote canoso, camisa a cuadros arremangada, sonrisa de "yo te lo dije". Mitad mentor, mitad prestamista. |
| `lelo` | `lelo.png` | Joven de unos 19 años, flequillo, sonrisa canchera de costado, buzo con capucha, celular en la mano. Pícaro pero no malo. |
| `chuchu` | `chuchu.png` | Hombre de unos 30, gorra de maquinista de tren, pañuelo al cuello, sonrisa enorme, un trencito de juguete en la mano. Personaje original, no basado en ninguna persona real. |
| `abuela` | `abuela.png` | Abuela argentina de unos 80, rodete canoso, anteojos en la punta de la nariz, delantal de cocina, cara de reproche cariñoso, teléfono de línea en la mano. |
| `traicio` | `traicio.png` | Traicio Nero, de Talleres Judas: hombre de unos 35, pelo con mucho gel, campera de cuero, sonrisa falsa, un fósforo encendido escondido atrás de la espalda. |
| `operario` | `operario.png` | Persona joven con delantal y guantes térmicos, sosteniendo una taza recién sublimada. |
| `vendedor` | `vendedor.png` | Persona joven con el celular en una mano y una bolsa de compras en la otra, entusiasta. |
| `disenador` | `disenador.png` | Persona joven con tableta gráfica y lápiz, auriculares al cuello, remera estampada. |
| `costurero` | `costurero.png` | Persona con cinta métrica al cuello, alfileres en la manga, tijera en la mano. |
| `bordador` | `bordador.png` | Persona sosteniendo un bastidor redondo con un escudo de club a medio bordar. |
| `rrhh` | `rrhh.png` | Persona de camisa con una carpeta de legajos bajo el brazo y una taza de café, cara de "a ver, contame". |
| `encargado` | `encargado.png` | Persona detrás de un mostrador con un llavero enorme, chaleco de comercio, sonrisa de vendedor. |

### Productos

| Nombre | Archivo | Descripción |
|---|---|---|
| `tazaCeramica` | `taza-ceramica.png` | Taza blanca de cerámica con un diseño colorido sublimado. |
| `tazaPlastico` | `taza-plastico.png` | Taza de plástico de colores, tipo infantil, con un dibujo sublimado. |
| `gorra` | `gorra.png` | Gorra trucker con frente blanco estampado y red de color atrás. |
| `remera` | `remera.png` | Remera blanca con un estampado simple en el pecho. |
| `mangaLarga` | `manga-larga.png` | Remera de manga larga gris con estampado. |
| `buzo` | `buzo.png` | Buzo con capucha y un estampado grande. |
| `remeraFC`, `mangaLargaFC`, `buzoFC` | `remera-fc.png`, etc. | Las mismas prendas, pero con un estampado a todo color que cubre toda la tela. |
| `combo` | `combo.png` | Camiseta de fútbol y short de un club inventado, doblados juntos. |
| `camisetaBarrio` | `camiseta-barrio.png` | Camiseta de fútbol sencilla de club de barrio. |
| `camisetaEscudo` | `camiseta-escudo.png` | Camiseta de fútbol con un escudo bordado en el pecho. |
| `gorraBordada`, `remeraBordada`, `chombaBordada` | `gorra-bordada.png`, etc. | Gorra, remera y chomba con un logo bordado (se ven los hilos en relieve). |
| `mantel` | `mantel.png` | Mantel doblado con un estampado colorido a todo color. |

### Íconos y logos de ficción

| Nombre | Archivo | Descripción |
|---|---|---|
| `logo` | `logo.png` | Logo de "El Taller": una taza sublimada humeante con una plancha de sublimación detrás. Sin texto. |
| `calendario` | `calendario.png` | Hoja de calendario con un moño de regalo. |
| `infoarg` | `infoarg.png` | Ícono de portal de noticias: un diario doblado con un rayo. Sin letras. |
| `topa` | `topa.png` | Logo de ficción de "Topa": una zapatilla clásica antigua con una pátina de "de toda la vida". Nada parecido a logos reales. |
| `niko` | `niko.png` | Logo de ficción de "Niko": una pipa de fumar bien dibujada, de madera. |
| `ardidos` | `ardidos.png` | Logo de ficción de "Ardidos": tres llamitas en fila. Sin tiras ni rayas paralelas. |

## Parte 2 · Isométrico (solo la escena del taller)

**Descripción de estilo** (pegarla al principio de cada pedido):

> Ilustración isométrica a 30 grados, estilo maqueta de juguete con colores planos y cálidos, luz desde arriba a la izquierda, sombras suaves de un tono, contornos suaves, vista desde la esquina inferior izquierda, un solo objeto centrado y aislado, fondo transparente, sin texto ni letras.

Siempre el **mismo ángulo** (la esquina que mira hacia vos abajo a la izquierda). Si Gemini lo cambia, descartala.

### Lugares (vacíos: las máquinas y la gente se ponen arriba)

Tamaño 1024 × 768. Peso: menos de 150 KB. Piso en forma de rombo, dos paredes al fondo, sin muebles en el centro.

| Archivo | Descripción |
|---|---|
| `iso-casa.png` | Tu pieza: piso de madera, una cama chica contra la pared, ventana con sol, póster de una pelota. |
| `iso-local-chico.png` | Local chico: piso de baldosas, vidriera con toldo a rayas, estantes vacíos en la pared. |
| `iso-local-grande.png` | Local grande: el doble de ancho, dos ventanas, estanterías altas. |
| `iso-galpon.png` | Galpón: paredes de chapa, techo con cabriadas, línea amarilla de seguridad en el piso. |
| `iso-planta.png` | Planta industrial pequeña: ventanales altos, piso gris con líneas de seguridad amarillas y negras, una chimenea afuera. |

### Máquinas, gente y cosas (mismo ángulo, sueltas)

Tamaño 512 × 512. Peso: menos de 60 KB. Todas a la misma escala (una persona mide más o menos lo mismo que la calandra de alto).

| Archivo | Descripción |
|---|---|
| `iso-tazas.png` | Prensa de tazas sobre una mesita, con palanca roja. |
| `iso-gorras.png` | Prensa de gorras con plato curvo. |
| `iso-plancha30.png` | Plancha de sublimación chica, de 30 × 30. |
| `iso-plancha1m.png` | Plancha de sublimación grande, de 1 × 1 metro. |
| `iso-calandra.png` | Calandra industrial con un rodillo grande y tela saliendo. |
| `iso-costura.png` | Estación de costura: mesa con máquina de coser industrial. |
| `iso-bordado.png` | Bordadora industrial con bastidor. |
| `iso-vos.png` | Vos: joven con delantal, de pie, trabajando. |
| `iso-lelo.png` | Lelo de pie, con el celular. |
| `iso-empleado-1.png`, `iso-empleado-2.png`, `iso-empleado-3.png` | Tres empleados distintos de pie, trabajando (delantal, gorra, guantes). |
| `iso-cajas.png` | Pila de cajas de cartón con mercadería. |

## Cómo cambiar los colores

Todos los colores están en `css/tema.css`, con un comentario en cada uno. Se pueden cambiar a mano o reemplazar el archivo entero por uno generado con otra herramienta, siempre que mantenga los mismos nombres de variables (`--fondo`, `--acento`, etc.).
