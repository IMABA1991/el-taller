// Datos del juego "El Taller" — valores tomados del documento de reglas (v0.8).
// Todo lo que se quiera balancear se cambia acá, sin tocar el motor.

export const HORAS_POR_SEMANA = 40;
// El cansancio empieza a subir desde acá (por hora de más) y baja si trabajás menos.
export const CANSANCIO = { umbral: 25, sube: 1.2, baja: 1.5 };
export const SEMANAS_POR_ANIO = 52;

// Meses con patrón 4-4-5 (52 semanas). Los pagos se hacen al cierre de cada mes.
export const MESES = [
  { nombre: 'Enero', semanas: 4, estacion: 'verano' },
  { nombre: 'Febrero', semanas: 4, estacion: 'verano' },
  { nombre: 'Marzo', semanas: 5, estacion: 'otoño' },
  { nombre: 'Abril', semanas: 4, estacion: 'otoño' },
  { nombre: 'Mayo', semanas: 4, estacion: 'otoño' },
  { nombre: 'Junio', semanas: 5, estacion: 'invierno' },
  { nombre: 'Julio', semanas: 4, estacion: 'invierno' },
  { nombre: 'Agosto', semanas: 4, estacion: 'invierno' },
  { nombre: 'Septiembre', semanas: 5, estacion: 'primavera' },
  { nombre: 'Octubre', semanas: 4, estacion: 'primavera' },
  { nombre: 'Noviembre', semanas: 4, estacion: 'primavera' },
  { nombre: 'Diciembre', semanas: 5, estacion: 'verano' },
];

export const MAQUINAS = {
  tazas: { nombre: 'Máquina de tazas', precio: 150000, luzExtra: 0 },
  gorras: { nombre: 'Máquina de gorras', precio: 150000, luzExtra: 5000 },
};

// sens = cuánto aprovecha el producto el multiplicador de reputación (1 alta, 0.7 media, 0.4 baja).
export const PRODUCTOS = {
  tazaCeramica: {
    nombre: 'Taza de cerámica', corto: 'Taza cerámica', singular: 'taza de cerámica', plural: 'tazas de cerámica', maquina: 'tazas',
    precio: 8000, costo: 4000, horas: 1, base: 5, sens: 1,
    temporada: { verano: 0.7, invierno: 1.5 },
  },
  tazaPlastico: {
    nombre: 'Taza de plástico', corto: 'Taza plástico', singular: 'taza de plástico', plural: 'tazas de plástico', maquina: 'tazas',
    precio: 5000, costo: 3000, horas: 1, base: 3, sens: 0.4,
    temporada: {},
  },
  gorra: {
    nombre: 'Gorra', corto: 'Gorra', singular: 'gorra', plural: 'gorras', maquina: 'gorras',
    precio: 10000, costo: 2000, horas: 1.5, base: 3, sens: 0.7,
    temporada: { verano: 1.6, invierno: 0.5 },
  },
};

// Fechas especiales. Los turnos van de domingo a domingo: el pico es el turno que termina el día
// de la fecha (mes 0-11, semana del mes 1-based). Se anuncian 3 semanas antes y la demanda extra
// sube de forma exponencial: 1/8, 1/4, 1/2 y todo el efecto en el pico. Después vuelve a lo normal.
export const FECHAS_ESPECIALES = [
  { mes: 5, semana: 3, nombre: 'el Día del Padre', efecto: { tazaCeramica: 2, tazaPlastico: 2, gorra: 1.5 } },
  { mes: 7, semana: 3, nombre: 'el Día del Niño', efecto: { tazaPlastico: 2 } },
  { mes: 9, semana: 3, nombre: 'el Día de la Madre', efecto: { tazaCeramica: 2, tazaPlastico: 2 } },
  { mes: 11, semana: 4, nombre: 'Navidad', efecto: { tazaCeramica: 2, tazaPlastico: 2 } },
];
export const RAMPA_FECHA = { 3: 1 / 8, 2: 1 / 4, 1: 1 / 2, 0: 1 }; // semanas que faltan → parte del efecto

export const PRESTAMO = {
  monto: 200000,
  A: { total: 240000, interes: 40000, semanaVence: 52 },
  B: { cuota: 22000, cuotas: 12, mesPerdonado: 1 }, // mes 1 = febrero (0-based)
};

export const GASTOS_FIJOS = { luz: 12000, internet: 10000, publicidad: 8000 };

export const VENTAS = {
  horasPorVentaRedes: 0.5, // horas de publicidad (publicar y responder) por cada producto que te piden
  feria: { horas: 8, costoMesa: 10000, min: 5, max: 8 },
  reputacionMercadoLibre: 50, // desde acá Mercado Libre suma demanda
  extraMercadoLibre: 0.25,
};

export const REPUTACION = {
  porVenta: 0.2, // ~5 ventas = 1 pedido bien entregado (+1)
  porPedidoNoEntregado: -0.5, // por unidad
  porPedidoRechazado: -0.1, // por unidad: avisar a tiempo que no llegás cuesta poco
  porPedidoMalHecho: -1.25,
  meta: 100,
};

export const PRIMO = {
  nombre: 'Lelo',
  comportamientos: [
    { id: 'tranquilo', prob: 0.5, saca: 0.05, texto: 'Lelo anda tranquilo esta semana.' },
    { id: 'ofertas', prob: 0.3, saca: 0.15 },
    { id: 'agresivo', prob: 0.2, saca: 0.25 },
  ],
  // Ofertas chicas (sin rumor previo)
  ofertas: [
    'Lelo sacó un 2x1 en tazas. Algunos clientes se fueron con él.',
    'Lelo publicó "envío gratis en el barrio" y te sacó algunos pedidos.',
    'Lelo regaló un llavero con cada compra. Algunos clientes picaron.',
  ],
  // Diez jugadas agresivas: cada una tiene su rumor (una semana antes) y su texto cuando pasa.
  jugadas: [
    { rumor: 'dicen que Lelo está imprimiendo volantes con precios de remate.', ataque: 'Lelo repartió volantes con precios de remate por todo el barrio.' },
    { rumor: 'Lelo anda anunciando "un sorteo bomba" en Instagram.', ataque: 'Lelo hizo un sorteo en Instagram: "seguime y compartí". Medio barrio lo compartió.' },
    { rumor: 'te contaron que Lelo prepara un 2x1 relámpago.', ataque: 'Lelo lanzó un 2x1 relámpago de 48 horas.' },
    { rumor: 'Lelo consiguió que lo entrevisten en la radio del barrio.', ataque: 'Lelo salió en la radio del barrio contando "su emprendimiento".' },
    { rumor: 'Lelo está hablando con unos influencers amigos.', ataque: 'Tres influencers amigos de Lelo lo recomendaron en sus historias.' },
    { rumor: 'Lelo está armando combos con regalo incluido.', ataque: 'Lelo sacó combos "taza + llavero + bombón" a precio de taza sola.' },
    { rumor: 'tu tía dice que Lelo anda hablando mal de tus tazas.', ataque: 'Lelo le dijo a tus clientes que tus tazas se despintan en el lavavajillas.' },
    { rumor: 'Lelo anda prometiendo entregas en 24 horas.', ataque: 'Lelo promete "pedido hoy, taza mañana" y la gente le cree.' },
    { rumor: 'te parece que Lelo te está copiando los diseños...', ataque: 'Lelo copió tus diseños más vendidos y los ofrece más baratos.' },
    { rumor: 'Lelo averiguó cuánto sale una mesa en la feria.', ataque: 'Lelo puso un puesto en la feria justo al lado del tuyo, con precios más bajos.' },
  ],
  repMax: 70,
  // Rumor una semana antes: siempre aparece si Lelo prepara una jugada agresiva,
  // y a veces aparece aunque no la haga (falsa alarma). Así puede o no ejecutarse (~60%).
  rumor: { probFalsaAlarma: 0.15 },
};

// Defensa ante un rumor: promo de contraataque en redes.
// El costo es el descuento (escala solo con el tamaño del taller). Si Lelo ataca, conviene;
// si era falsa alarma, regalaste el descuento.
export const CLIENTES = [
  'Marta', 'Don Rubén', 'la profe de Lengua', 'el kiosco de la esquina', 'Sofi', 'la peluquería del barrio',
  'Nacho', 'la abuela Chela', 'un grupo de egresados', 'la veterinaria', 'Caro', 'el club del barrio',
  'Juanma', 'la panadería', 'Vicky', 'el gimnasio', 'Tobías', 'la escuelita de fútbol',
];

export const PROMO = { descuento: 0.15, extraDemanda: 0.2, horas: 2 };

// Cursos cortos: 2 semanas, 5 horas por semana, $15.000. Suman puntos de actualización
// (cada uno hasta 40) que bajan 5 por mes.
export const CURSOS = {
  sublimacion: { nombre: 'Sublimación', efecto: 'menos errores en la prensa', costo: 15000, horasPorSemana: 5, semanas: 2, puntos: 10 },
  redes: { nombre: 'Redes', efecto: 'cada hora de publicidad atrae más pedidos', costo: 15000, horasPorSemana: 5, semanas: 2, puntos: 10 },
  ventas: { nombre: 'Ventas', efecto: 'vendés más en la feria', costo: 15000, horasPorSemana: 5, semanas: 2, puntos: 10 },
};
export const CURSO_MAX_PUNTOS = 40;
export const CURSO_BAJA_POR_MES = 5;

// Mazo de la feria: pares de eventos (uno malo y uno bueno de valor parecido), mezclados.
// Cuando se termina, se arma de nuevo. En cada feria sale una carta con esta probabilidad:
export const PROB_CARTA_FERIA = 0.5;
export const MAZO_FERIA = [
  [
    { tipo: 'mala', efecto: 'plata', monto: -5000, texto: 'Diste mal un vuelto y perdiste $5.000.' },
    { tipo: 'buena', efecto: 'plata', monto: 5000, texto: 'Un turista te dejó $5.000 de propina.' },
  ],
  [
    { tipo: 'mala', efecto: 'plata', monto: -10000, texto: 'El municipio pasó a cobrar un permiso extra: $10.000.' },
    { tipo: 'buena', efecto: 'plata', monto: 10000, texto: 'Se olvidaron de cobrarte la mesa: te ahorraste $10.000.' },
  ],
  [
    { tipo: 'mala', efecto: 'rotos', unidades: 2, texto: 'Se te cayó una caja del puesto: se rompieron {n}.' },
    { tipo: 'buena', efecto: 'extra', unidades: 2, texto: 'Otro feriante te pasó un cliente: te compró {n} más.' },
  ],
  [
    { tipo: 'mala', efecto: 'robo', unidades: 2, texto: 'Mientras atendías, te robaron {n} del puesto.' },
    { tipo: 'buena', efecto: 'sinRetirar', unidades: 2, texto: 'Te pagaron {n} y nunca vinieron a retirarlas: cobraste y siguen en tu stock.' },
  ],
  [
    { tipo: 'mala', efecto: 'lluvia', texto: 'Se largó a llover y la feria se levantó a la mitad: vendiste la mitad.' },
    { tipo: 'buena', efecto: 'todo', texto: 'Un comerciante pasó al final y te compró todo lo que te quedaba.' },
  ],
];

// Merma mensual del stock guardado ({u} = la unidad, por ejemplo "una taza de cerámica").
export const MERMA = [
  'Hubo una gotera donde guardás los productos y se arruinó {u}.',
  'Dejaste la producción arriba de la mesa, se cayó {u} y se rompió.',
  'Te olvidaste de un cumpleaños y saliste del paso regalando {u}.',
  'Tu hermanito agarró {u} para tomar la leche y no apareció más.',
  'El perro tiró la caja y se rompió {u}.',
  'Tu vieja le regaló {u} a la vecina sin avisarte.',
];

export const MAZO = {
  // Valores de cada par (gasto y ganancia del mismo monto), como fracción de la base mensual.
  pares: [0.1, 0.15, 0.2],
  baseMinima: 80000,
  malas: [
    'Se quemó la resistencia de la máquina. Hubo que cambiarla.',
    'Te labraron una multa en la feria por ocupar de más.',
    'Corte de luz: perdiste insumos que estaban en la prensa.',
    'El proveedor aumentó sin avisar y tuviste que pagar la diferencia.',
    'Se te cayó una caja de tazas. Todas rotas.',
    'Se te rompió el celular y tuviste que comprar otro para atender los mensajes.',
  ],
  buenas: [
    'Un influencer local subió tu taza a sus historias. Llovieron pedidos.',
    'La empresa de un vecino te encargó regalos para sus empleados.',
    'Encontraste insumos en oferta y te ahorraste una buena plata.',
    'Un cliente te pagó una deuda vieja que ya dabas por perdida.',
    'Te encargaron los souvenirs para un cumpleaños de 15.',
    'Ganaste un sorteo de la feria: te devolvieron las mesas del mes.',
  ],
};

// ---------- Equipo ----------
// Puestos de la etapa ciudad. Cada empleado trabaja 20 h por semana en su tarea.
export const PUESTOS = {
  operario: {
    nombre: 'Operario', tarea: 'producción', horas: 20,
    variantes: {
      aprendiz: { nombre: 'Aprendiz', sueldo: 25000, exp: 10, errores: 1.5, aprende: 2 },
      operario: { nombre: 'Operario', sueldo: 40000, exp: 30, errores: 1, aprende: 1 },
      tecnico: { nombre: 'Técnico', sueldo: 70000, exp: 60, errores: 0.7, aprende: 1 },
    },
    rasgos: ['prolijo', 'rapido', 'creativo', 'distraido', 'faltador', 'quejoso'],
  },
  vendedor: {
    nombre: 'Vendedor', tarea: 'redes y feria', horas: 15,
    variantes: {
      junior: { nombre: 'Junior', sueldo: 30000, exp: 10, fuerte: 0.2, descuidado: 0.1 },
      senior: { nombre: 'Senior', sueldo: 50000, exp: 30, fuerte: 0.35, descuidado: 0.1 },
      estrella: { nombre: 'Estrella', sueldo: 60000, exp: 60, fuerte: 0.5, descuidado: 0.15, comision: 0.05 },
    },
    rasgos: ['rapido', 'creativo', 'faltador', 'quejoso'],
  },
};

export const RASGOS = {
  prolijo: { nombre: 'Prolijo', efecto: 'se equivoca la mitad', bueno: true },
  rapido: { nombre: 'Rápido', efecto: 'rinde un 20% más en las mismas horas', bueno: true },
  creativo: { nombre: 'Creativo', efecto: 'suma reputación con lo que hace, pero es un 10% más lento', bueno: true },
  distraido: { nombre: 'Distraído', efecto: 'se equivoca un 50% más', bueno: false },
  faltador: { nombre: 'Faltador', efecto: 'falta más o menos una semana de cada diez', bueno: false },
  quejoso: { nombre: 'Quejoso', efecto: 'pide aumento cada seis meses; si no se lo das, rinde menos', bueno: false },
};

export const NOMBRES_EMPLEADOS = [
  'Brian', 'Yésica', 'Maxi', 'Romina', 'Kevin', 'Daiana', 'Lautaro', 'Micaela', 'Gonzalo', 'Ailén',
  'Matías', 'Abril', 'Ezequiel', 'Luz', 'Franco', 'Milagros', 'Thiago', 'Belén', 'Rodrigo', 'Celeste',
];
export const NOMBRES_FEMENINOS = ['Yésica', 'Romina', 'Daiana', 'Micaela', 'Ailén', 'Abril', 'Luz', 'Milagros', 'Belén', 'Celeste'];

export const EQUIPO = {
  cupoCiudad: 2, // además de Lelo
  bolsa: { horas: 3, candidatos: 3, recargo: 0.2 }, // ves todo, pero cobran un 20% más que la media
  chuchu: { descuento: 0.2, semanasAfuera: 4 }, // cobran un 20% menos, no se ven los rasgos, nunca renuncian
  anuncio: { costo: 5000, paso: 5000 }, // fijás el sueldo; el candidato llega el domingo siguiente
  mercado: { subeMin: 0.05, subeMax: 0.1 }, // la media del mercado se recalcula cada mes
  despido: 0.5, // indemnización: medio sueldo
  bajaExpPorMes: 4, // si no se capacitan (Lelo, la mitad)
  aumentoQuejoso: 0.15, desganoQuejoso: 0.8, mesesQuejoso: 6,
  probFalta: 0.1,
  repCreativo: 0.1, // por unidad o pedido que hace
};

export const CAPACITACION = {
  curso: { costoPorEmpleado: 10000, horas: 5, puntos: 15 },
  vos: { horas: 4, buffet: 3000, puntos: 5, partePorTipos: 0.65 },
};

export const LELO_EMPLEADO = { sueldo: 40000, exp: 60, horas: 20 };

// ---------- Chuchu: el amigo que siempre tiene un conocido ----------
export const CHUCHU = {
  probAparece: 0.3,
  frases: [
    'Te fuiste a jugar un partido con Chuchu. Entre jugada y jugada te tiró: "¡Chalú, campeón! Tengo un amigo que trabaja como una locomotora, ¿cheguro que no lo necechitás?"',
    'Chuchu pasó por el taller: "Echte negocio va a todo vapor. Ojo que che te va el último tren, eh."',
    'Te cruzaste a Chuchu en la estación mirando trenes de carga: "Cuando necechités gente, avichá. Tengo un amigo para cada vagón."',
    'Chuchu te mandó un audio de siete minutos: seis son de un tren pasando y uno es "chi necechitás a alguien, llamame".',
    'Asado en lo de Chuchu: "La vida es como una vía, campeón: hay que cheguir derecho. Y chi te falta gente, yo te consigo."',
    'Chuchu te vio pasar con las cajas: "¿Andás con mucho laburo? Echtás más cargado que un tren de carga. Llamame."',
    'Chuchu te mostró la maqueta de trenes que está armando en el garaje. Tardó una hora. Al final: "¿Y? ¿Che vende o no che vende?"',
  ],
  // Excusa para irse justo después de recomendarte a alguien, y mensajitos mientras no está.
  excusas: [
    { texto: 'se va de viaje un mes', mensajes: ['Chuchu te mandó una foto desde la ventanilla de un tren: "¡Echto ech vida!"', 'Chuchu te escribió: "Ya cacho vuelvo, no me extrañech."'] },
    { texto: 'se fracturó una pierna corriendo un tren y queda internado un mes', mensajes: ['Chuchu te mandó una foto del yeso: le dibujaron una locomotora.', 'Chuchu, desde el hospital: "La comida de acá ech peor que la del vagón comedor."'] },
    { texto: 'se divorció y se va un mes a la casa de la madre', mensajes: ['Chuchu te escribió a las 3 de la mañana: "Ella nunca entendió lo de los trenech."', 'La mamá de Chuchu te mandó saludos. Dice que el nene está bien.'] },
    { texto: 'se casa el sábado y se toma un mes', mensajes: ['Te llegó la invitación al casamiento de Chuchu: la torta tiene forma de locomotora.', 'Chuchu: "Me caché, campeón. Todavía no lo puedo creer."'] },
    { texto: 'se va de luna de miel un mes', mensajes: ['Chuchu te mandó una postal: "La luna de miel ech en un tren. Ella no chabía."', 'Chuchu: "Mi echpocha dice que hablo mucho de trenech. No entiendo."'] },
    { texto: 'se ganó un viaje en tren por la Patagonia', mensajes: ['Chuchu te mandó un video: 40 minutos de estepa desde La Trochita.', 'Chuchu: "¡Vi un guanaco! Bueno, creo. Iba muy rápido el tren."'] },
    { texto: 'se va a un congreso de modelismo ferroviario', mensajes: ['Saliste en el diario del barrio: Chuchu ganó un premio por su maqueta en el congreso.', 'Chuchu: "Me hice amigo de un japonech. No le entiendo nada pero le encantan los trenech."'] },
    { texto: 'se muda un mes a la casa de la suegra', mensajes: ['Chuchu te escribió bajito: "Echcapame de acá."', 'Chuchu: "Mi chuegra no me deja poner la maqueta en el living."'] },
  ],
  recomienda: [
    'Chuchu: "¡Me agarrachte justo! Tengo un amigo que ech de fiar: no che baja del tren a mitad de camino."',
    'Chuchu: "Echte pibe ech un fierro, campeón. Te lo mando mañana."',
    'Chuchu: "Te paso a uno que conozco de la echtación. Trabaja como una locomotora."',
  ],
};

// Mensajes del tutorial (semana -> texto del tío).
export const TUTORIAL = {
  1: 'Tío: "Bueno, campeón. Ya tenés la máquina de tazas. Así funciona: el domingo arrancás la semana haciendo publicidad en redes, durante la semana te llegan pedidos, el sábado producís y el domingo entregás. Tenés 40 horas por semana, pero no te mates: pasadas las 25 te empezás a cansar. Cuando yo arranqué, con un par de horas de publicidad me alcanzaba. Y las horas que te sobren, aprovechalas para estudiar."',
  2: 'Tío: "Cuantas más horas de publicidad, más pedidos te llegan... hasta que el mercado se agota. Fijate qué te dicen al final de la semana y ajustá: eso no te lo enseña nadie."',
  3: 'Tío: "Si aceptás un pedido y no lo entregás, quedás mal y perdés reputación. Si ves que no llegás, rechazalo a tiempo: perdés poquito. Y la reputación es lo que hace que te pidan más."',
  4: 'Tío: "Fin de mes: se pagan la luz, internet y la publicidad. Y me enteré de que tu primo Lelo también arrancó a vender tazas en el barrio... A ver quién la pega. Si escuchás algún rumor sobre él, prestale atención."',
  5: 'Tío: "¿Probaste la feria? Es el domingo: llevás lo que te sobró de stock, pagás la mesa y te lleva el día, pero vendés. Si el sábado producís unas de más, el domingo tenés qué llevar. Y no acumules mucho: lo que queda guardado siempre se termina rompiendo."',
  6: 'Tío: "En este negocio siempre pasa algo: a veces se rompe todo y a veces te cae un pedido del cielo. A la larga se compensa, pero hay que tener un colchón de plata."',
  7: 'Tío: "Si trabajás siempre al máximo te cansás y empezás a mandarte macanas. Descansá. Cuando no te den las horas, contratá a alguien: en la bolsa del municipio ves todo pero son caros; tu amigo Chuchu siempre tiene un conocido barato y de confianza, y si ponés un anuncio, el sueldo lo fijás vos."',
  8: 'Tío: "¡Feliz cumpleaños! Desde marzo arranca la época fuerte: en invierno las tazas vuelan, y para el Día del Padre ni te cuento. Prepará stock. Acá termina tu entrenamiento."',
};
