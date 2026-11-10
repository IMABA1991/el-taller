// Datos del juego "El Taller" — valores tomados del documento de reglas (v0.8).
// Todo lo que se quiera balancear se cambia acá, sin tocar el motor.

export const HORAS_POR_SEMANA = 60;
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
    nombre: 'Taza de cerámica', corto: 'Taza cerámica', maquina: 'tazas',
    precio: 8000, costo: 4000, horas: 1, base: 5, sens: 1,
    temporada: { verano: 0.7, invierno: 1.5 },
  },
  tazaPlastico: {
    nombre: 'Taza de plástico', corto: 'Taza plástico', maquina: 'tazas',
    precio: 5000, costo: 3000, horas: 1, base: 3, sens: 0.4,
    temporada: {},
  },
  gorra: {
    nombre: 'Gorra', corto: 'Gorra', maquina: 'gorras',
    precio: 10000, costo: 2000, horas: 1.5, base: 3, sens: 0.7,
    temporada: { verano: 1.6, invierno: 0.5 },
  },
};

// Fechas especiales: mes (0-11), semanas del mes (1-based) y multiplicador por producto.
export const FECHAS_ESPECIALES = [
  { mes: 5, semanas: [3], nombre: 'Día del Padre', efecto: { tazaCeramica: 2, tazaPlastico: 2, gorra: 1.5 } },
  { mes: 7, semanas: [3], nombre: 'Día del Niño', efecto: { tazaPlastico: 2 } },
  { mes: 9, semanas: [3], nombre: 'Día de la Madre', efecto: { tazaCeramica: 2, tazaPlastico: 2 } },
  { mes: 11, semanas: [3, 4, 5], nombre: 'Fin de clases y Navidad', efecto: { tazaCeramica: 2, tazaPlastico: 2 } },
];

export const PRESTAMO = {
  monto: 200000,
  A: { total: 240000, interes: 40000, semanaVence: 52 },
  B: { cuota: 22000, cuotas: 12, mesPerdonado: 1 }, // mes 1 = febrero (0-based)
};

export const GASTOS_FIJOS = { luz: 12000, internet: 10000, publicidad: 8000 };

export const VENTAS = {
  horasPorVentaRedes: 0.5, // horas de atención por cada venta en redes y Marketplace
  feria: { horas: 8, costoMesa: 10000, min: 5, max: 8 },
  reputacionMercadoLibre: 50, // desde acá Mercado Libre suma demanda
  extraMercadoLibre: 0.25,
};

export const REPUTACION = {
  porVenta: 0.2, // ~5 ventas = 1 pedido bien entregado (+1)
  porPedidoNoEntregado: -0.5,
  porPedidoMalHecho: -1.25,
  meta: 100,
};

export const PRIMO = {
  nombre: 'Lelo',
  comportamientos: [
    { id: 'tranquilo', prob: 0.5, saca: 0.05, texto: 'Lelo anda tranquilo esta semana.' },
    { id: 'ofertas', prob: 0.3, saca: 0.15, texto: 'Lelo sacó un 2x1 en tazas. Algunos clientes se fueron con él.' },
    { id: 'agresivo', prob: 0.2, saca: 0.25, texto: 'Lelo salió con todo: bajó precios y te sacó clientes.' },
  ],
  repMax: 70,
  // Rumor una semana antes: siempre aparece si Lelo prepara una campaña agresiva,
  // y a veces aparece aunque no la haga (falsa alarma). Así puede o no ejecutarse (~60%).
  rumor: { probFalsaAlarma: 0.15 },
  rumores: [
    'Rumor: dicen que Lelo está preparando una campaña agresiva para la semana que viene. Puede ser puro humo... o no.',
    'Rumor: tu tía comentó en el grupo de la familia que Lelo anda imprimiendo volantes con precios de remate.',
    'Rumor: un cliente te contó que Lelo le prometió "precios que te van a hacer llorar" la semana que viene.',
  ],
};

// Defensa ante un rumor: promo de contraataque en redes.
// El costo es el descuento (escala solo con el tamaño del taller). Si Lelo ataca, conviene;
// si era falsa alarma, regalaste el descuento.
export const PROMO = { descuento: 0.15, extraDemanda: 0.1, horas: 2 };

export const CURSO_CORTO = { costo: 15000, horasPorSemana: 5, semanas: 2, puntos: 10 };

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

// Mensajes del tutorial (semana -> texto del tío).
export const TUTORIAL = {
  1: 'Tío: "Bueno, campeón. Ya tenés la máquina de tazas. Arrancá produciendo unas cuantas: cada taza te lleva horas y cuesta el insumo. No te vuelvas loco, que en verano las tazas no se venden tanto."',
  2: 'Tío: "Producir no alcanza: alguien las tiene que vender. Poné horas en redes para responder consultas en Instagram y Marketplace. Cada venta lleva su tiempo."',
  3: 'Tío: "Ojo con el stock: si te piden y no tenés, quedás mal y perdés reputación. Y la reputación es lo que hace que te compren más."',
  4: 'Tío: "Fin de mes: se pagan la luz, internet y la publicidad. Y me enteré de que tu primo Lelo también arrancó a vender tazas en el barrio... A ver quién la pega. Si escuchás algún rumor sobre él, prestale atención."',
  5: 'Tío: "¿Probaste la feria? Pagás la mesa y te lleva el día entero, pero vendés bastante más."',
  6: 'Tío: "En este negocio siempre pasa algo: a veces se rompe todo y a veces te cae un pedido del cielo. A la larga se compensa, pero hay que tener un colchón de plata."',
  7: 'Tío: "Si trabajás siempre al máximo te cansás y empezás a mandarte macanas. Descansá. Y hay un curso corto de sublimación: cuesta plata y horas, pero te hace mejor."',
  8: 'Tío: "¡Feliz cumpleaños! Desde marzo arranca la época fuerte: en invierno las tazas vuelan, y para el Día del Padre ni te cuento. Prepará stock. Acá termina tu entrenamiento."',
};
