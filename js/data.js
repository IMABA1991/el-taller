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
  plancha30: { nombre: 'Plancha 30x30', precio: 900000, luzExtra: 10000 },
  plancha1m: { nombre: 'Plancha 1x1 m', precio: 4000000, luzExtra: 20000 },
  calandra: { nombre: 'Calandra', precio: 10000000, luzExtra: 40000 },
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
    precio: 5000, costo: 3000, horas: 0.5, base: 3, sens: 0.4,
    temporada: {},
  },
  gorra: {
    nombre: 'Gorra', corto: 'Gorra', singular: 'gorra', plural: 'gorras', maquina: 'gorras',
    precio: 10000, costo: 2000, horas: 1.6, base: 3, sens: 0.7,
    temporada: { verano: 1.6, invierno: 0.5 },
  },
  remera: {
    nombre: 'Remera', corto: 'Remera', singular: 'remera', plural: 'remeras', maquina: 'plancha30',
    precio: 15000, costo: 5000, horas: 1.6, base: 5, sens: 1,
    temporada: { verano: 1.5, invierno: 0.6 },
  },
  mangaLarga: {
    nombre: 'Manga larga', corto: 'Manga larga', singular: 'manga larga', plural: 'mangas largas', maquina: 'plancha30',
    precio: 20000, costo: 6000, horas: 2.25, base: 2, sens: 0.7,
    temporada: { otoño: 1.3, primavera: 1.3 },
  },
  buzo: {
    nombre: 'Buzo', corto: 'Buzo', singular: 'buzo', plural: 'buzos', maquina: 'plancha30',
    precio: 50000, costo: 10000, horas: 2, base: 1, sens: 1,
    temporada: { invierno: 2, verano: 0.3 },
  },
  // Full color (plancha 1x1 m): el doble de precio, el mismo costo, 30 min más y el 30% de la demanda.
  remeraFC: {
    nombre: 'Remera full color', corto: 'Remera FC', singular: 'remera full color', plural: 'remeras full color', maquina: 'plancha1m',
    precio: 30000, costo: 5000, horas: 2.1, base: 1.5, sens: 1,
    temporada: { verano: 1.5, invierno: 0.6 },
  },
  mangaLargaFC: {
    nombre: 'Manga larga full color', corto: 'Manga larga FC', singular: 'manga larga full color', plural: 'mangas largas full color', maquina: 'plancha1m',
    precio: 40000, costo: 6000, horas: 2.75, base: 0.6, sens: 0.7,
    temporada: { otoño: 1.3, primavera: 1.3 },
  },
  buzoFC: {
    nombre: 'Buzo full color', corto: 'Buzo FC', singular: 'buzo full color', plural: 'buzos full color', maquina: 'plancha1m',
    precio: 100000, costo: 10000, horas: 2.5, base: 0.3, sens: 1,
    temporada: { invierno: 2, verano: 0.3 },
  },
  // Combo de club (camiseta + short): solo por licitación. 1 h de calandra + 30 min de costura.
  combo: {
    nombre: 'Combo de club', corto: 'Combo', singular: 'combo', plural: 'combos', maquina: 'calandra',
    precio: 90000, costo: 30000, horas: 1.5, base: 0, sens: 0, soloPedido: true,
    temporada: {},
  },
};

// Fechas especiales. Los turnos van de domingo a domingo: el pico es el turno que termina el día
// de la fecha (mes 0-11, semana del mes 1-based). Se anuncian 3 semanas antes y la demanda extra
// sube de forma exponencial: 1/8, 1/4, 1/2 y todo el efecto en el pico. Después vuelve a lo normal.
// "todo" afecta a todos los productos. El CyberMonday no tiene rampa: solo rinde en su semana
// y solo si te sumás bajando los precios.
export const FECHAS_ESPECIALES = [
  { mes: 1, semana: 2, nombre: 'San Valentín', efecto: { tazaCeramica: 2 } },
  { mes: 2, semana: 2, nombre: 'el Día de la Mujer', efecto: { tazaCeramica: 1.5 } },
  { mes: 2, semana: 4, nombre: 'el inicio de clases', efecto: { buzo: 2, buzoFC: 2 } },
  { mes: 3, semana: 2, nombre: 'Pascuas', efecto: { tazaCeramica: 1.5, tazaPlastico: 1.5 } },
  { mes: 4, semana: 4, nombre: 'el 25 de Mayo', efecto: { tazaCeramica: 1.5, tazaPlastico: 1.5, gorra: 1.5 } },
  { mes: 5, semana: 3, nombre: 'el Día del Padre', efecto: { tazaCeramica: 2, tazaPlastico: 2, gorra: 1.5 } },
  { mes: 6, semana: 3, nombre: 'el Día del Amigo', efecto: { tazaCeramica: 2, tazaPlastico: 2 } },
  { mes: 7, semana: 3, nombre: 'el Día del Niño', efecto: { tazaPlastico: 2 } },
  { mes: 8, semana: 3, nombre: 'el Día del Estudiante', efecto: { remera: 1.5, buzo: 1.5, remeraFC: 1.5, buzoFC: 1.5 } },
  { mes: 9, semana: 3, nombre: 'el Día de la Madre', efecto: { tazaCeramica: 2, tazaPlastico: 2 } },
  { mes: 10, semana: 1, nombre: 'el CyberMonday', efecto: { todo: 1.5 }, cyber: true },
  { mes: 11, semana: 4, nombre: 'Navidad', efecto: { tazaCeramica: 2, tazaPlastico: 2, remera: 2, remeraFC: 2 } },
];
export const CYBER = { descuento: 0.15 };
export const RAMPA_FECHA = { 3: 1 / 8, 2: 1 / 4, 1: 1 / 2, 0: 1 }; // semanas que faltan → parte del efecto

export const PRESTAMO = {
  monto: 200000,
  A: { total: 240000, interes: 40000, semanaVence: 52 },
  B: { cuota: 22000, cuotas: 12, mesPerdonado: 1 }, // mes 1 = febrero (0-based)
  // Préstamos siguientes (para la próxima máquina): mismos términos que el primero.
  interesA: 0.2, interesB: 0.32,
  tope: { min: 0.25, max: 0.75 }, // parte del precio de la próxima máquina, según la confianza
};

// Confianza del tío (0 a 100) = historial de pago (hasta 50) + reputación (hasta 50).
export const CONFIANZA = {
  historialInicial: 25,
  pagoATiempo: 10, // opción A pagada al vencer
  adelantoPorSemanas: 2, // +1 por cada 2 semanas de adelanto…
  maxPagoAnticipado: 25, // …hasta +25 en total
  cuotaATiempo: 1,
  atraso: -10,
  vencido: -25,
  porMeta: 25, // por cada meta ganada
  repDivisor: 4,
  repMala: 20, // con reputación debajo de esto, resta…
  restaRepMala: -10,
};

// Orden de las máquinas (las que todavía no están en el juego aparecen solo como aviso).
export const ORDEN_MAQUINAS = ['tazas', 'gorras', 'plancha30', 'plancha1m', 'calandra'];
export const MAQUINAS_FUTURAS = {};

// Dónde trabajás: en tu casa entran 2 empleados; para más, alquilás un local.
export const LOCALES = {
  casa: { nombre: 'Tu casa', alquiler: 0, luz: 0, cupo: 2 },
  chico: { nombre: 'Local chico', alquiler: 60000, luz: 8000, cupo: 5 },
  grande: { nombre: 'Local grande', alquiler: 200000, luz: 20000, cupo: 12, desdeProvincia: true },
};

// Volantería: imprimís volantes y alguien los reparte por el barrio.
export const VOLANTES = { costo: 5000, horas: 6, extra: 0.15, extraSiguiente: 0.07 };

// Servicios especiales que piden algunos clientes.
export const SERVICIOS = {
  envio: { prob: 0.15, recargo: 0.1, rep: 0.5, horas: 1 }, // 1 h por envío, de un empleado si hay
  diseno: { prob: 0.1, recargo: 0.2, tiempoExtra: 0.5 }, // +50% del tiempo de esas unidades (lo hacés vos)
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
  // Ofertas chicas (sin rumor previo). "pista" es lo que te cuenta el cliente cuando cancela.
  ofertas: [
    { texto: 'Lelo sacó un 2x1 en tazas. Algunos clientes se fueron con él.', pista: 'Lelo le hizo 2x1' },
    { texto: 'Lelo publicó "envío gratis en el barrio" y te sacó algunos pedidos.', pista: 'Lelo se la lleva gratis a la casa' },
    { texto: 'Lelo regaló un llavero con cada compra. Algunos clientes picaron.', pista: 'Lelo le regalaba un llavero' },
  ],
  // Diez jugadas agresivas: cada una tiene su rumor (una semana antes), su texto cuando pasa
  // y la pista que te da el cliente que cancela.
  jugadas: [
    { rumor: 'dicen que Lelo está imprimiendo volantes con precios de remate.', ataque: 'Lelo repartió volantes con precios de remate por todo el barrio.', pista: 'vio un volante de Lelo con precios de remate', volantes: true },
    { rumor: 'Lelo anda anunciando "un sorteo bomba" en Instagram.', ataque: 'Lelo hizo un sorteo en Instagram: "seguime y compartí". Medio barrio lo compartió.', pista: 'entró al sorteo de Lelo y ya que estaba le compró' },
    { rumor: 'te contaron que Lelo prepara un 2x1 relámpago.', ataque: 'Lelo lanzó un 2x1 relámpago de 48 horas.', pista: 'agarró el 2x1 relámpago de Lelo' },
    { rumor: 'Lelo consiguió que lo entrevisten en la radio del barrio.', ataque: 'Lelo salió en la radio del barrio contando "su emprendimiento".', pista: 'escuchó a Lelo en la radio' },
    { rumor: 'Lelo está hablando con unos influencers amigos.', ataque: 'Tres influencers amigos de Lelo lo recomendaron en sus historias.', pista: 'lo vio recomendado por una influencer' },
    { rumor: 'Lelo está armando combos con regalo incluido.', ataque: 'Lelo sacó combos "taza + llavero + bombón" a precio de taza sola.', pista: 'Lelo le daba taza, llavero y bombón al mismo precio' },
    { rumor: 'tu tía dice que Lelo anda hablando mal de tus tazas.', ataque: 'Lelo le dijo a tus clientes que tus tazas se despintan en el lavavajillas.', pista: 'le dijeron que tus tazas se despintan' },
    { rumor: 'Lelo anda prometiendo entregas en 24 horas.', ataque: 'Lelo promete "pedido hoy, taza mañana" y la gente le cree.', pista: 'Lelo se la entregaba al otro día' },
    { rumor: 'te parece que Lelo te está copiando los diseños...', ataque: 'Lelo copió tus diseños más vendidos y los ofrece más baratos.', pista: 'Lelo tenía "el mismo diseño, pero más barato"' },
    { rumor: 'Lelo averiguó cuánto sale una mesa en la feria.', ataque: 'Lelo puso un puesto en la feria justo al lado del tuyo, con precios más bajos.', pista: 'pasó por el puesto de Lelo en la feria' },
  ],
  // Lelo tranquilo igual te saca algún cliente suelto.
  pistasTranquilo: ['Lelo le hizo precio', 'es amigo de Lelo', 'Lelo se lo ofreció primero', 'la mamá de Lelo le insistió'],
  // Si la promo falla, el cliente igual se va.
  pistaPromoFallida: 'hiciste la promo, pero igual se fue a lo de Lelo',
  // Con muchas cancelaciones en un día, se agrupan.
  agruparDesde: 3,
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

export const PROMO = { descuento: 0.15, extraDemanda: 0.2, horas: 2, falla: 0.1 }; // 1 de cada 10 promos falla

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

// Mazo de eventos: uno por trimestre, de 6 cartas (3 pares de tipos distintos: uno chico, uno mediano
// y uno grande), con al menos 2 cartas que te hacen elegir. Cada par suma cero.
// Los montos son una parte de tu ganancia mensual (promedio de los últimos 3 meses).
export const MAZO = {
  tamanos: { chica: 0.1, mediana: 0.2, grande: 0.35 },
  baseMinima: 80000,
  horas: { chica: 4, mediana: 8, grande: 16 },
  rep: { chica: 1, mediana: 2, grande: 4 },
  minDecisiones: 2,
  // tipo → tamaño → { mala, buena }. {u} = unidades. "decision" = la carta te hace elegir.
  cartas: {
    plata: {
      chica: {
        mala: { texto: 'El proveedor aumentó sin avisar y tuviste que pagar la diferencia.' },
        buena: { texto: 'Encontraste plata en una campera vieja. ¡Justo!' },
      },
      mediana: {
        mala: { texto: 'Te cayó una multa del municipio por el cartel en la vereda.' },
        buena: { texto: 'Te encargaron los souvenirs para un cumpleaños de 15.', decision: 'cumple15' },
      },
      grande: {
        mala: { texto: 'Se quemó la resistencia de la máquina.', decision: 'resistencia' },
        buena: { texto: 'Un cliente te pagó una deuda vieja que ya dabas por perdida.' },
      },
    },
    horas: {
      chica: {
        mala: { texto: 'Tuviste que ir al banco a hacer un trámite: la fila daba dos vueltas a la manzana.' },
        buena: { texto: 'Tu vieja te ordenó el taller: ahora encontrás todo al toque.' },
      },
      mediana: {
        mala: { texto: 'Se viene un corte de luz programado en todo el barrio.' },
        buena: { texto: 'Tu vieja se ofreció a darte una mano en el taller.' },
      },
      grande: {
        mala: { texto: 'Te agarró una gripe de esas que te tiran en la cama.', decision: 'gripe' },
        buena: { texto: 'Tu hermano viene de visita y se ofreció a ayudarte dos días.' },
      },
    },
    stock: {
      chica: {
        mala: { texto: 'Se te cayó una caja: se rompió {u}.' },
        buena: { texto: 'El proveedor te mandó de más y no lo quiere de vuelta: sumaste {u}.' },
      },
      mediana: {
        mala: { texto: 'Te llegó un lote de insumos fallados.', decision: 'lote' },
        buena: { texto: 'Un proveedor nuevo te regaló insumos para que lo pruebes: sumaste {u}.' },
      },
      grande: {
        mala: { texto: 'Hubo una gotera justo arriba de las cajas: se arruinó {u}.' },
        buena: { texto: 'Un taller que cerró te dejó lo que le quedaba: sumaste {u}.' },
      },
    },
    reputacion: {
      chica: {
        mala: { texto: 'Te dejaron una reseña mala: "llegó bien, pero no me gustó la caja".' },
        buena: { texto: 'Te dejaron una reseña de 5 estrellas, con foto y todo.' },
      },
      mediana: {
        mala: { texto: 'Un cliente se quejó de vos en las redes.', decision: 'quejoso' },
        buena: { texto: 'Un influencer local subió tu taza a sus historias.' },
      },
      grande: {
        mala: { texto: 'Una taza tuya desteñida se hizo viral: "lo que pedí vs. lo que me llegó".' },
        buena: { texto: 'Saliste en la radio del barrio: el locutor no paraba de hablar de tus tazas.' },
      },
    },
  },
  // Cartas que te hacen elegir (se resuelven el domingo siguiente).
  decisiones: {
    resistencia: {
      pregunta: '¿Cómo la arreglás?',
      opciones: {
        tecnico: { texto: 'Llamar al técnico', detalle: 'Pagás el arreglo completo y listo.' },
        vos: { texto: 'Arreglarla vos', detalle: 'Pagás el 40% en repuestos y te lleva 6 h esta semana. 1 de cada 3 veces no queda bien y hay que llamar al técnico igual.' },
      },
    },
    cumple15: {
      pregunta: 'Es para esta semana. ¿Lo agarrás?',
      opciones: {
        acepta: { texto: 'Aceptarlo', detalle: 'Cobrás el pedido, pero le metés 6 h extra y te cansás más.' },
        rechaza: { texto: 'Decir que no', detalle: 'No pasa nada.' },
      },
    },
    gripe: {
      pregunta: '¿Qué hacés?',
      opciones: {
        trabaja: { texto: 'Trabajar igual', detalle: 'No perdés horas, pero el cansancio se te va por las nubes.' },
        descansa: { texto: 'Hacer reposo', detalle: 'Perdés 16 h esta semana.' },
      },
    },
    lote: {
      pregunta: '¿Qué hacés con el lote?',
      opciones: {
        reclama: { texto: 'Reclamar al proveedor', detalle: 'Te lo cambian, pero el reclamo te lleva 4 h esta semana.' },
        usa: { texto: 'Usarlo igual', detalle: 'No perdés horas, pero 1 de cada 2 veces algún cliente lo nota (−2 de reputación).' },
      },
    },
    // Decisiones que vienen de Traicio
    tintura: {
      pregunta: '¿Qué hacés con las tazas guardadas?',
      opciones: {
        limpia: { texto: 'Pagar una limpieza', detalle: 'Cuesta plata, pero salvás la mayoría de las tazas.' },
        tira: { texto: 'Tirar las que huelen', detalle: 'No gastás nada, pero perdés la mitad de las tazas guardadas.' },
      },
    },
    propaganda: {
      pregunta: '¿Lo desmentís?',
      opciones: {
        desmiente: { texto: 'Desmentirlo', detalle: 'Te lleva 3 h esta semana y recuperás la mitad (−1 de reputación).' },
        ignora: { texto: 'Dejarlo pasar', detalle: '−2 de reputación.' },
      },
    },
    roboEmpleado: {
      pregunta: '¿Igualás la oferta?',
      opciones: {
        iguala: { texto: 'Igualar la oferta', detalle: 'Le subís el sueldo un 25% y se queda.' },
        deja: { texto: 'No igualar', detalle: 'Decide él: si le pagás menos que la media del mercado, es más probable que se vaya.' },
      },
    },
    quejoso: {
      pregunta: '¿Le contestás?',
      opciones: {
        contesta: { texto: 'Contestarle bien', detalle: 'Te lleva 2 h esta semana y recuperás la mitad (−1 de reputación).' },
        ignora: { texto: 'Ignorarlo', detalle: '−2 de reputación.' },
      },
    },
  },
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
  // Diseñadores (desde la provincia): no producen, bajan los errores de las máquinas que manejan.
  disenador: {
    nombre: 'Diseñador', tarea: 'diseño', horas: 0, desdeProvincia: true,
    variantes: {
      basico: { nombre: 'Básico', sueldo: 35000, exp: 20, maquinas: ['tazas', 'gorras'], errores: 0.8 },
      textil: { nombre: 'Textil', sueldo: 60000, exp: 30, maquinas: ['plancha30', 'plancha1m'], errores: 0.6 },
      deportivo: { nombre: 'Deportivo', sueldo: 120000, exp: 40, maquinas: ['calandra'], errores: 0.4 },
    },
    rasgos: ['prolijo', 'creativo', 'distraido', 'faltador', 'quejoso'],
  },
};
// Sin diseñador textil, los productos de plancha tienen más errores.
export const SIN_TEXTIL_ERRORES = 1.5;

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

// Al ganar la ciudad, Lelo cierra y se va un mes de viaje antes de trabajar para vos.
export const LELO_VIAJE = {
  semanas: 4,
  probFoto: 0.5,
  fotos: [
    'Lelo subió una foto con un choclo en la playa de Mar del Plata.',
    'Lelo subió una historia: "Primer día sin pensar en tazas 🌊".',
    'Lelo se insoló durmiendo en la playa. Subió una foto rojo como un camarón.',
    'Lelo te mandó una foto con un lobo marino. El lobo marino parece más contento.',
    'Lelo subió un video comiendo churros en la Rambla. Ya no le queda casi plata.',
    'Lelo le escribió al grupo de la familia: "Acá todo bien, ¿y por allá qué onda el negocio?".',
  ],
};

// ---------- Provincia ----------
export const PROVINCIA = {
  factorRepVenta: 0.05, // cada venta suma la mitad que en la ciudad
  mercadoInicial: 3.375, // arranca donde terminó la ciudad y llega al doble con 100
  repAlPerder: 75, // si Traicio te gana, volvés a la ciudad con esta reputación
  repLeloAlVolver: 50,
  repTraicioRevancha: 30, // si volvés a la provincia después de perderla
};

export const LELO_GERENTE = { sueldo: 150000, errores: 0.8, umbralCansancio: 28 };

// Rival de la provincia.
export const TRAICIO = {
  nombre: 'Traicio Nero', empresa: 'Talleres Judas',
  ventanaRitmo: 12, // semanas para medir tu ritmo
  factorMin: 0.95, factorMax: 0.97, // crece un 3-5% más lento que vos
  ritmoMinimo: 1.4, // si te estancás, él sigue a este ritmo por semana
  ruido: 0.15,
  alerta: 85,
  sabotajeCada: { min: 2, max: 4 },
  probConRumor: 0.5,
  roboEmpleado: { cadaSemanas: 8, prob: 0.2, aumento: 0.25, seVaDebajo: 0.5, seVaMedia: 0.25, seVaArriba: 0.1 },
  sabotajes: {
    resenas: { tamano: 'chica', rumor: 'dicen que Traicio Nero está juntando amigos para dejarte reseñas.', texto: 'Aparecieron reseñas falsas de tu taller: "horrible", "me llegó tarde", "el dueño es feo".' },
    hablaMal: { tamano: 'chica', rumor: 'Traicio anda por los negocios hablando de vos.', texto: 'Traicio anda diciendo que tus productos son malos: por un par de semanas te van a pedir menos.' },
    soborno: { tamano: 'chica', rumor: 'viste a Traicio tomando un café con tu proveedor.', texto: 'Traicio sobornó a tu proveedor: los insumos llegan tarde y perdés horas de producción la semana que viene.' },
    tintura: { tamano: 'mediana', rumor: 'alguien vio a un empleado de Talleres Judas comprando tintura industrial.', texto: 'Amaneciste con tintura podrida derramada en la puerta: las tazas guardadas quedaron con un olor asqueroso.' },
    propaganda: { tamano: 'mediana', rumor: 'Traicio está armando cuentas truchas en las redes.', texto: 'Aparecieron avisos falsos a tu nombre burlándose de la gente.' },
    entregaTrucha: { tamano: 'mediana', rumor: 'dicen que en Talleres Judas están imprimiendo etiquetas con tu nombre.', texto: 'Traicio entregó productos truchos haciéndose pasar por vos. Los clientes están furiosos.' },
    roboCliente: { tamano: 'grande', rumor: 'Traicio anda visitando a tus clientes grandes.', texto: 'Traicio te robó un cliente grande a último momento.' },
  },
};

export const DEFENSAS = {
  proteccion: { nombre: 'Protección', detalle: 'Cámaras y contratos firmados con proveedores. Los sabotajes sin aviso salen la mitad de las veces y hacen la mitad del daño.', costo: 15000 },
  seguro: { nombre: 'Seguro', detalle: 'Te paga la mitad de lo que perdés en plata y stock por sabotajes.', costo: 15000 },
};
export const SEGURIDAD = { sueldo: 30000, frena: 1 / 3, probSoborno: 0.3 };

// Clientes empresa de la provincia: pedidos con plazo, que se cobran a 30 días.
export const EMPRESAS = {
  catering: {
    nombres: ['Catering Doña Rosa', 'Eventos El Quincho', 'Catering Las Delicias'],
    cada: { min: 5, max: 7 }, plazo: 2, cobroSemanas: 4, descuento: 0,
    items: [{ producto: 'remera', min: 20, max: 30 }],
  },
  colectivos: {
    nombres: ['Colectivos La Golondrina', 'Micros El Rayo', 'Transporte Serrano'],
    cada: { min: 12, max: 14 }, plazo: 3, cobroSemanas: 4, cobroLargo: 8, probCobroLargo: 0.25, descuento: 0.1,
    items: [{ producto: 'remera', min: 20, max: 30 }, { producto: 'buzo', min: 8, max: 12 }, { producto: 'tazaCeramica', min: 12, max: 18 }],
  },
  repEntrega: 3, // pedido grande
  repNoEntrega: -10,
  entregasParaFijo: 3,
  probTraicioSeLoLleva: 0.3, // si no es cliente fijo
};

export const TERCERIZAR = { min: 0.9, max: 0.95 }; // lo que pagás del precio

export const LICITACION = {
  cada: { min: 7, max: 9 },
  combos: 60, precioRef: 90000, costo: 30000, plazo: 4, sena: 0.5, multa: 3,
  pesos: { precio: 0.4, rep: 0.4, calidad: 0.2 },
  rivales: { min: 1, max: 2, repMin: 40, repMax: 80, ofertaMin: 0.9, ofertaMax: 1.3 },
  repGanada: 3, repIncompleta: -10,
  talleres: ['Estampados Don Pepe', 'Sublimados La Tablada', 'Camisetas El Potrero', 'Textil Los Hornos'],
  clubes: ['Club Atlético Villa Pancha', 'Sportivo Las Toscas', 'Deportivo El Cardo', 'Atlético Barrio Norte', 'Unión de Cañada Seca'],
};

// La Voz de Adentro: una nota por mes sobre Talleres Judas, mezclada con chismes inútiles.
export const VOZ_DE_ADENTRO = [
  'Chuchu fue visto persiguiendo un tren de carga en bicicleta.',
  'Lelo se casó... aunque después la familia se dio cuenta de que ya estaba casado.',
  'Un vecino asegura que su perro ladra el himno. Nadie lo pudo comprobar.',
  'Inauguraron un semáforo en la ruta. Los vecinos llevaron facturas.',
  'Récord provincial: un hombre comió 40 empanadas en una hora y pidió el postre.',
  'Se perdió una vaca en el centro. La encontraron haciendo fila en el banco.',
  'El intendente prometió arreglar el bache de la esquina. Es la promesa número 14.',
  'Chuchu armó una maqueta de trenes de 12 metros. Su suegra se mudó.',
];

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
  3: 'Tío: "Si aceptás un pedido y no lo entregás, quedás mal y perdés reputación. Si ves que no llegás, rechazalo a tiempo: perdés poquito. Y la reputación es lo que hace que te pidan más. Ah, y fijate en el calendario: se viene San Valentín. Las fechas especiales se avisan con tiempo y la gente pide cada vez más hasta el día. Prepará stock."',
  4: 'Tío: "Fin de mes: se pagan la luz, internet y la publicidad. Y me enteré de que tu primo Lelo también arrancó a vender tazas en el barrio... A ver quién la pega. Si escuchás algún rumor sobre él, prestale atención."',
  5: 'Tío: "¿Probaste la feria? Es el domingo: llevás lo que te sobró de stock, pagás la mesa y te lleva el día, pero vendés. Si el sábado producís unas de más, el domingo tenés qué llevar. Y no acumules mucho: lo que queda guardado siempre se termina rompiendo."',
  6: 'Tío: "En este negocio siempre pasa algo: a veces se rompe todo y a veces te cae un pedido del cielo. A la larga se compensa, pero hay que tener un colchón de plata."',
  7: 'Tío: "Si trabajás siempre al máximo te cansás y empezás a mandarte macanas. Descansá. Cuando no te den las horas, contratá a alguien: en la bolsa del municipio ves todo pero son caros; tu amigo Chuchu siempre tiene un conocido barato y de confianza, y si ponés un anuncio, el sueldo lo fijás vos."',
  8: 'Tío: "¡Feliz cumpleaños! Desde marzo arranca la época fuerte: en invierno las tazas vuelan. Y casi todos los meses hay una fecha especial: el Día de la Mujer, Pascuas, el 25 de Mayo, el Día del Padre, el del Amigo... Prepará stock. Ah, y cuando termines de pagarme, si quedé contento, te puedo volver a prestar para la próxima máquina. Acá termina tu entrenamiento."',
};
