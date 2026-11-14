# El Taller — Documento de diseño del juego

> Versión 0.19 · Reglas en definición
> Juego web por turnos, para jugar solo, contra bots o online.

---

## 1. Concepto

Simulador de emprendedor de sublimación con humor argentino. Arrancás sin nada y tenés que hacer crecer tu taller desde una máquina de tazas hasta vestir clubes de fútbol de primera división, ser el mejor de Sudamérica, después del mundo y, como cierre loco, del espacio.

- **Tipo:** juego web, por turnos.
- **Modos de juego:** un jugador, contra bots incluidos en el juego (talleres de la competencia) y online contra otras personas.
- **Plataforma:** navegador (publicado en GitHub Pages, en un repositorio propio).
- **Repositorio:** `IMABA1991/el-taller` → `imaba1991.github.io/el-taller`. Más adelante se compra un dominio propio en NIC Argentina y se define el nombre final.
- **Turno:** cada turno equivale a una semana, en dos pasos:
  1. **Domingo: publicidad, feria y estudio.** Se elige todo junto: horas de publicidad, volantes, si vas a la feria y si arrancás un curso. Si el domingo hay una carta del mazo que pide decisión (o la abuela te pide trabajo para Lelo, ver 2.2), se resuelve antes de arrancar.
     - **Publicidad en redes** (Instagram y Marketplace). El jugador elige las horas **sin ver cuánto pide el mercado ni cuántas horas convendrían**: lo aprende jugando y lo tiene que recordar (no hay historial). La semana se ve **animada día por día** (domingo a sábado): pedidos que llegan, me gusta y **clientes que cancelan porque se lo pidieron a Lelo**; con botón "Saltar".
     - **Volantes** (ver 8.4).
     - **Feria:** se vende el **stock que sobró** de semanas anteriores (mesa $10.000, 8 h). Tiene su propio mazo de eventos por pares que a la larga se compensa: vuelto mal dado ↔ propina; permiso extra del municipio ↔ se olvidaron de cobrarte la mesa; se cae una caja y se rompen productos ↔ otro feriante te pasa un cliente; te roban del puesto ↔ te pagan y nunca vienen a retirar; llueve y se levanta a la mitad ↔ un comerciante te compra todo lo que queda. Sale una carta en la mitad de las ferias.
     - **Estudio desde la semana 1:** tres cursos cortos (2 semanas, 5 h por semana, $15.000, +10 puntos, máximo 40, baja 5 por mes): **sublimación** (menos errores), **redes** (cada hora de publicidad atrae más pedidos) y **ventas** (vendés más en la feria).
     - Si se quedó corto: "En el mercado había más pedidos: al menos N quedaron sin atender" (N siempre es 2 menos que lo real; si da 0, "puede que algún cliente no te haya encontrado").
     - Si se pasó: "Tus últimos avisos no tuvieron ni un me gusta".
     - El tío, en el tutorial, sugiere por lo bajo ("con un par de horas me alcanzaba") para que el jugador vaya subiendo solo.
  2. **Sábado: pedidos y producción.** Se ven los pedidos (cliente, producto, cantidad y servicios especiales). Recién ahí **producís** (la producción arranca siempre en 0 y lo que falta se resalta) y **el domingo se entrega**. Podés **rechazar** un pedido a tiempo (−0,1 de reputación por unidad); si lo aceptás y no lo entregás, −0,5 por unidad. La feria vende lo que te sobre de stock.
  - Los mensajes siempre dicen qué producto se arruinó o qué pedido no se entregó, y cuánto afectó la reputación.
  - No se muestra el porcentaje de error: solo "cuanta más experiencia tengas, menos errores vas a cometer".
  - **Merma mensual:** si hay stock guardado, una vez por mes se pierde un producto (gotera, se cayó de la mesa, lo regalaste en un cumpleaños que te olvidaste, el perro, tu vieja se lo regaló a la vecina...). Por eso conviene sacar el sobrante en la feria.
- **Guardado:** con **cuenta de usuario**, en la nube, para seguir la misma partida desde la PC o el celular.
- **Inicio de sesión:** con cuenta de Google o con email y contraseña (las dos opciones).
- **Diseño pensado primero para celular** (pantalla vertical, botones grandes); en la PC funciona igual.
- **Servidor propuesto:** Firebase, plan gratuito Spark (cuentas de usuario + base de datos Firestore). El juego sigue publicado en GitHub Pages; Firebase solo guarda las cuentas y las partidas.

### 1.1 Pantalla

- **Cantidades a producir:** se suben o bajan con + y −; si mantenés apretado el botón, el número sigue corriendo cada vez más rápido. También se puede tocar el número y escribirlo con el teclado. No hay alertas nuevas: valen las validaciones de siempre.
- **Semana animada:** la pantalla queda fija mientras aparecen los eventos; si querés ver los nuevos, deslizás vos.
- **Eventos destacados:** las **oportunidades** (pedidos de empresas, licitaciones que abren, la abuela pidiendo trabajo para Lelo) salen en **amarillo fuerte**; los **desastres** (sabotajes de Traicio, cartas malas grandes del mazo, tercerizaciones que fallan) en **rojo fuerte**.
- **Secciones contraíbles:** cada sección con título tiene un **+/−** en el borde superior derecho para achicarla o mostrarla. El juego recuerda cuáles dejaste cerradas.

---

## 2. Historia inicial

Terminaste el secundario en diciembre y no sabés qué hacer. En las fiestas hablás con tu tío, que conoce el rubro: te cuenta que la sublimación puede ser un buen negocio y que te puede prestar la plata para arrancar. Pero el tío es justo: **le presta lo mismo a tu primo**, que arranca con el mismo negocio. Desde ahí, compiten a medida que crecen.

- **Inicio de la partida:** enero (el tío te da el dinero en enero).

### 2.1 Tutorial (enero y febrero)

- Los primeros 2 meses (8 turnos) son de **entrenamiento y preparación**: aprendés a producir, vender y estudiar el mercado.
- Coincide con la temporada baja de tazas, así que la demanda es baja y los errores cuestan poco.
- Objetivo: llegar a **marzo**, cuando empieza la época fuerte, con algo de experiencia y el mercado estudiado.

| Semana | Qué pasa | Qué aprendés |
|---|---|---|
| 1 | El tío te da la plata: elegís opción A o B y comprás la máquina de tazas e insumos | Préstamo y compras |
| 2 | Hacés tus primeras tazas | Producir y usar las horas |
| 3 | Publicás en Instagram y Marketplace. El tío avisa que se viene **San Valentín** | Vender, repartir horas y fechas especiales |
| 4 | Primer cierre de mes: cuota (si elegiste B) y gastos fijos. Aparece el primo vendiendo en tu ciudad | Pagos del mes y competencia |
| 5 | Primera feria | Canal feria: más ventas, pero cuesta la mesa y horas |
| 6 | Pico de San Valentín. Primera carta del mazo de eventos (un gasto chico de plata) | Fechas especiales y eventos de suerte |
| 7 | Cansancio: si trabajaste al máximo, aparecen errores. Te ofrecen un curso corto | Descanso, experiencia y formación |
| 8 | Tu cumpleaños: el tío te perdona la cuota (B) o te regala una caja de tazas (A). Te muestra el calendario de fechas y te cuenta que, si pagás bien, te vuelve a prestar | Estacionalidad y préstamos. Termina el tutorial |

### 2.2 El primo Lelo (primer rival)

- Se llama **Lelo**.
- **Rumores una semana antes:** si Lelo prepara una campaña agresiva, siempre corre un rumor la semana anterior; a veces el rumor es falsa alarma. En total, el rumor se cumple más o menos 6 de cada 10 veces. Sirve para preparar stock y horas.
- **Diez jugadas agresivas**, cada una con su rumor: volantes con precios de remate, sorteo en Instagram, 2x1 relámpago, nota en la radio del barrio, influencers amigos, combos con regalo, hablar mal de tus tazas, entregas en 24 horas, copiar tus diseños más baratos y poner un puesto en la feria al lado del tuyo. Las ofertas chicas también varían.
- **Promo de contraataque** (solo cuando hay rumor): 15% de descuento en los pedidos de esa semana y 2 horas de trabajo. Si Lelo ataca, no te saca ningún pedido y te llegan un 20% más; si era humo, regalaste el descuento.
  - **Falla 1 de cada 10 veces:** pagás igual el descuento y las horas, no recibís el 20% extra y Lelo te saca clientes como si no la hubieras activado.
  - Sigue siendo una apuesta pareja, con una leve ventaja a favor.
- **Cancelaciones en la semana animada:** cuando Lelo te saca un cliente, el pedido llega y días después el cliente cancela porque se lo pidió a Lelo. El mensaje da una **pista** de la jugada (vio un volante de remate, escuchó a Lelo en la radio, agarró el 2x1...).
  - Salen cuando no activaste la promo o cuando falló ("hiciste la promo, pero igual se fue a lo de Lelo").
  - Con 3 o más cancelaciones el mismo día se agrupan en un solo mensaje.
- Recibe el mismo préstamo y arranca **en tu misma ciudad**: competencia directa, pero **endeble** (le saca poca demanda al jugador).
- **Comportamiento aleatorio** (no lo elige el jugador): según la semana, puede estar
  - **agresivo:** te ataca, baja precios y te saca ventas;
  - **con ofertas:** saca promociones;
  - **tranquilo:** no hace nada especial.
- **Números del primo:**

| Comportamiento | Probabilidad por semana | Demanda que te saca esa semana |
|---|---|---|
| Tranquilo | 50% | 5% |
| Con ofertas | 30% | 15% |
| Agresivo | 20% | 25% |

  - En promedio te saca un 12% de la demanda: molesta, pero no te hunde.
  - Su reputación sube a la mitad de tu ritmo y **nunca pasa de 70**: si jugás mal te puede pasar adelante en la comparación de diciembre, pero no puede ganar la ciudad.
  - Después del giro, si aceptás el pedido de la abuela, entra como **empleado de jerarquía** (no es el primero: podés tener empleados desde el turno 1) y es el más caro. Asciende a medida que crecés (ver 6.2).
- **Cada diciembre**, en las fiestas, el tío compara los resultados de los dos delante de la familia.
- **Giro de la historia:** cuando llegás a ser el mejor de la ciudad aparece un cartel: *"¡Sos el mejor de la ciudad! Lelo se dio cuenta de que no tenía nada que hacer contra tu majestuosidad. Cerró el taller, vendió la máquina de tazas y con la plata se fue un mes a Santa Clara del Mar."*
  - Durante ese mes, en la semana animada se cuelan sus fotos ("Lelo subió una foto con un choclo en la playa de Santa Clara del Mar"). **En ningún momento se dice que va a volver ni que quiere trabajar con vos.** Es tiempo para pensar si querés más empleados.
- **La abuela pide trabajo para Lelo** (cuando Lelo vuelve del viaje):
  - *"Te llamó la abuela: Lelo volvió de Santa Clara del Mar, no consigue trabajo y se le puso a llorar. Te pregunta si le podés dar trabajo en tu taller."* Se aclara que **Lelo no ocupa un lugar en el equipo**. Se contesta el domingo, antes de arrancar la semana.
  - **Frecuencia:** el primer pedido llega cuando Lelo vuelve; si decís que no, la abuela vuelve a pedir **cada 4 semanas (30 días), hasta 4 veces**.
  - **Si aceptás:** Lelo entra como empleado (ver 6.2) y sumás **+7,5 de reputación, de experiencia y de confianza del tío**.
  - **Si rechazás:** *"Lelo entiende. Lelo se va deprimido. Lelo va a seguir buscando un trabajo..."* La abuela se enoja y restás de reputación, experiencia y confianza del tío, el doble cada vez: **2,5 · 5 · 10 · 20** (máximo 20).
  - **Después del cuarto rechazo** la abuela no pide más: *"Lelo, al no conseguir trabajo, canceló su suscripción a la vida."*
- **Barra de control:** con el primer cartel, la barra de Lelo se reemplaza por la de **Traicio Nero** (ver 2.4).
- **Si después perdés la provincia contra Traicio** (ver 2.4): Lelo vuelve a competir en la ciudad (y vuelve su barra), con una excusa según el caso:
  - **Si trabajaba para vos:** *"Lelo vio tu ineptitud para manejar algo grande: renunció y vuelve a intentarlo solo."* Mientras tanto perdés sus horas de trabajo.
  - **Si lo rechazaste las 4 veces:** *"Sorpresa: Lelo fingió su muerte. En realidad estaba escondido en la Patagonia, y ahora volvió a abrir su taller para competirte."*
  - **Si todavía estaba de viaje o la abuela seguía pidiendo:** *"Lelo dejó de buscar trabajo y volvió a abrir su taller para competirte."*
  - Cuando llegás otra vez a 100, Lelo se rinde, se va de nuevo un mes a Santa Clara del Mar y, al volver, la abuela arranca otra vez a pedir desde cero.

### 2.3 Un rival por cada meta

| Meta | Rival |
|---|---|
| Ciudad | Tu primo (misma ciudad, competencia endeble) |
| Provincia | **Traicio Nero**, de **Talleres Judas**: ex empleado de Lelo que se independizó; es el mejor de otra ciudad de tu provincia (ver 2.4) |
| País | Marcas nacionales (nombres paródicos inspirados en marcas reales) |
| Sudamérica | Las grandes marcas deportivas internacionales (nombres paródicos) |

- El modo multijugador online queda para más adelante.

### 2.4 Traicio Nero (rival de la provincia)

- **Nombre:** Traicio Nero ("traicionero"). **Empresa:** Talleres Judas.
- **Estilo:** mucho más agresivo que Lelo, juega a traición: **sabotaje industrial** y competencia feroz. Los golpes son **chicos**: molestan, pero no hunden.
- **Arranque:** como ya es el mejor de otra ciudad, **arranca la provincia con 8 de reputación** (compensa el +7,5 de aceptar a Lelo).
- **Frecuencia:** sabotea cada 3 semanas en promedio (entre 2 y 4).
- **Tamaño de los sabotajes:** proporcional, igual que las cartas del mazo (10%, 20% y 35% de tu ganancia mensual).

| Tamaño | Sabotaje | Qué pasa | Cómo lo enfrentás |
|---|---|---|---|
| Chico | **Reseñas falsas** | Te bajan un poco la reputación | — |
| Chico | **Habla mal de tus productos** | Les dice a los clientes que tus productos son malos: te llegan menos pedidos por unas semanas | — |
| Chico | **Soborno al proveedor** | Te demora los insumos: producís menos esa semana | — |
| Mediano | **Tintura con olor** | Derrama en la puerta de tu local una tintura con olor: las tazas en stock quedan impregnadas | Pagás una limpieza y salvás un porcentaje de las tazas; el resto se pierde |
| Mediano | **Propaganda engañosa** | Publica avisos falsos a tu nombre que se burlan de alguien o discriminan: perdés reputación | Podés desmentirlo gastando horas |
| Mediano | **Entrega trucha a tu nombre** | Entrega productos de mala calidad haciéndose pasar por vos: perdés reputación | — |
| Grande | **Robo de cliente grande** | Se queda con un cliente grande a último momento (incluso uno fijo) | — |
| Aparte | **Robo de empleado** | Le ofrece a uno de tus empleados un **25% más** de lo que cobra hoy | Podés igualar la oferta (ver abajo) |

- **Robo de empleado:** como mucho uno cada 2 meses. El empleado se va en el **50%** de los casos si le pagás debajo de la media del mercado, en el **25%** si le pagás la media y en el **10%** si le pagás más. Los recomendados de Chuchu nunca se van.
- **Media del mercado de sueldos:** se calcula cada mes como un **5-10% por encima** de lo que paga hoy el jugador. Nunca se dice directamente, pero así se mete el contexto inflacionario: si no actualizás sueldos, te roban empleados.
- **50 y 50:** la mitad de los sabotajes se anuncian con un rumor la semana anterior (como con Lelo) y la otra mitad llegan a traición, sin aviso.
- **Defensas (tres gastos separados):**

| Defensa | Costo por mes | Efecto |
|---|---|---|
| **Protección** (cámaras, contratos con proveedores) | $15.000 | Los sabotajes sin aviso salen la mitad de las veces y hacen la mitad del daño. Si dejás de pagar, se corta enseguida |
| **Seguro** | $15.000 | Paga el 50% de las pérdidas de plata y stock por sabotajes (tintura, entrega trucha...) |
| **Persona de seguridad** | $30.000 | Frena 1 de cada 3 sabotajes y te avisa cuando Traicio habla con alguno de tus empleados o le hace una oferta |

- **Persona de seguridad:** trabaja de noche, con el taller cerrado, y **no ocupa lugar** en el equipo. Lo que avisa **siempre es cierto** (no es una suposición), así podés subirle el sueldo al empleado antes de que se vaya. Si le pagás menos que la media del mercado, **Traicio la puede sobornar** (3 de cada 10 sabotajes): no miente, simplemente deja de avisar y de frenar sabotajes. Subirle el sueldo la vuelve a poner de tu lado.
- **Ritmo de Traicio:** su reputación crece un **3-5% más lento que la del jugador** (el porcentaje se sortea al arrancar la provincia), medido sobre lo que ganaste de reputación con tu trabajo en las **últimas 12 semanas** (el bonus de la abuela no cuenta). Las pérdidas por sabotajes no bajan su ritmo. **Piso:** nunca sube menos de 1,4 puntos por semana, así que si te estancás, te alcanza. Cada semana varía un ±15%.
- **Efecto de cada sabotaje:** reseñas falsas −1 de reputación; habla mal −10% de pedidos por 2 semanas; soborno al proveedor −4 h la semana siguiente; tintura: pagás una limpieza (20% de tu ganancia mensual) y perdés el 30% de las tazas guardadas, o las tirás y perdés la mitad; propaganda engañosa: la desmentís (3 h y −1) o la dejás pasar (−2); entrega trucha −2 de reputación; robo de cliente grande: se lleva tu pedido de empresa más grande (y el cliente no vuelve), o un cliente fijo, o si no tenés, −20% de pedidos por 2 semanas.
- **Robo de empleado:** te avisan en el resumen y lo decidís el domingo. Si igualás la oferta, se queda seguro.
- **Barra de Traicio:** su número se calcula todas las semanas, pero la barra **solo se actualiza una vez por mes**, con la nota de **La Voz de Adentro** (ver 5.4). Lo que dice el diario siempre es cierto, aunque sea de hace unas semanas. Cuando Traicio pasa de **85**, sale una nota de alerta ("Talleres Judas está a un paso").
- **Traicio sí puede ganar:** no tiene techo de reputación. Si llega a 100 antes que vos:
  - Perdés el título y **volvés a la meta de la ciudad con 75 de reputación**.
  - **Conservás todo** (máquinas, plata, empleados), pero el **mercado vuelve al tamaño de la ciudad**; los empleados de más te siguen costando el sueldo.
  - **Lelo vuelve a competir** en la ciudad (arranca con 50 de reputación), con la excusa que corresponda (ver 2.2), hasta que llegás de nuevo a 100. Los pedidos de empresas pendientes se cancelan.
  - **Revancha:** al volver a ganar la ciudad, Lelo se va otra vez a Santa Clara del Mar (y al volver la abuela pide de nuevo) y arranca otra vez la provincia, con Traicio en 30.
- **Nombre del taller:** al pasar a la meta de la provincia, el juego te pide **bautizar tu taller** (por ejemplo, "Talleres Iván"). Desde ahí competís como empresa.

---

## 3. El préstamo del tío

- **Monto:** $200.000 (máquina de tazas $150.000 + unos $50.000 de insumos).
- **Corre desde enero**, desde el primer turno del tutorial: las primeras ventas van a pagar el préstamo.
- **Cumpleaños en febrero (opción B):** el tío te perdona la cuota de febrero como regalo (solo en el primer préstamo).
- Al arrancar elegís cómo devolver el préstamo:
  - **Opción A — todo junto:** $240.000 en la semana 52 (20% de interés). Si no llegás, el tío se enoja mucho.
    - **Pago anticipado:** podés pagar antes y el interés se cobra proporcional a las semanas: $200.000 + $40.000 × (semanas / 52). Ej.: en la semana 26 pagás $220.000.
    - **Préstamo más rápido:** al terminar de pagar, el tío ya te puede prestar para la siguiente máquina.
    - **Más confianza:** pagar todo junto y antes suma mucha confianza, y el próximo préstamo es más grande.
  - **Opción B — cuotas:** 12 cuotas de $22.000, una cada 4 turnos (48 semanas). Total $264.000 (32% de interés); con la cuota de febrero perdonada, $242.000.
    - Reparte el pago, pero es más cara, no se puede cancelar antes, y el tío no te vuelve a prestar hasta terminar de pagar.
    - Las cuotas se pagan al cierre de cada mes (el año tiene meses de 4 y 5 semanas: 4-4-5 por trimestre, 52 semanas).
- **Resumen de la elección:** la A es más barata y, si ahorrás bien, la cancelás antes y conseguís el próximo préstamo más rápido. La B no te obliga a juntar mucha plata de golpe, pero sale más cara.
- *A futuro (con inflación):* las cuotas fijas pierden valor con la inflación, lo que le da a la opción B una ventaja propia en etapas posteriores.
- **Evento:** a veces el tío necesita fondos y te pide adelantar la cuota del mes.
  - Si la adelantás, mejora la confianza (+5).
  - Si no podés, el tío se ofende (−15).

### 3.1 Préstamos siguientes

- Una vez que terminás de pagar, el tío **te vuelve a prestar con los mismos términos** (opción A al 20% en un año, con pago anticipado; u opción B en 12 cuotas al 32%) para la **próxima máquina**.
- **Monto máximo:** del **25% al 75%** del precio de la próxima máquina, según la confianza: tope = 25% + 50% × confianza / 100. Podés pedir menos que el tope.

| Máquina | Tope con confianza 0 | Con 50 | Con 100 |
|---|---|---|---|
| Gorras | $37.500 | $75.000 | $112.500 |
| Plancha 30x30 | $225.000 | $450.000 | $675.000 |
| Calandra | $2,5 M | $5 M | $7,5 M |

- Si el préstamo de la opción A venció sin pagar, el tío está enojado y no te presta más.

### 3.2 Confianza del tío (0 a 100)

**Historial de pago (hasta 50 puntos):**

| Hecho | Puntos |
|---|---|
| Al arrancar | 25 |
| Pagar la opción A a tiempo | +10 |
| Pagar la opción A antes | +10, más 1 por cada 2 semanas de adelanto (hasta +25 en total) |
| Cada cuota de la opción B a tiempo | +1 |
| Adelantarle la cuota cuando te la pide | +5 |
| Negarte a adelantarla | −15 |
| Cada mes con cuotas atrasadas | −10 |
| Vencer la opción A sin pagar | −25 |
| Aceptar el pedido de la abuela (darle trabajo a Lelo) | +7,5 |
| Rechazarlo | −2,5 · −5 · −10 · −20 (el doble cada vez) |

**Reputación (hasta 50 puntos):** 25 por cada meta ganada más tu reputación actual dividida 4. Así no cae a 0 cada vez que subís de meta. Si estás debajo de 20 de reputación (sin metas ganadas), resta 10.

- Con la opción B no se puede pagar anticipado, así que ese jugador queda con un techo de confianza más bajo.

---

## 4. Progresión

### 4.1 Máquinas

Tazas → Gorras → Plancha 30x30 → Plancha 1x1 m → Calandra

- **Experiencia por máquina:** al comprar una máquina nueva, vos, Lelo y los empleados arrancan en ella con **la mitad de su experiencia general**. Lo que falta se recupera produciendo en esa máquina, al doble del ritmo normal.

### 4.2 Metas de reputación

1. Mejor de tu ciudad
2. Mejor de la provincia
3. Mejor del país
4. Mejor de Sudamérica
5. Mejor del mundo (por expansión: ver 4.5)
6. Mejor del espacio (misión final secreta: ver 4.6)

### 4.3 Clientes

Los clientes crecen a lo largo del juego: desde gorras para escuelitas de fútbol hasta, con la calandra, vestir a un club de primera división (hito intermedio).

- Usar **nombres de clubes inventados** (evitar marcas reales).
- Las marcas rivales (nacionales e internacionales) usan **nombres y logos paródicos**, nunca los reales.

### 4.4 Subir de nivel

Se sube por **reputación**:
- Los pedidos bien entregados y a tiempo **suman**.
- Los pedidos atrasados o mal hechos **restan**.

**Barra de reputación:** de 0 a 100 en cada meta (ciudad, provincia, país, Sudamérica). Al llegar a 100 sos el mejor de ese ámbito y pasás a la siguiente meta: la barra vuelve a 0, con clientes más grandes y exigentes.

| Suma | Puntos | Resta | Puntos |
|---|---|---|---|
| Pedido bien entregado y a tiempo | +1 | Pedido atrasado | −3 |
| Pedido urgente o grande | +3 | Pedido mal hecho | −5 |
| Cliente que te recomienda | +2 | Pedido no entregado | −10 |

- Ritmo esperado: con unos 4 pedidos por semana, ser el mejor de la ciudad lleva unos 6 meses (26 turnos).
- **Provincia: mucho más lenta.** Ser el mejor de la provincia tiene que llevar **unos 50 turnos** después de ganar la ciudad. Para eso, **cada venta suma un 5% de lo que suma en la ciudad** (se probó con la mitad, pero con el mercado de la provincia se venden 70 a 140 unidades por semana y la meta se ganaba en 8 semanas). Lo que más suma son los pedidos grandes: cada pedido de empresa entregado y cada licitación cumplida suman +3. Los sabotajes de Traicio frenan todavía más.
- **Balance probado con la simulación** (240 partidas de un jugador razonable, v0.19): la provincia se gana en unas 46-47 semanas y se le gana a Traicio de primera unas 7 de cada 10 veces (73%). Sin el arranque de Traicio en 8, aceptar a Lelo (40 h y +7,5) subía las victorias al 90%. Quien gasta todo en máquinas y no paga defensas sufre más sabotajes y pierde más seguido. Queda 1 quiebra en 240 partidas (el jugador de prueba se queda sin caja después de comprar la calandra).

### 4.5 Expansión mundial (después de Sudamérica)

- Al ser el mejor de Sudamérica, el primo pasa a ser **socio comercial externo** y trae nuevos negocios.
- Lo mandás a abrir una **sucursal por región**: Norteamérica, Centroamérica, Europa del Este, Europa del Oeste, Asia Norte, Asia Sur, África Norte y África Sur.
- **Apertura:** cuesta plata (viaje e instalación) y tiene una **probabilidad de éxito**. Si sale mal, el primo vuelve y se puede intentar de nuevo más adelante.
- **Cada sucursal tiene una sola barra de reputación de 0 a 100**: al llegar a 100 es la mejor de esa región. Arranca con demanda baja, como al inicio del juego.
- **La casa matriz sigue generando ingresos**, así que la sucursal puede arrancar con más maquinaria; lo que no se compra es la reputación (salvo con la inversión inicial).
- El primo, como socio, cobra una **comisión del 10% de la ganancia** de cada sucursal que abre (en vez de sueldo).
- **Cada sucursal suma productos nuevos** propios de la región, más rentables.

**Orden de apertura por niveles** (para abrir un nivel hay que tener una sucursal en 100 en el nivel anterior):

| Nivel | Regiones | Costos y precios | Probabilidad base de éxito | Dificultad para vender |
|---|---|---|---|---|
| 1 | Centroamérica, África Norte, África Sur | x1 (como Argentina) | 70% | Normal |
| 2 | Asia Sur, Europa del Este | x2 | 55% | Media |
| 3 | Norteamérica, Europa del Oeste, Asia Norte | x4 | 40% | Alta |

**Inversión inicial al abrir** (a mayor inversión, mayor riesgo y mayor ganancia):

| Inversión | Reputación inicial | Ajuste a la probabilidad de éxito | Si sale mal |
|---|---|---|---|
| Baja | 0 | +10% | Perdés lo invertido (poco) |
| Media | 15 | 0% | Perdés lo invertido |
| Alta | 30 | −10% | Perdés lo invertido (mucho) |

- La formación del jugador y la experiencia del primo suman puntos a la probabilidad de éxito.

**Productos nuevos por región (propuesta):**

| Región | Producto nuevo |
|---|---|
| Centroamérica | Remeras y souvenirs para turismo y resorts |
| África Norte / Sur | Camisetas de clubes y selecciones locales (nombres inventados) |
| Asia Sur | Ropa para eventos y festivales |
| Europa del Este | Uniformes de equipos amateur y empresas |
| Norteamérica | Merchandising de ligas universitarias (nombres inventados) |
| Europa del Oeste | Ropa deportiva técnica de alta gama |
| Asia Norte | Merchandising de eventos y convenciones |

**Condición para ser el mejor del mundo:**
- Tener **al menos 80 de reputación en las 8 regiones**, y
- **mantener 100 en Sudamérica** (la casa matriz) al mismo tiempo.
- Para que "mantener" tenga sentido, la reputación de la casa matriz **baja si la descuidás** (por ejemplo, −1 por semana sin pedidos bien entregados en Sudamérica). Así el jugador tiene que equilibrar la atención entre la matriz y las sucursales.

### 4.6 Misión final secreta: el mejor del espacio

- Al ser el mejor del mundo aparece la noticia: **se descubrió una especie alienígena**, y necesita ropa.
- Última misión: convertirte en el **creador de la moda interplanetaria** fabricando **trajes espaciales**.
- **Cómo se gana:**
  1. Comprar una **máquina especial** (la más cara del juego).
  2. **Enfocar todas tus máquinas** en la misión: mientras producís trajes, la matriz y las sucursales dejan de producir lo habitual, así que bajan los ingresos y la reputación.
  3. Confeccionar los trajes y entregarlos a tiempo y bien hechos.
- La tensión: aguantar con la plata mientras todo está enfocado en los trajes.
- **Plazo:** entre 2 y 3 meses (8 a 12 turnos) para confeccionar los trajes.
- **Pruebas en el camino:** mientras producís, podés probar los trajes para ver si cumplen las especificaciones alienígenas. Cada prueba cuesta horas y plata, y te muestra qué porcentaje de las especificaciones cumplís; con eso corregís.
- La calidad final depende de la máquina especial, la experiencia, la formación y cuánto probaste y corregiste.
- **Entrega:** al vencer el plazo entregás los trajes.
  - Si cumplen las especificaciones → **sos el mejor del espacio y ganás el juego**.
  - Si no cumplen → los alienígenas se enojan y se vengan con la humanidad: **sos el responsable de la extinción humana** (final malo, fin de la partida).
- *A definir:* cantidad de trajes, costo de cada prueba y porcentaje mínimo de especificaciones para aprobar.

---

## 5. Máquinas, productos y números

| Máquina | Precio | Producto | Venta | Costo | Ganancia | Tiempo base (experiencia 0) |
|---|---|---|---|---|---|---|
| Tazas | $150.000 | Taza de plástico | $5.000 | $3.000 | $2.000 | 30 min |
| | | Taza de cerámica | $8.000 | $4.000 | $4.000 | 1 h |
| Gorras | $150.000 | Gorra | $10.000 | $2.000 | $8.000 | 1 h 36 min |
| Plancha 30x30 | $900.000 | Remera | $15.000 | $5.000 | $10.000 | 1 h 36 min |
| | | Manga larga | $20.000 | $6.000 | $14.000 | 2 h 15 min |
| | | Buzo | $50.000 | $10.000 | $40.000 | 2 h (menos demanda) |
| Plancha 1x1 m | $4.000.000 | Los mismos productos en **full color** | x2 | Igual | — | El del producto común + 30 min |
| Calandra | $10.000.000 | Camiseta, pedidos intermedios | $25.000–30.000 | $5.000 | — | Ver combos (5.1) |
| | | Camiseta, club del ascenso | $60.000 | $5.000 | $55.000 | |
| | | Camiseta, club de segunda | $80.000 | $5.000 | $75.000 | |
| | | Camiseta, club de primera | $100.000 | $5.000 | $95.000 | |
| | | Short | 50% de la camiseta | $2.500 | — | La mitad de una camiseta |

**Cómo se definen los tiempos:**
- **Productos comunes** (tazas, gorra, remera, manga larga): el tiempo es proporcional al margen, y cada máquina nueva rinde un **25% más de ganancia por hora** que la anterior (tazas $4.000/h, gorras $5.000/h, plancha 30x30 $6.250/h).
- **Productos de margen alto** (buzo, full color, camisetas): tienen tiempos propios y se equilibran con **menos demanda**, **clientes más exigentes** o la **licitación**. Si se aplicara la regla proporcional, un combo llevaría 6 h y los pedidos de clubes serían imposibles.
- La experiencia baja los tiempos (ver 7.1).

**Notas:**
- **Luz extra por máquina:** gorras +$5.000, plancha 30x30 +$10.000, plancha 1x1 m +$20.000, calandra +$40.000 por mes.
- Las máquinas se pueden comprar en cualquier orden; el préstamo del tío es siempre para la próxima en el orden.
- Con la plancha 1x1 m, el full color **duplica el precio de venta** y mantiene el costo. Cada producto full color tiene el **30% de la demanda** del producto común (es premium).
- Un conjunto (camiseta + short) para un club de primera se vende a $150.000 y cuesta $7.500.

### 5.1 Pedidos de clubes (licitación)

Tres categorías de clubes (nombres inventados). Cada pedido es por **combos** (camiseta + short).

El precio **triplica el costo** (el costo es un tercio del precio).

| Categoría | Precio de referencia por combo | Costo por combo | Combos por pedido | Plazo de entrega | Requisito para participar |
|---|---|---|---|---|---|
| Ascenso | $90.000 | $30.000 | 60 | Alrededor de un mes | Tener calandra |
| Segunda división | $120.000 | $40.000 | 100 | Alrededor de un mes | Calandra + ser el mejor de la provincia |
| Primera división | $150.000 | $50.000 | 200 | Alrededor de un mes | Calandra + diseñador deportivo + ser el mejor del país |

**Tiempo por combo:** 1 h de calandrado + 30 min de corte y costura (dos procesos distintos). Con experiencia baja a 30 min + 15 min. Con el plazo de un mes, a medida que crecés **necesitás sí o sí empleados y experiencia** para cumplir (200 combos al principio son 300 horas).

**Cómo funciona la licitación:**
- Cada tanto un club abre una licitación (ascenso cada ~8 semanas, segunda cada ~12, primera una vez por temporada).
- Vos y 2 o 3 rivales ofrecen un **precio por combo**. Los rivales ofrecen al azar **entre el 90% y el 130% del precio de referencia**: a veces te dejan margen y a veces no.
- **Rivales en la provincia:** Talleres Judas (con la reputación de Traicio y calidad 70) y uno o dos talleres inventados (reputación y calidad al azar entre 40 y 80).
- Gana el puntaje más alto: **precio 40% + reputación 40% + calidad 20%**. El puntaje de precio es 100 × (oferta más baja / tu oferta). Tu **calidad** = (experiencia en la calandra + formación) / 2, +20 si tenés diseñador deportivo.
- **En pantalla los pesos se sugieren, sin porcentajes:** *"Acá pesan mucho el precio que ofrecés y tu reputación; la calidad suma, pero menos"*, junto con tu reputación y tu calidad actuales.
- Se oferta el domingo en que abre y el resultado sale al cerrar esa semana. Mientras tenés un contrato en curso no podés entrar en otro.
- Si ofrecés muy barato, ganás más fácil pero la ganancia es chica; si ofrecés caro, necesitás mucha reputación.
- **Seña:** el club adelanta el **50%**, suficiente para hacer el trabajo **sin poner capital propio** (el costo es un tercio del precio).
- **Entrega:** apenas tenés todos los combos se entregan solos y cobrás el resto. **No existe la entrega tarde:** lo que no está en la fecha cuenta como no entregado.
- **Multa:** por cada combo que no entregues pagás **3 veces su costo**. Cobrás solo lo entregado (si no alcanza para cubrir la seña, devolvés la diferencia). Para no perder plata tenés que entregar al menos el **60%** del pedido. Cumplir suma +3; no completarlo, −10 de reputación.

### 5.2 Tercerización

- **Se habilita recién al ser el mejor de la ciudad.** Antes no aparece: al arranque solo vendés lo que fabricás vos.
- Sirve para **cualquier producto**, aunque no tengas la máquina.
- Deja entre un **5% y un 10% de ganancia**, según el pedido: pagás entre el 90% y el 95% del precio a otro taller.
- No te lleva horas ni stock. Sirve para pedidos de redes y para pedidos de empresas.
- Sirve para no perder pedidos mientras juntás para comprar la máquina.
- **Pedidos de redes: se terceriza en bloque**, no pedido por pedido (cada pedido conserva solo su botón **Rechazar**):
  - **Tercerizar todo:** todos los pedidos aceptados.
  - **Tercerizar el resto:** los pedidos que no cubrís con tu stock y lo que pensás producir (en el orden de entrega). Así complementás lo que hacés vos.
  - **Elegir cuáles:** marcás los pedidos uno por uno y confirmás.
  - **No tercerizar nada:** deshace la tercerización.
- **Puede fallar:** hay **una sola tercerizadora**, y **15% de los pedidos tercerizados salen mal** (vale también para los pedidos de empresas). Si falla, **perdés el pedido completo y el insumo** (no le pagás el trabajo a la tercerizadora) y la reputación baja **0,02 puntos por pedido fallido**. Con esto, tercerizar queda más o menos parejo en plata: sirve sobre todo para no perder reputación.
- *Más adelante:* varias tercerizadoras con distinta calidad y precio.

### 5.3 Mercados nuevos

**Etapa provincia:**

| Cliente | Pedido | Frecuencia | Plazo | Pago |
|---|---|---|---|---|
| Catering | 20 a 30 remeras (indumentaria), a precio de lista | Cada 6 semanas | 2 semanas | A 30 días |
| Colectivos | 40 a 60 unidades (remeras y buzos para choferes, tazas de regalo), con 10% de descuento | Cada trimestre | 3 semanas | A 30 días; a veces se estira a 60 |
| Clubes del ascenso | Licitación (ver 5.1) | Cada ~8 semanas | 1 mes | Seña del 50% |

- **Cómo funciona:** el pedido llega durante la semana animada (en amarillo, como oportunidad) y el sábado lo aceptás o lo rechazás (si no contestás, se va). Lo producís de a poco: se entrega solo cuando tenés todo en stock, después de los pedidos de redes. Si vence y no llegaste: **−10 de reputación** y el cliente no te pide más.
- **Competencia:** si no es cliente fijo, 3 de cada 10 veces la empresa le da el pedido a Talleres Judas.
- **Fidelidad:** con 3 entregas a tiempo, la empresa pasa a ser **cliente fijo** y Traicio no puede pelearla (aunque sí robarla con el sabotaje de cliente grande).
- Cada pedido de empresa suma **+3 de reputación** (pedido grande).
- **Pago a 30 días:** cobrás un mes después de entregar; se pone a prueba la caja.

**Etapa país:**

- **Clubes de barrio** (por localidad): pedidos chicos, sin licitación, por ejemplo 15 a 20 camisetas. Se pueden hacer con la plancha antes de tener la calandra, o tercerizados.
- **Clientes empresa:** salones de belleza (indumentaria), merchandising para empresas grandes, salones de eventos (mantelería, indumentaria). Pedidos grandes y recurrentes, pensados para la plancha de 1x1 m.
- Las marcas rivales del país son **varias a la vez** peleando el mercado (ver 5.4).

### 5.4 Marcas rivales del país (nombres provisorios, se pueden cambiar)

Cada marca pelea un frente distinto:

| Marca | Frente | Ataques | Defensa |
|---|---|---|---|
| **Topa** | Tradición, la de toda la vida | *Campaña nostalgia:* 2 semanas con menos pedidos de remeras y gorras. *Club de clientes:* algún cliente empresa recurrente se puede ir | Calidad: buena formación y pocos errores bajan el efecto |
| **Penalazo** | Clubes | *Remate en licitación:* ofrece muy por debajo del precio de referencia. *Te roba al diseñador deportivo* ofreciéndole más sueldo | Reputación alta; los recomendados de Chuchu nunca se van |
| **Gambeta Sport** | Redes | *Influencers pagos:* tu publicidad rinde menos esa semana. *Sorteo viral:* se queda con algunos pedidos | Curso de redes y promo de contraataque |
| **La Remera Feliz** | Precio | *Liquidación:* 3 semanas con precios muy bajos en productos simples; decidís si igualás (ganás menos) o no (perdés pedidos). *2x1 en remeras* | Diferenciarte: los productos premium (full color, buzos) no los afecta |
| **Estampados del Plata** | Clientes empresa | *Le ofrece precio más bajo a tus clientes empresa:* si no igualás, podés perder uno. *Se lleva los pedidos grandes* (más de 50 unidades) | Entregar siempre a tiempo da fidelidad con cada cliente; tercerizar ayuda a cubrir pedidos grandes |

**Las noticias: "La Voz de Adentro"** (parodia de un diario provincial):
- Anuncia lo que van a hacer las marcas ("Penalazo promete camisetas a precio de remate para la próxima licitación"). En la provincia, publica una vez por mes cómo viene Talleres Judas (ver 2.4).
- Mezclado con **información basura** que no sirve para nada y chismes absurdos: "Chuchu fue visto persiguiendo un tren de carga en bicicleta", "Lelo se casó... aunque después la familia se dio cuenta de que ya estaba casado".
- El jugador tiene que separar lo útil de lo irrelevante.
- **Lo que publica el diario siempre es cierto.** La única duda es **cuándo**: el ataque llega a la semana siguiente, a las 2 o hasta a las 3 semanas. Con experiencia, el jugador aprende a estimar cuándo puede pasar.
- **Cada marca tiene su propio ritmo** (el juego nunca lo dice; el jugador lo descubre jugando): Gambeta Sport es impulsiva y casi siempre ataca a la semana siguiente; Topa es lenta y suele tardar 2 o 3 semanas; Penalazo ataca cuando se abre la próxima licitación; La Remera Feliz y Estampados del Plata son variables (1 a 3 semanas).

---

## 6. Tiempo, edad y cansancio

- **Horas por semana:** **40 horas** de trabajo (antes 60; se revisa en pruebas). Algunas cartas del mazo te dan o te quitan horas esa semana; las horas en que alguien te da una mano no cansan.
- **Empleados desde el turno 1:** cada uno suma horas a su tarea (paga sueldo).
- Cada tarea (producir, vender, comprar insumos, estudiar) **consume horas** y deja una ganancia distinta.
- **Cansancio:** empieza a subir **a partir de las 25 horas** (más o menos el 60-70% del tiempo). Trabajar siempre al máximo aumenta los errores; obliga a descansar o contratar.
- **Edad:** el personaje envejece con los turnos; con los años cambia la probabilidad de errores.

### 6.1 Gastos fijos (desde el primer turno)

Se pagan cada 4 turnos, junto con el mes:

| Gasto | Por mes |
|---|---|
| Luz | $12.000 (sube con cada máquina nueva y con el local) |
| Internet | $10.000 |
| Publicidad en Instagram | $8.000 |
| **Total al inicio** | **$30.000** |

- **Local:** en tu casa entran 2 empleados. Para tener más hay que alquilar un local:

| Lugar | Alquiler por mes | Luz extra | Empleados | Disponible |
|---|---|---|---|---|
| Tu casa | — | — | Hasta 2 | Desde el inicio |
| Local chico | $60.000 | +$8.000 | Hasta 5 | Desde el inicio |
| Local grande | $200.000 | +$20.000 | Hasta 12 | Desde la provincia |

- Lelo y la persona de seguridad no ocupan lugar. Para volver a un lugar más chico, primero hay que achicar el equipo.
- En el tutorial, cuota de $22.000 + gastos de $30.000 = **$52.000 por mes** contra unos $120.000 de ganancia (ver 8.3): quedan unos $68.000 por mes para ahorrar.
- Las ventas de verano del tutorial se ajustan en pruebas para que el arranque se sienta justo.

### 6.2 Empleados

- **Se pueden contratar empleados desde el turno 1.**
- **Lelo no es el primer empleado:** entra solo si aceptás el pedido de la abuela, cuando vuelve de Santa Clara del Mar (ver 2.2), como **empleado de jerarquía**. **No ocupa cupo** en el equipo. Es el más caro y asciende con cada meta:

| Meta lograda | Puesto del primo | Sueldo por mes | Qué aporta |
|---|---|---|---|
| Mejor de la ciudad | Empleado operativo | $40.000 | **+40 horas de producción por semana** (el doble que un operario común). Arranca con **experiencia 60/100** |
| Mejor de la provincia | Gerente de operaciones | $150.000 | **Deja de producir**, pero baja un **20%** los errores de todo el taller y tu cansancio empieza a las **28 horas** en vez de 25 |
| Mejor del país | Gerente comercial | $400.000 | Más demanda y más chances de conseguir clientes grandes |
| Mejor de Sudamérica | Socio comercial externo | % de las ganancias de las sucursales | Abre sucursales en otras regiones (ver 4.5) |

- Si ganás la provincia sin Lelo en el equipo, no hay ascenso; si lo aceptás después, entra directamente como gerente.
- **La experiencia de Lelo baja con el tiempo a la mitad del ritmo** con que baja la del jugador, salvo que lo capacites.

**Tareas que puede hacer un empleado:** producción, ventas (atender redes y publicidad), ir a la feria por vos, repartir volantes (ver 8.4) y servicios especiales (envíos, ver 8.5). Más adelante: persona de seguridad (ver 2.4).

**Cómo se contrata (tres caminos):**

| Camino | Qué sabés del candidato | Sueldo | Particularidad |
|---|---|---|---|
| **Bolsa de trabajo del municipio** | Todo: puesto, experiencia y rasgos, con total claridad | El más caro: cuanta más información, más cobra | Ir a buscar cuesta algunas horas |
| **Recomendado por Chuchu** (ver abajo) | Nada de los rasgos | El más barato | **Confianza alta:** no te traiciona, no se deja sobornar por Traicio y no renuncia. El amigo "siempre tiene un amigo" |
| **Anuncio** | Nada de los rasgos | Lo fijás vos al publicar | A la semana siguiente aparece alguien dispuesto a cobrar ese sueldo. Cuanto más bajo el sueldo ofrecido, más chance de rasgos malos o poca experiencia (y más fácil de sobornar) |

**Chuchu, el amigo que siempre tiene un conocido:** personaje propio (no basado en ninguna persona real). Habla cambiando la "s" por "ch" (y cada tanto se le zafa alguna "s", queda así a propósito) y es fanático de los trenes: todos sus comentarios tienen algo de trenes (por eso le dicen Chuchu). Es el que te recomienda empleados de confianza. Ejemplos:
- "¡Chalú, campeón! Tengo un amigo que trabaja como una locomotora, ¿cheguro que no lo necechitás?"
- "Echte pibe es de fiar: no che baja del tren a mitad de camino."
- "¿Andás con mucho laburo? Ojo que che te va el último tren, eh."

- **Aparece como color, sin afectar el juego:** en la semana animada se cuela cada tanto ("te fuiste a jugar un partido con Chuchu y te tiró esta frase"), dando vueltas, comentando, y recordándote que siempre está disponible si lo llamás.
- **Cuando lo llamás para que te recomiende a alguien:** te da el recomendado y enseguida te cuenta que **justo se va por un mes**, con una excusa distinta cada vez: se va de viaje, se fracturó y está internado, se divorció, se casa, se va de luna de miel, se ganó un viaje en tren por la Patagonia, se fue a un congreso de modelismo ferroviario, se mudó a la casa de la suegra. ("¡Menos mal que me agarraste justo!")
- **Durante ese mes no está disponible:** no podés pedirle otro recomendado ni aparece a jugar a la pelota, pero te manda mensajitos, te llama o te enterás por las noticias de lo que anda haciendo.
- Esto pasa **cada vez** que contratás por medio de Chuchu.

**Demás empleados** (desde el turno 1). Poca variedad: 3 categorías con 3 variantes cada una. Los nombres se pueden cambiar.

**Operarios** — suman horas de producción:

| Variante | Sueldo por mes | Horas extra por semana | Experiencia inicial | Particularidad |
|---|---|---|---|---|
| Aprendiz | $25.000 | +20 | 10 | Errores x1,5, pero aprende rápido |
| Operario | $40.000 | +20 | 30 | Errores normales |
| Técnico | $70.000 | +20 | 60 | Pocos errores; repara máquinas (hace menos probable el evento de máquina rota) |

**Vendedores** — suben la demanda de un producto, pero descuidan otro (el producto fuerte y el descuidado se ven antes de contratarlo):

| Variante | Sueldo por mes | Producto fuerte | Producto descuidado |
|---|---|---|---|
| Junior | $30.000 | +20% | −10% |
| Senior | $50.000 | +35% | −10% |
| Estrella | $60.000 + 5% de comisión | +50% | −15% |

**Diseñadores** — bajan los errores y hacen los diseños personalizados; cada uno está limitado a ciertas máquinas (sectorizados: solo se enfocan en sus máquinas y personalizan sus productos):

| Variante | Sueldo por mes | Máquinas que maneja | Errores | Pedidos con diseño personalizado |
|---|---|---|---|---|
| Básico | $35.000 | Tazas y gorras | Errores de esas máquinas x0,8 | 20% de los pedidos de sus productos |
| Textil | $60.000 | Planchas 30x30 y 1x1 m (remeras, buzos) | Errores x0,6. No es obligatorio, pero sin él los productos de plancha tienen errores x1,5 | 25% |
| Deportivo | $120.000 | Calandra (camisetas y shorts) | Errores x0,4 y +20 de calidad en las licitaciones; obligatorio para clubes de primera | 30% (hoy sin efecto: la calandra solo hace combos de licitación, que no traen diseño personalizado) |

- Los diseñadores **no producen**, ocupan lugar en el equipo y se consiguen desde la provincia (bolsa, Chuchu o anuncio).
- **Diseños personalizados:** cada diseñador dedica **20 horas por semana** a los diseños personalizados de sus productos (el +50% de tiempo de esas unidades, ver 8.5). Si no le alcanzan las horas, el resto lo hacés vos. Sin diseñador de esa máquina, los pedidos personalizados siguen siendo el 10% y los hacés vos.

**Rasgo al azar (el popurrí):** cada empleado viene con un rasgo, visible al contratarlo:

| Rasgo | Efecto |
|---|---|
| Prolijo | −50% de errores |
| Rápido | Produce un 20% más en las mismas horas |
| Creativo | +1 de reputación extra cada 10 pedidos, pero es un 10% más lento |
| Distraído | +50% de errores |
| Faltador | Falta 1 semana de cada 10 |
| Quejoso | Pide aumento cada 6 meses; si no se lo das, baja su rendimiento |

- **Cuántos empleados podés tener:** depende del lugar donde trabajás (ver 6.1), no de la meta.

### 6.3 Capacitaciones

| Tipo | Costo | Efecto |
|---|---|---|
| **Curso personal** (los tres cursos del domingo) | $15.000 y 5 h por semana, 2 semanas | +10 para vos |
| **Curso para el equipo** | Más caro; les saca horas a los empleados esa semana | Mucho más efectivo (por ejemplo, +15 a cada uno) |
| **Capacitás vos al equipo** | Un mínimo de tus horas, un pequeño gasto (un buffet para compartir) y **productos del stock** que se usan para enseñar: **una unidad de más o menos el 60-70% de los tipos de producto que tengas en stock** (con 5 tipos, una unidad de 3 o 4 de ellos; mínimo una) | Mantenés tu nivel, pero la influencia sobre el equipo es mucho menor (por ejemplo, +5 a cada uno) y no puede pasar tu propio nivel |

- La experiencia de los empleados baja con el tiempo si no se capacitan; Lelo baja a la mitad de ese ritmo.

| Tipo (versión jugable) | Costo | Efecto |
|---|---|---|
| Curso para el equipo | $10.000 por empleado y les saca 5 h esa semana | +15 de experiencia a cada uno |
| Capacitás vos | 4 h tuyas, $3.000 de buffet y una unidad del 65% de los tipos que tengas en stock (mínimo una) | +5 a cada uno, sin pasar tu experiencia |
| Sin capacitación en el mes | — | −4 de experiencia por mes (Lelo, −2) |

### 6.4 Cómo quedó programado el equipo (etapa ciudad)

- **Horas:** 40 por semana para vos; el cansancio sube 1,2 por hora pasadas las 25 y baja 1,5 por hora debajo de 25.
- **Operario:** 20 h de producción por semana. Hace primero lo que le entra; lo que sobra lo hacés vos. Después hace los envíos a domicilio con las horas que le quedan. Aprendiz $25.000 (exp 10, errores x1,5, aprende el doble), operario $40.000 (exp 30), técnico $70.000 (exp 60, errores x0,7).
- **Vendedor:** 15 h de redes por semana (cuentan como más publicidad, según su experiencia), puede ir a la feria por vos (usa 8 de sus horas) y repartir los volantes (usa 6).
- **Rasgos:** prolijo (errores ÷2), rápido (+20% de horas), creativo (+0,1 de reputación por unidad o pedido, −10% de horas), distraído (errores +50%), faltador (falta ~1 semana de cada 10, con excusa), quejoso (pide +15% cada seis meses; si no se lo das, rinde 80%).
- **Contratación:** bolsa (3 h del domingo, 3 candidatos a la vista, +20% sobre la media); Chuchu (−20%, rasgo oculto hasta la primera semana, nunca se va, y él se va 4 semanas con una excusa); anuncio ($5.000, fijás el sueldo, llega el domingo siguiente: con más sueldo que la media viene con más experiencia y menos rasgos malos).
- **Media del mercado:** arranca en la tabla de sueldos y cada mes sube a lo que pagás vos más un 5-10% (nunca baja).
- **Sueldos:** se pagan al cierre de mes, proporcionales a las semanas trabajadas. Despedir cuesta medio sueldo más lo trabajado. A Lelo no se lo puede despedir.
- **Lugar:** 2 empleados en tu casa o 5 en el local chico. Lelo, si aceptás el pedido de la abuela (operario, experiencia 60, 40 h, $40.000), no ocupa lugar.
- **Diseñadores:** quedan para la provincia (plancha y calandra).

---

## 7. Experiencia y formación

### 7.1 Experiencia (0 a 100)

- Se gana **haciendo**.
- Reduce el tiempo de cada tarea y los errores.
- Ejemplo: al inicio una taza de cerámica lleva 1 h; con 30-40 puntos baja a unos 26 minutos.
- Cada punto reduce un poco los tiempos, con un piso mínimo (nunca llegan a cero).
- Reduce el riesgo de que un cliente no pague.
- **Por máquina:** en una máquina nueva arrancás con la mitad de tu experiencia (ver 4.1).

### 7.2 Formación (0 a 100)

- Se gana **estudiando** (cuesta plata y horas por semana).
- Combina con la experiencia: con mucha experiencia pero poca formación seguís siendo lento en tareas complejas (por ejemplo, la calandra) y te cuesta conseguir clientes grandes.
- Profesionalizarse (administración, contratación, empleados calificados) mejora la reputación y la ganancia.

**Dos partes:**

| Parte | Puntos | Cómo se obtiene | ¿Se pierde? |
|---|---|---|---|
| Estudios fijos | Hasta 60/100 | Terciario, licenciatura, diseño, administración (duran meses) | No, es un piso permanente |
| Actualización | Hasta 40/100 | Cursos cortos que llevan horas en la semana | Sí, baja **5 puntos por mes**, de forma progresiva |

---

## 8. Ventas

| Canal | Disponibilidad | Costo | Notas |
|---|---|---|---|
| Feria | Desde el inicio | $10.000 la mesa | Trae más ventas; consume horas |
| Instagram | Desde el inicio | Gratis | Consume horas |
| Facebook Marketplace | Desde el inicio | Gratis | Muy usado; consume horas |
| Mercado Libre | Desde el inicio | — | Sin reputación ni experiencia casi no vende |
| Web propia | Más adelante | Inversión fuerte | Para etapas avanzadas |

- Vender consume horas, así que el jugador reparte su tiempo entre producir y vender.

### 8.1 Demanda inicial (reputación baja)

| Canal | Ventas al inicio |
|---|---|
| Instagram | 2 a 4 tazas por semana |
| Facebook Marketplace | 2 a 4 tazas por semana |
| Feria | 5 a 8 por día que vayas (máximo 1 feria por semana, consume 8 horas) |
| Mercado Libre | Casi nada (vende en serio desde 50 de reputación) |

- **Regla de balance:** el límite al inicio es cuánto podés vender, no cuánto podés producir.
- La demanda **crece de forma progresiva con la reputación** (y varía con la temporada).

### 8.2 Cómo crece la demanda con la reputación (escalonado)

| Tramo de reputación | Aumento cada 10 puntos | Multiplicador al final del tramo |
|---|---|---|
| 0 a 50 | +10% | x1,5 |
| 50 a 75 | +25% | x2,125 |
| 75 a 100 | +50% | x3,375 |

- Al principio cuesta que te conozcan; con nombre, el boca a boca acelera.
- **Cada producto tiene su propia demanda base y crece distinto con la reputación** (ver 8.3).
- **Cada meta tiene su propio tamaño de mercado:** la provincia tiene el **doble** de pedidos posibles que la ciudad (el país y Sudamérica, a definir). **La provincia arranca donde terminó la ciudad** (x3,4) y con 100 de reputación llega al doble (x6,75); así la demanda no cae al cambiar de meta. Al subir de meta, el mercado crece; si Traicio te gana la provincia, el mercado **vuelve al tamaño de la ciudad** (única forma de que la demanda baje).

### 8.3 Demanda por producto (propuesta, a ajustar en pruebas)

**Demanda semanal** = base del producto × efecto de la reputación × temporada × fecha especial.

| Producto | Base por semana* | Crece con la reputación | Temporada |
|---|---|---|---|
| Taza cerámica | 5 | Alta (hasta x3,4) | Invierno x1,5 · verano x0,7 |
| Taza plástico | 3 | Baja (hasta x2) | Pareja todo el año |
| Gorra | 3 | Media (hasta x2,7) | Verano x1,6 · invierno x0,5 |
| Remera | 5 | Alta | Verano x1,5 · invierno x0,6 |
| Manga larga | 2 | Media | Otoño y primavera x1,3 |
| Buzo | 1 | Alta | Invierno x2 · verano x0,3 |
| Camisetas | No hay venta semanal | Por pedidos de clubes | Según la meta |

\* Con reputación 0 en tu ciudad, por redes y Marketplace. La feria suma aparte.

- **Cuenta del tutorial (verano):** tazas por redes ≈ $20.000 por semana + una feria ≈ $10.000 neto (descontada la mesa) = **unos $30.000 por semana, $120.000 por mes**.
- Descontando cuota y gastos fijos quedan unos $68.000 por mes: la máquina de gorras ($150.000) se puede comprar alrededor de marzo o abril (o antes, con el segundo préstamo del tío).

### 8.4 Volantería

- Imprimís volantes por **$5.000** y vos o un vendedor dedica **6 horas** a repartirlos por el barrio.
- La demanda sube un **15%** esa semana y un **7%** la siguiente.
- Si coincide con los volantes de remate de Lelo, el efecto de los suyos baja a la mitad.

### 8.5 Servicios especiales

Algunos clientes los piden al hacer el pedido; si no te conviene, lo rechazás como cualquier otro.

| Servicio | Cuántos lo piden | Precio | Costo en tiempo | Extra |
|---|---|---|---|---|
| **Envío a domicilio** | ~15% de los pedidos | +10% | 1 h por envío, de un operario con horas libres (si no, tuya) | +0,5 de reputación al entregarlo |
| **Diseño personalizado** | ~10% de los pedidos; con el diseñador de esa máquina, 20% (básico), 25% (textil) o 30% (deportivo) | +20% | +50% del tiempo de esas unidades: lo hace el diseñador de esa máquina con sus 20 h por semana; lo que no le entra (o si no hay diseñador), vos | — |

---

## 9. Estacionalidad

| Producto | Temporada fuerte |
|---|---|
| Gorras | Verano |
| Remeras | Verano y eventos |
| Tazas | Invierno |
| Buzos | Invierno |

- Los multiplicadores de temporada por producto están en la sección 8.3.

**Fechas especiales (calendario argentino):** casi una por mes. Los turnos van de domingo a domingo y el pico es el turno que **termina el día de la fecha**. Se anuncian **3 semanas antes**, sin números ("se viene el Día del Padre, la gente busca regalos"), y la demanda extra sube de forma exponencial: 1/8, 1/4, 1/2 y todo el efecto en el pico. Después vuelve a lo normal. Si dos fechas coinciden, los efectos se multiplican.

| Mes | Fecha | Efecto |
|---|---|---|
| Febrero | San Valentín (14/2) | Tazas de cerámica x2. Se usa en el tutorial para enseñar las fechas |
| Marzo | Día de la Mujer (8/3) | Tazas de cerámica x1,5 |
| Marzo | Inicio de clases | Encargos de buzos de egresados x2 |
| Abril | Pascuas | Tazas x1,5 |
| Mayo | 25 de Mayo | Gorras y tazas "patrias" x1,5 |
| Junio | Día del Padre | Tazas x2, gorras x1,5 |
| Julio | Día del Amigo (20/7) | Tazas x2 |
| Agosto | Día del Niño | Tazas de plástico x2 |
| Septiembre | Día del Estudiante | Remeras y buzos x1,5 |
| Octubre | Día de la Madre | Tazas x2 |
| Noviembre | CyberMonday | Todo x1,5, **solo si te sumás bajando los precios un 15%** esa semana (no tiene rampa; no se suma con la promo de contraataque) |
| Diciembre | Fin de clases y Navidad | Tazas y remeras x2 |

---

## 10. Eventos aleatorios

### 10.1 Problemas de producción

- Te llegan remeras sucias.
- Talle equivocado.
- Demora del proveedor.
- Negociación o renegociación con el cliente.

Cada evento puede convertirse en una decisión (por ejemplo: reclamar y perder una semana, arreglarlo vos gastando horas, o entregar igual y arriesgar reputación).

### 10.2 Pedido urgente de la mamá

Una mamá necesita tazas (o buzos) para el grupo de egresados de sus chicos, para esta misma semana. No tiene la plata ahora: la va a juntar cuando termine el evento.

- **Si aceptás:** ponés los insumos con tu plata y horas extra (más cansancio).
- **Riesgo de impago:** depende de la experiencia.
  - Poca experiencia → más riesgo (sos más confiado).
  - Mucha experiencia → menos riesgo (sabés a quién fiarle).
- **Pedir seña:**
  - Con poca experiencia, la mamá puede negarse y llevarse el pedido a otro lado.
  - Con mucha experiencia, acepta.
- *Propuesta:* si sale bien, ganás reputación y recomendaciones; con experiencia alta aparecen pistas sobre el cliente (por ejemplo, "ya le quedó debiendo a otro").

### 10.3 Eventos de suerte (mazo balanceado)

Eventos esporádicos de gastos inoportunos y ganancias oportunas que, **sumados, siempre dan el mismo resultado**.

- **Cómo funciona:** cada trimestre se arma un mazo de **6 cartas**: **3 pares de tipos distintos**, uno chico, uno mediano y uno grande. Cada par tiene una carta mala y una buena del mismo tipo y tamaño. Sale una carta cada 2 o 3 semanas.
- **Al menos 2 cartas por mazo te hacen elegir.** La suerte se compensa, pero lo que decidís, no.
- **Resultado:** al final del trimestre la suerte suma cero, pero el **orden** cambia todo: un gasto justo antes de la cuota puede complicarte aunque después llegue la ganancia.
- **Escala:** los montos son un porcentaje de la ganancia mensual del jugador (promedio de los últimos 3 meses, con un piso), así los eventos siguen pesando cuando el taller crece.
- **Tutorial:** la carta de la semana 6 es la mala chica de plata; su par bueno sale más adelante en el trimestre.
- Las cartas malas grandes se muestran en rojo fuerte, como desastre (ver 1.1).

**Tamaños:**

| Tipo | Chica | Mediana | Grande |
|---|---|---|---|
| Plata | 10% de la ganancia mensual | 20% | 35% |
| Horas (esa semana) | 4 h | 8 h | 16 h |
| Stock | Unidades por el valor del 10% | 20% | 35% |
| Reputación | 1 punto | 2 | 4 |

- Las horas buenas son de alguien que te da una mano: no te cansan. Si una carta mala de stock te encuentra sin stock, se arruinan insumos.

**Las 24 cartas** (⚖ = te hace elegir):

| Tipo | Tamaño | Mala | Buena |
|---|---|---|---|
| Plata | Chica | El proveedor aumentó sin avisar | Encontraste plata en una campera vieja |
| Plata | Mediana | Multa del municipio | Pedido para un cumpleaños de 15 ⚖ |
| Plata | Grande | Se quemó la resistencia ⚖ | Un cliente te pagó una deuda vieja |
| Horas | Chica | Trámite en el banco | Tu vieja te ordena el taller |
| Horas | Mediana | Corte de luz | Tu vieja te da una mano |
| Horas | Grande | Te agarró gripe ⚖ | Tu hermano vino de visita y te ayudó dos días |
| Stock | Chica | Se te cayó una caja | El proveedor te mandó de más |
| Stock | Mediana | Lote de insumos fallados ⚖ | Insumos de regalo |
| Stock | Grande | Gotera sobre las cajas | Un taller que cierra te deja insumos |
| Reputación | Chica | Reseña mala | Reseña de 5 estrellas |
| Reputación | Mediana | Cliente quejoso en redes ⚖ | Te recomendó un influencer local |
| Reputación | Grande | Una taza tuya desteñida se hizo viral | Saliste en la radio del barrio |

**Decisiones** (se eligen el domingo siguiente, antes de arrancar la semana):

| Carta | Opción 1 | Opción 2 |
|---|---|---|
| Se quemó la resistencia | Técnico: pagás el monto completo | La arreglás vos: 40% en repuestos y 6 h; 1 de cada 3 veces no queda bien y pagás el técnico igual |
| Cumpleaños de 15 | Aceptar: cobrás el monto, pero perdés 6 h y sube el cansancio | Rechazar: no pasa nada |
| Gripe | Trabajar igual: +30 de cansancio | Reposo: perdés 16 h |
| Lote fallado | Reclamar: te lo cambian, pero perdés 4 h | Usarlo: 1 de cada 2 veces, −2 de reputación |
| Cliente quejoso | Contestarle: 2 h y −1 de reputación | Ignorarlo: −2 de reputación |

---

## 11. Pendiente de definir

- [x] Empleados: primo y demás empleados definidos (6.2); se ajustan en pruebas.
- [ ] Expansión mundial: montos de inversión y números de los productos por región.
- [ ] Misión espacial: precio de la máquina especial, cantidad de trajes y plazo.
- [x] Monto exacto del préstamo inicial y frecuencia de cuotas.
- [x] Ventaja de la opción A del préstamo.
- [x] Préstamos siguientes y confianza del tío (3.1 y 3.2).
- [x] Tiempos de manga larga, productos full color, camisetas y shorts (5).
- [x] Demanda por producto y por canal de venta (propuesta cargada; se ajusta en pruebas).
- [x] Cómo se mide la reputación y los umbrales de cada meta.
- [x] Cantidad de unidades y plazos de los pedidos de clubes (licitación, 5.1).
- [ ] Inflación y otros eventos argentinos (para una etapa posterior, paso 3 o 4).
- [x] El primo: demanda que saca, comportamientos, límite de reputación, cancelaciones y falla de la promo.
- [x] Rival de la provincia: Traicio Nero, de Talleres Judas, con sabotajes por tamaño, frecuencia, defensas y barra mensual (2.4).
- [x] Clientes nuevos de la provincia (5.3).
- [x] Licitaciones: seña del 50% y multa de 3 veces el costo por combo no entregado.
- [x] Rivales del país: cinco marcas con su frente, ataques, defensa y ritmo; noticias en "La Voz de Adentro" (5.4).
- [ ] Rivales de Sudamérica: nombres paródicos y comportamiento.
- [x] Contratación: bolsa del municipio, recomendado por Chuchu y anuncio (6.2).
- [x] Lugar de trabajo: casa, local chico y local grande (6.1).
- [ ] Tamaño del mercado del país y de Sudamérica.
- [ ] Clubes de barrio y clientes empresa del país: precios, cantidades y frecuencia.
- [x] Tutorial: qué pasa en cada semana.
- [ ] Ajuste fino de las ventas de verano (en pruebas).
- [x] Mazo de eventos: 24 cartas, tamaños y decisiones (10.3).
- [x] Fechas especiales: casi una por mes (9).
- [x] El primo como empleado: sueldo, experiencia y viaje de un mes antes de entrar.
- [x] Empleados por tarea en la ciudad, volantería y servicios especiales (6.4, 8.4 y 8.5).
- [x] Capacitaciones del equipo: números cargados (6.3); se ajustan jugando.
- [x] Probar 40 h por semana y cansancio desde 25 h con la simulación: con los cambios de la v0.17, la ciudad sale en ~23-24 semanas, con el primer empleado hacia la semana 15-17.
- [x] Provincia programada y probada con la simulación (v0.18): ~50 semanas, 7 de cada 10 le ganan a Traicio de primera.
- [x] La abuela pide trabajo para Lelo: frecuencia, bonus, castigos y cierre (2.2).
- [x] Tercerización en bloque con falla del 15% (5.2).
- [x] Diseñadores: diseños personalizados por máquina y más pedidos personalizados (6.2 y 8.5).
- [x] Pantalla: cantidades, semana animada fija, colores de eventos y secciones contraíbles (1.1).
- [x] Rebalanceo de la provincia (v0.19): Traicio arranca con 8; ~73% de victorias de primera en ~46-47 semanas.
- [ ] Varias tercerizadoras con distinta calidad y precio.
- [ ] Darle uso al 30% del diseñador deportivo (por ejemplo, pedidos de camisetas con diseño propio en el país).
- [ ] Modo online: cantidad de jugadores, duración de la partida.

---

## 12. Plan de desarrollo (sugerido)

1. Terminar de definir las reglas en este documento.
2. Versión mínima jugable: un jugador, tazas y gorras, horas por semana, préstamo del tío, tutorial y el primo como rival simple. **Sin diseño gráfico**: pantallas simples de botones, números y textos, pensadas para celular, con cuentas de usuario y guardado en la nube.
3. Sumar máquinas, formación, eventos y estacionalidad.
4. Agregar los rivales de provincia, país y Sudamérica.
5. Agregar modo online.
6. Arte y gráficos.

**Estado del juego publicado (v0.19):** se juegan la ciudad y la provincia completas: Traicio con su ritmo (arranca con 8), sabotajes, robo de empleados y La Voz de Adentro; defensas y persona de seguridad; plancha 30x30, plancha 1x1 m y calandra; diseñadores con diseños personalizados; local grande; tercerización en bloque con falla del 15%; pedidos de empresas con cobro a 30 días; licitaciones del ascenso; la abuela pidiendo trabajo para Lelo (Lelo con 40 h, sin ocupar cupo) y Lelo gerente; perder la provincia y la revancha. En la pantalla: cantidades que se ajustan manteniendo apretado o escribiendo, semana animada fija con oportunidades en amarillo y desastres en rojo, y secciones contraíbles. Lo siguiente es la etapa del país.
