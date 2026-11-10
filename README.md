# El Taller

Juego web por turnos: simulador de emprendedor de sublimación con humor argentino.
Arrancás con un préstamo de tu tío y una máquina de tazas, competís con tu primo y tenés que llegar a ser el mejor de la ciudad.

**Versión mínima jugable** (sin diseño gráfico):

- Cada semana: primero publicidad en redes, después llegan los pedidos (Lelo te pelea cada uno) y recién ahí producís y entregás.
- Tazas de cerámica y de plástico, y máquina de gorras.
- Préstamo del tío (opción A: todo junto · opción B: cuotas).
- Tutorial de enero y febrero, estacionalidad y fechas especiales.
- Reputación, experiencia, cansancio y curso corto.
- El primo como rival y mazo de eventos balanceado.
- La partida se guarda en el navegador (las cuentas con Firebase llegan en el próximo paso).

## Estructura

- `index.html`, `css/style.css`: pantallas, pensadas para celular.
- `js/data.js`: todos los números del juego (para balancear, se cambia acá).
- `js/engine.js`: reglas del juego, sin pantalla.
- `js/main.js`: pantallas e interacción.
- `js/storage.js`: guardado de la partida.
- `tests/simulacion.js`: juega 400 partidas automáticas y controla el balance (`node tests/simulacion.js`).

Las reglas completas están en el documento de diseño del proyecto.
