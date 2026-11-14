# El Taller

Juego web por turnos: simulador de emprendedor de sublimación con humor argentino.
Arrancás con un préstamo de tu tío y una máquina de tazas, competís con tu primo y tenés que llegar a ser el mejor de la ciudad.

**Versión mínima jugable** (sin diseño gráfico):

- Cada semana: primero publicidad en redes, después llegan los pedidos (Lelo te pelea cada uno) y recién ahí producís y entregás.
- Tazas de cerámica y de plástico, y máquina de gorras.
- Préstamo del tío (opción A: todo junto · opción B: cuotas).
- Tutorial de enero y febrero, estacionalidad y fechas especiales.
- Reputación, experiencia, cansancio (40 h por semana; cansa desde las 25) y cursos cortos.
- Equipo desde la primera semana: operarios y vendedores, con rasgos y sueldos. Se contratan en la bolsa del municipio, por Chuchu o con un anuncio. Capacitaciones para el equipo.
- Al ser el mejor de la ciudad, Lelo se va un mes a Santa Clara del Mar. Cuando vuelve, la abuela te pide que le des trabajo (cada 4 semanas, hasta 4 veces): si aceptás, suma 40 h por semana sin ocupar cupo; cada rechazo baja reputación, experiencia y confianza del tío.
- El primo como rival: rumores, promo de contraataque (falla 1 de cada 10) y clientes que cancelan para irse con él.
- Mazo de eventos por trimestre: cartas de plata, horas, stock y reputación, algunas con decisiones.
- Fechas especiales casi todos los meses (San Valentín, Día de la Mujer, Pascuas, 25 de Mayo, Día del Amigo, CyberMonday y más).
- El tío vuelve a prestar para la próxima máquina, según su confianza (historial de pago y reputación).
- Local chico para tener más de 2 empleados, volantes y servicios especiales (envío y diseño personalizado).
- Experiencia por máquina: en una máquina nueva arrancás con la mitad.
- **Provincia:** pelea contra Traicio Nero (Talleres Judas): sabotajes, robo de empleados, La Voz de Adentro, defensas y persona de seguridad. Plancha 30x30, plancha 1x1 m y calandra; diseñadores (bajan errores y hacen los diseños personalizados de sus máquinas); local grande; tercerización en bloque (todo, el resto o elegir cuáles; 15% de falla); pedidos de empresas con cobro a 30 días; licitaciones de clubes del ascenso; Lelo gerente. Si Traicio te gana, volvés a la ciudad y hay revancha.
- Pantalla: cantidades a producir que se ajustan manteniendo apretado o escribiendo el número, semana animada que no se desplaza sola (oportunidades en amarillo, desastres en rojo) y secciones que se achican con +/−.
- La partida se guarda en el navegador (las cuentas con Firebase llegan en el próximo paso).

## Estructura

- `index.html`, `css/style.css`: pantallas, pensadas para celular.
- `css/tema.css`: todos los colores y medidas del juego (para cambiar el estilo, se toca acá).
- `js/arte.js` y `assets/img/`: imágenes del juego, con emoji de respaldo. La guía para generarlas está en `docs/ARTE.md`.
- `js/data.js`: todos los números del juego (para balancear, se cambia acá).
- `js/engine.js`: reglas del juego, sin pantalla.
- `js/main.js`: pantallas e interacción.
- `js/storage.js`: guardado de la partida.
- `tests/simulacion.js`: juega 400 partidas automáticas y controla el balance de la ciudad.
- `docs/REGLAS.md`: documento de diseño del juego (reglas y números, versión 0.19).
- `tests/provincia.js`: juega 240 partidas de hasta 3 años y controla el balance de la provincia (`npm test` corre las dos).

Las reglas completas están en `docs/REGLAS.md` (copia del documento de diseño del proyecto).
