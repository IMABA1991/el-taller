// Pantallas de "El Taller" (versión sin diseño).
import {
  nuevaPartida, publicar, cerrarSemana, validarPublicidad, validarPlan, rechazarPedido, unidadesPedidas,
  calendario, avisoFecha, horasPorUnidad,
  comprarMaquina, pagarPrestamoA, costoPagoAnticipadoA, gastosFijosDelMes, nombreUnidades, migrarPartida, stockTotal, horasDomingo,
  fmt, puedeHacerPromo, HORAS_POR_SEMANA, PRODUCTOS, MAQUINAS, CURSOS, VENTAS, PRESTAMO, TUTORIAL, PROMO,
  PUESTOS, RASGOS, EQUIPO, CAPACITACION, CANSANCIO, mediaSueldo, cupoEquipo, empleadosContratados, chuchuDisponible,
  irALaBolsa, fuisteALaBolsa, llamarAChuchu, rechazarChuchu, publicarAnuncio, descartarAnuncio, contratar, despedir,
  costoDespido, responderAumento, darAumento, horasEmpleado, presentes, capacidadEquipo, repartirProduccion,
  productosParaEnsenar, costoCapacitacion, nombreRasgo,
} from './engine.js';
import { guardar, cargar, borrar } from './storage.js';
import { imagen } from './arte.js';

const app = document.getElementById('app');
let partida = null;
let plan = null; // paso 2: producción
let pub = null; // paso 1: publicidad
let aviso = null; // mensaje después de una acción (compra, pago)
let confirmarReinicio = false;
let menuAbierto = false;
let anuncioForm = { puesto: 'operario', sueldo: null };
let confirmarDespido = null;
let temporizadores = [];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ---------- Utilidades ----------
const plata = (n) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n))}`;
const pct = (v) => `${Math.max(0, Math.min(100, v))}%`;

function planPublicidad() {
  return { horasRedes: partida?.ultimaPublicidad ?? 0, promo: false, feria: false, curso: null, capacitar: null, feriaVendedor: null };
}

// La producción siempre arranca en cero: lo que falta se muestra resaltado y lo carga el jugador.
function planProduccion() {
  const producir = {};
  for (const id of Object.keys(PRODUCTOS)) producir[id] = 0;
  return { producir };
}

function prepararPlanes() {
  pub = planPublicidad();
  plan = partida.semanaEnCurso ? planProduccion() : null;
}

function guardarPartida() {
  if (!guardar(partida)) aviso = 'No se pudo guardar la partida en este navegador.';
}

// ---------- Pantalla: inicio ----------
function pantallaInicio() {
  const guardada = cargar();
  app.innerHTML = `
    ${imagen('logo', 'logo')}
    <h1>El Taller</h1>
    <p class="suave">Simulador de emprendedor de sublimación. De una máquina de tazas a ser el mejor de la ciudad (y algún día, del mundo).</p>
    <div class="tarjeta">
      <p>Terminaste el secundario en diciembre y no sabés qué hacer. En las fiestas tu tío, que conoce el rubro, te cuenta que la sublimación puede ser un buen negocio y te ofrece prestarte la plata para arrancar.</p>
      <p>Pero el tío es justo: <strong>le presta lo mismo a tu primo Lelo</strong>, que va a arrancar con lo mismo en tu ciudad.</p>
    </div>
    ${guardada ? `<button class="boton" id="continuar">Continuar partida (semana ${guardada.semana})</button>` : ''}
    <button class="boton ${guardada ? 'secundario' : ''}" id="nueva">Nueva partida</button>
    <p class="suave">Versión mínima · la partida se guarda en este navegador.</p>
  `;
  document.getElementById('nueva').onclick = () => {
    if (guardada && !confirmarReinicio) {
      confirmarReinicio = true;
      document.getElementById('nueva').textContent = 'Tocá de nuevo para borrar la partida guardada';
      document.getElementById('nueva').classList.add('peligro');
      return;
    }
    confirmarReinicio = false;
    pantallaPrestamo();
  };
  if (guardada) {
    document.getElementById('continuar').onclick = () => {
      partida = migrarPartida(guardada);
      prepararPlanes();
      siguientePantalla();
    };
  }
}

// ---------- Pantalla: elegir préstamo ----------
function pantallaPrestamo() {
  window.scrollTo(0, 0);
  app.innerHTML = `
    <h1>El préstamo del tío</h1>
    <p>Te presta <strong>${plata(PRESTAMO.monto)}</strong>: alcanza para la máquina de tazas (${plata(MAQUINAS.tazas.precio)}) y unos ${plata(PRESTAMO.monto - MAQUINAS.tazas.precio)} de insumos. ¿Cómo se lo devolvés?</p>
    <div class="tarjeta opcion">
      <h2>Opción A · Todo junto</h2>
      <ul>
        <li>${plata(PRESTAMO.A.total)} en la semana 52 (20% de interés).</li>
        <li>Si pagás antes, el interés baja (en la semana 26 serían ${plata(costoPagoAnticipadoA(26))}).</li>
        <li>Pagar todo junto te suma mucha confianza con el tío.</li>
        <li>Si no llegás, el tío se enoja mucho.</li>
      </ul>
      <button class="boton" data-opcion="A">Elegir opción A</button>
    </div>
    <div class="tarjeta opcion">
      <h2>Opción B · Cuotas</h2>
      <ul>
        <li>${PRESTAMO.B.cuotas} cuotas de ${plata(PRESTAMO.B.cuota)} al cierre de cada mes (32% de interés).</li>
        <li>Más cómodo, pero más caro, y no se puede cancelar antes.</li>
        <li>El tío no te vuelve a prestar hasta que termines de pagar.</li>
      </ul>
      <button class="boton" data-opcion="B">Elegir opción B</button>
    </div>
    <button class="boton secundario" id="volver">Volver</button>
  `;
  app.querySelectorAll('[data-opcion]').forEach((b) => {
    b.onclick = () => {
      borrar();
      partida = nuevaPartida(b.dataset.opcion);
      prepararPlanes();
      aviso = `Elegiste la opción ${b.dataset.opcion}. Compraste la máquina de tazas: te quedan ${plata(partida.plata)} para insumos.`;
      guardarPartida();
      pantallaSemana();
    };
  });
  document.getElementById('volver').onclick = pantallaInicio;
}

// ---------- Bloques comunes ----------
function bloqueEncabezado(e, extra = '') {
  const c = calendario(e.semana);
  return `<div class="encabezado">
      <div class="fila">
        <span class="plata">${plata(e.plata)}</span>
        <span class="fecha">Semana ${e.semana} · ${c.nombreMes} (${c.estacion})</span>
        <button class="menu-boton" id="menuBoton" aria-label="Menú">⋮</button>
      </div>
      ${extra}
      ${menuAbierto ? `<div class="menu">
        <button id="menuInicio">Volver al inicio</button>
        <button id="reiniciar" class="peligro">${confirmarReinicio ? 'Tocá de nuevo para borrar la partida' : 'Empezar de nuevo'}</button>
      </div>` : ''}
    </div>`;
}

function conectarMenu() {
  document.getElementById('menuBoton').onclick = () => { menuAbierto = !menuAbierto; confirmarReinicio = false; refrescar(); };
  const inicio = document.getElementById('menuInicio');
  if (inicio) inicio.onclick = () => { menuAbierto = false; pantallaInicio(); };
  const reiniciar = document.getElementById('reiniciar');
  if (reiniciar) reiniciar.onclick = () => {
    if (!confirmarReinicio) { confirmarReinicio = true; refrescar(); return; }
    confirmarReinicio = false;
    menuAbierto = false;
    borrar();
    partida = null;
    pantallaInicio();
  };
}

function bloqueEstado(e) {
  const c = calendario(e.semana);
  const p = e.prestamo;
  let estadoPrestamo;
  if (p.pagado) estadoPrestamo = 'Pagado ✔';
  else if (p.opcion === 'A') estadoPrestamo = p.vencido ? `Vencido: debés ${plata(p.deuda)}` : `Opción A · hoy saldás con ${plata(costoPagoAnticipadoA(e.semana))}`;
  else estadoPrestamo = `Opción B · ${p.cuotasPagadas + p.cuotasPerdonadas}/${PRESTAMO.B.cuotas} cuotas${p.atrasadas ? ` · ${p.atrasadas} atrasada(s)` : ''}`;
  return `<div class="tarjeta">
      <div class="stats">
        <div class="stat"><div class="etiqueta">Reputación (ciudad)</div><div class="valor">${Math.floor(e.rep)}/100</div><div class="barra"><span style="width:${pct(e.rep)}"></span></div></div>
        <div class="stat"><div class="etiqueta">Lelo (tu primo)</div><div class="valor">${e.mejorDeLaCiudad ? 'Tu empleado' : `${Math.floor(e.primo.rep)}/100`}</div><div class="barra"><span style="width:${pct(e.mejorDeLaCiudad ? 0 : e.primo.rep)}"></span></div></div>
        <div class="stat"><div class="etiqueta">Experiencia</div><div class="valor">${Math.floor(e.exp)}/100</div><div class="barra"><span style="width:${pct(e.exp)}"></span></div></div>
        <div class="stat"><div class="etiqueta">Cansancio</div><div class="valor">${Math.round(e.cansancio)}/100</div><div class="barra cansancio"><span style="width:${pct(e.cansancio)}"></span></div></div>
        <div class="stat"><div class="etiqueta">Préstamo</div><div class="valor" style="font-size:.85rem">${estadoPrestamo}</div></div>
        <div class="stat"><div class="etiqueta">Confianza del tío</div><div class="valor">${e.tio.confianza}/100</div></div>
        <div class="stat"><div class="etiqueta">Equipo</div><div class="valor">${empleadosContratados(e)}/${cupoEquipo(e)}${e.equipo.empleados.some((x) => x.esLelo) ? ' + Lelo' : ''}</div></div>
        <div class="stat"><div class="etiqueta">Sueldos por mes</div><div class="valor">${plata(e.equipo.empleados.reduce((t, x) => t + x.sueldo, 0))}</div></div>
      </div>
      <p class="suave" style="margin-top:8px">Stock: ${Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]).map((id) => `${e.stock[id]} ${nombreUnidades(id, e.stock[id])}`).join(' · ')}</p>
      <p class="suave">Gastos fijos del mes: ${plata(gastosFijosDelMes(e))}${e.equipo.empleados.length ? ' más sueldos' : ''} (se pagan en la última semana de ${c.nombreMes.toLowerCase()}${c.finDeMes ? ': ¡es esta!' : ''}).</p>
    </div>`;
}

function barraInferior(horas, costo, errores, textoBoton, idBoton) {
  const horasPct = (horas / HORAS_POR_SEMANA) * 100;
  return `<div class="barra-inferior"><div class="contenido">
      <div class="resumen-plan"><span>Tus horas: <strong>${String(horas).replace('.', ',')}</strong> / ${HORAS_POR_SEMANA}${horas > CANSANCIO.umbral ? ' <span class="faltan">te cansa</span>' : ''}</span>${costo !== null ? `<span>Gastás: <strong>${plata(costo)}</strong></span>` : ''}</div>
      <div class="barra horas ${horas > HORAS_POR_SEMANA ? 'pasado' : ''}" style="margin-bottom:8px"><span style="width:${pct(horasPct)}"></span></div>
      ${errores.length ? `<ul class="errores">${errores.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <button class="boton" id="${idBoton}" ${errores.length ? 'disabled' : ''}>${textoBoton}</button>
    </div></div>`;
}

function conectarComprasYReinicio() {
  const gorras = document.getElementById('comprarGorras');
  if (gorras) gorras.onclick = () => { const r = comprarMaquina(partida, 'gorras'); aviso = r.ok ? r.mensaje : r.motivo; if (r.ok) guardarPartida(); refrescar(true); };
  const pagar = document.getElementById('pagarTio');
  if (pagar) pagar.onclick = () => { const r = pagarPrestamoA(partida); aviso = r.ok ? r.mensaje : r.motivo; if (r.ok) guardarPartida(); refrescar(true); };
}

function bloqueComprasYReinicio(e) {
  const p = e.prestamo;
  return `<div class="tarjeta">
      <h2>Comprar y pagar</h2>
      ${!e.maquinas.gorras ? `<button class="boton secundario" id="comprarGorras">Comprar máquina de gorras (${plata(MAQUINAS.gorras.precio)})</button>` : '<p class="suave">Ya tenés la máquina de gorras.</p>'}
      ${p.opcion === 'A' && !p.pagado ? `<button class="boton secundario" id="pagarTio">Pagarle al tío ahora (${plata(p.vencido ? p.deuda : costoPagoAnticipadoA(e.semana))})</button>` : ''}
    </div>`;
}

// ---------- Equipo ----------
const semEquipoPub = () => ({ capacitacion: pub.capacitar, feriaVendedor: pub.feriaVendedor });
const nombreVariante = (x) => (x.esLelo ? 'Primo' : PUESTOS[x.puesto].variantes[x.variante].nombre);
// "Operario · Senior", o solo "Operario" si la variante se llama igual que el puesto
const tituloPuesto = (x) => {
  const p = PUESTOS[x.puesto].nombre;
  const v = nombreVariante(x);
  return v === p ? p : x.esLelo ? `${v} · ${p.toLowerCase()}` : `${p} · ${v}`;
};
const listaNombres = (xs) => xs.map((x) => x.nombre).join(' y ');

function lineaVendedores(e) {
  const vs = presentes(e, 'vendedor');
  if (!vs.length) return '';
  const h = vs.reduce((t, v) => t + horasEmpleado(e, v, semEquipoPub()), 0);
  return `<p class="suave" style="margin-top:8px">Además, ${listaNombres(vs)} ${vs.length > 1 ? 'suman' : 'suma'} <strong>${String(h).replace('.', ',')} h</strong> de redes esta semana.</p>`;
}

function opcionFeriaVendedor(e) {
  if (!pub.feria) return '';
  const v = presentes(e, 'vendedor').find((x) => horasEmpleado(e, x, { capacitacion: pub.capacitar }) >= VENTAS.feria.horas);
  if (!v) return '';
  return `<label class="interruptor">
      <span><strong>Que vaya ${v.nombre} por vos</strong><br><span class="suave">Te ahorrás las ${VENTAS.feria.horas} h; se las saca a sus horas de redes. Vende según su experiencia.</span></span>
      <input type="checkbox" id="feriaVendedor" data-id="${v.id}" ${pub.feriaVendedor === v.id ? 'checked' : ''}>
    </label>`;
}

function htmlRasgo(x, ocultoTexto) {
  if (!x.rasgo) return '';
  if (!x.rasgoVisible) return `<div><span class="rasgo">${ocultoTexto}</span></div>`;
  const r = RASGOS[x.rasgo];
  return `<div><span class="rasgo ${r.bueno ? 'bueno' : 'malo'}">${nombreRasgo(x.rasgo, x.nombre)}</span> <span class="detalle">${r.efecto}</span></div>`;
}

function htmlProductosVendedor(x) {
  if (x.puesto !== 'vendedor') return '';
  const va = PUESTOS.vendedor.variantes[x.variante];
  return `<div class="detalle">Empuja ${PRODUCTOS[x.fuerte].plural} (+${Math.round(va.fuerte * 100)}%) · descuida ${PRODUCTOS[x.descuidado].plural} (−${Math.round(va.descuidado * 100)}%)${va.comision ? ` · cobra ${Math.round(va.comision * 100)}% de comisión` : ''}</div>`;
}

function htmlCandidato(c, origen, indice, extra = '') {
  return `<div class="empleado">
      <div class="cabeza">${imagen(c.puesto)}<div>
        <div class="nombre">${c.nombre} <span class="chip">${tituloPuesto(c)}</span></div>
        <div class="detalle">Experiencia ${c.exp} · ${plata(c.sueldo)} por mes · ${PUESTOS[c.puesto].horas} h por semana de ${PUESTOS[c.puesto].tarea}</div>
        ${htmlProductosVendedor(c)}
        ${htmlRasgo(c, 'Rasgo: no sabés cómo es')}
      </div></div>
      <div class="acciones"><button class="chico" data-contratar="${origen}" data-indice="${indice}">Contratar</button>${extra}</div>
    </div>`;
}

function htmlEmpleado(e, x) {
  const h = horasEmpleado(e, x, semEquipoPub());
  const tarea = x.esLelo ? 'producción' : PUESTOS[x.puesto].tarea;
  let acciones = '';
  if (x.pideAumento) {
    acciones += `<span class="detalle">Te pide un aumento a ${plata(x.pideAumento)}.</span>
      <button class="chico" data-aumento="${x.id}" data-acepta="1">Dárselo</button>
      <button class="chico" data-aumento="${x.id}" data-acepta="0">No</button>`;
  } else if (x.desganado) {
    acciones += `<span class="detalle">Está desganado (rinde menos).</span> <button class="chico" data-dar-aumento="${x.id}">Darle un aumento</button>`;
  }
  if (!x.esLelo) {
    acciones += confirmarDespido === x.id
      ? `<button class="chico peligro" data-despedir="${x.id}">Tocá de nuevo: cuesta ${plata(costoDespido(e, x))}</button>`
      : `<button class="chico" data-despedir="${x.id}">Despedir</button>`;
  }
  return `<div class="empleado">
      <div class="cabeza">${imagen(x.esLelo ? 'lelo' : x.puesto)}<div>
        <div class="nombre">${x.nombre} <span class="chip">${tituloPuesto(x)}</span>${x.leal && !x.esLelo ? ' <span class="chip">de Chuchu</span>' : ''}</div>
        <div class="detalle">${tarea} · experiencia ${Math.floor(x.exp)} · ${plata(x.sueldo)} por mes · ${x.falta ? '<strong>falta esta semana</strong>' : `${String(h).replace('.', ',')} h esta semana`}</div>
        ${htmlProductosVendedor(x)}
        ${htmlRasgo(x, 'Rasgo: lo vas a conocer trabajando')}
      </div></div>
      ${acciones ? `<div class="acciones">${acciones}</div>` : ''}
    </div>`;
}

function bloqueCapacitar(e) {
  if (!presentes(e).length) return '';
  const ensenar = productosParaEnsenar(e);
  return `<div class="subtitulo">Capacitar al equipo</div>
    <p class="suave">Si nadie los capacita en el mes, pierden ${EQUIPO.bajaExpPorMes} de experiencia (Lelo, la mitad).</p>
    <label class="interruptor">
      <span><strong>Curso para el equipo</strong><br><span class="suave">${plata(costoCapacitacion(e, 'curso'))} (${plata(CAPACITACION.curso.costoPorEmpleado)} cada uno) · les saca ${CAPACITACION.curso.horas} h esta semana · +${CAPACITACION.curso.puntos} de experiencia</span></span>
      <input type="radio" name="capacitar" value="curso" ${pub.capacitar === 'curso' ? 'checked' : ''}>
    </label>
    <label class="interruptor">
      <span><strong>Los capacitás vos</strong><br><span class="suave">${CAPACITACION.vos.horas} h tuyas · ${plata(CAPACITACION.vos.buffet)} de facturas · ${ensenar.length ? `usás ${ensenar.map((id) => `una ${PRODUCTOS[id].singular}`).join(' y ')} del stock` : 'necesitás algo en stock para enseñar'} · +${CAPACITACION.vos.puntos}, sin pasar tu nivel (${Math.floor(e.exp)})</span></span>
      <input type="radio" name="capacitar" value="vos" ${pub.capacitar === 'vos' ? 'checked' : ''}>
    </label>
    ${pub.capacitar ? '<button class="chico" id="sinCapacitar" style="margin-top:8px">No capacitar esta semana</button>' : ''}`;
}

function bloqueContratar(e) {
  const lleno = empleadosContratados(e) >= cupoEquipo(e);
  const ch = e.equipo.chuchu;
  if (lleno) return `<div class="subtitulo">Contratar</div><p class="suave">Tenés el cupo completo de la ciudad (${cupoEquipo(e)} empleados${e.equipo.empleados.some((x) => x.esLelo) ? ', más Lelo' : ''}).</p>`;

  // Bolsa del municipio
  let bolsa;
  if (fuisteALaBolsa(e)) {
    const cs = e.equipo.bolsa.candidatos;
    bolsa = cs.length ? cs.map((c, i) => htmlCandidato(c, 'bolsa', i)).join('') : '<p class="suave">No quedó nadie más en la bolsa esta semana.</p>';
  } else {
    bolsa = `<p class="suave">Ves todo de cada candidato, pero cobran un ${Math.round(EQUIPO.bolsa.recargo * 100)}% más que la media.</p>
      <button class="boton secundario" id="irBolsa">Ir a la bolsa (${EQUIPO.bolsa.horas} h de tu domingo)</button>`;
  }

  // Chuchu
  let chuchu;
  if (!chuchuDisponible(e)) {
    chuchu = `<p class="suave">Chuchu no está: ${ch.excusa}. Vuelve en ${ch.afueraHasta - e.semana} semana${ch.afueraHasta - e.semana > 1 ? 's' : ''}.</p>`;
  } else if (ch.candidato) {
    chuchu = `<div class="chuchu">${ch.candidato.frase}</div>${htmlCandidato(ch.candidato, 'chuchu', 0, '<button class="chico" id="chuchuNo">No, gracias</button>')}`;
  } else if (ch.llamadoSemana === e.semana) {
    chuchu = '<p class="suave">Ya hablaste con Chuchu esta semana.</p>';
  } else {
    chuchu = `<p class="suave">Siempre tiene un conocido: cobra un ${Math.round(EQUIPO.chuchu.descuento * 100)}% menos que la media y es de confianza (nunca se va), pero no sabés cómo es hasta que trabaja.</p>
      <div class="alterna"><button class="chico" data-chuchu="operario">Pedirle un operario</button><button class="chico" data-chuchu="vendedor">Pedirle un vendedor</button></div>`;
  }

  // Anuncio
  const a = e.equipo.anuncio;
  let anuncio;
  if (a?.candidato) {
    anuncio = htmlCandidato(a.candidato, 'anuncio', 0, '<button class="chico" id="descartarAnuncio">Descartar</button>');
  } else if (a) {
    anuncio = `<p class="suave">Publicaste un anuncio de ${PUESTOS[a.puesto].nombre.toLowerCase()} por ${plata(a.sueldo)}: el domingo que viene se presenta alguien.</p>`;
  } else {
    const f = anuncioForm;
    const vars = PUESTOS[f.puesto].variantes;
    if (!f.sueldo) f.sueldo = mediaSueldo(e, f.puesto, Object.keys(vars)[1]);
    anuncio = `<p class="suave">Fijás vos el sueldo y el domingo que viene se presenta alguien que lo acepta. Cuanto más pagues frente a la media, mejor viene.</p>
      <div class="alterna">${Object.keys(PUESTOS).map((id) => `<button class="chico ${f.puesto === id ? 'activo' : ''}" data-anuncio-puesto="${id}">${PUESTOS[id].nombre}</button>`).join('')}</div>
      <p class="suave">Media del mercado: ${Object.keys(vars).map((v) => `${vars[v].nombre.toLowerCase()} ${plata(mediaSueldo(e, f.puesto, v))}`).join(' · ')}</p>
      <div class="producto">
        <div class="info"><div class="nombre">Sueldo que ofrecés</div><div class="detalle">por mes</div></div>
        <div class="paso"><button data-anuncio-sueldo="-1" aria-label="Menos">−</button><span class="numero" style="min-width:86px">${plata(f.sueldo)}</span><button data-anuncio-sueldo="1" aria-label="Más">+</button></div>
      </div>
      <button class="boton secundario" id="publicarAnuncio">Publicar anuncio (${plata(EQUIPO.anuncio.costo)})</button>`;
  }

  return `<div class="subtitulo">Contratar · ${empleadosContratados(e)}/${cupoEquipo(e)}</div>
    <p class="suave">Los operarios producen por vos y los vendedores hacen redes y pueden ir a la feria. Cada uno trabaja medio día y cobra a fin de mes.</p>
    <div class="subtitulo" style="border-top:0;margin-top:4px">Bolsa de trabajo del municipio</div>${bolsa}
    <div class="subtitulo"><span class="con-avatar" style="align-items:center">${imagen('chuchu')} Llamar a Chuchu</span></div>${chuchu}
    <div class="subtitulo">Poner un anuncio</div>${anuncio}`;
}

function bloqueEquipo(e) {
  const emps = e.equipo.empleados;
  return `<div class="tarjeta">
      <h2>Tu equipo</h2>
      ${emps.length ? emps.map((x) => htmlEmpleado(e, x)).join('') : '<p class="suave">Por ahora trabajás solo. Si no te dan las horas o estás muy cansado, contratá a alguien.</p>'}
      ${bloqueCapacitar(e)}
      ${bloqueContratar(e)}
    </div>`;
}

function accionEquipo(r, arriba = true) {
  aviso = r.ok ? r.mensaje || null : r.motivo;
  if (r.ok) guardarPartida();
  refrescar(arriba && Boolean(aviso));
}

function conectarEquipo() {
  const e = partida;
  const fv = document.getElementById('feriaVendedor');
  if (fv) fv.onchange = (ev) => { pub.feriaVendedor = ev.target.checked ? fv.dataset.id : null; refrescar(); };
  app.querySelectorAll('input[name="capacitar"]').forEach((r) => { r.onchange = () => { pub.capacitar = r.value; refrescar(); }; });
  const sinCap = document.getElementById('sinCapacitar');
  if (sinCap) sinCap.onclick = () => { pub.capacitar = null; refrescar(); };
  app.querySelectorAll('[data-contratar]').forEach((b) => {
    b.onclick = () => accionEquipo(contratar(e, b.dataset.contratar, Number(b.dataset.indice)));
  });
  app.querySelectorAll('[data-despedir]').forEach((b) => {
    b.onclick = () => {
      if (confirmarDespido !== b.dataset.despedir) { confirmarDespido = b.dataset.despedir; refrescar(); return; }
      confirmarDespido = null;
      accionEquipo(despedir(e, b.dataset.despedir));
    };
  });
  app.querySelectorAll('[data-aumento]').forEach((b) => { b.onclick = () => accionEquipo(responderAumento(e, b.dataset.aumento, b.dataset.acepta === '1')); });
  app.querySelectorAll('[data-dar-aumento]').forEach((b) => { b.onclick = () => accionEquipo(darAumento(e, b.dataset.darAumento)); });
  const irBolsa = document.getElementById('irBolsa');
  if (irBolsa) irBolsa.onclick = () => { const r = irALaBolsa(e); if (r.ok) guardarPartida(); else aviso = r.motivo; refrescar(!r.ok); };
  app.querySelectorAll('[data-chuchu]').forEach((b) => {
    b.onclick = () => { const r = llamarAChuchu(e, b.dataset.chuchu); if (r.ok) guardarPartida(); else aviso = r.motivo; refrescar(!r.ok); };
  });
  const chuchuNo = document.getElementById('chuchuNo');
  if (chuchuNo) chuchuNo.onclick = () => { rechazarChuchu(e); guardarPartida(); refrescar(); };
  app.querySelectorAll('[data-anuncio-puesto]').forEach((b) => { b.onclick = () => { anuncioForm = { puesto: b.dataset.anuncioPuesto, sueldo: null }; refrescar(); }; });
  app.querySelectorAll('[data-anuncio-sueldo]').forEach((b) => {
    b.onclick = () => { anuncioForm.sueldo = Math.max(EQUIPO.anuncio.paso, anuncioForm.sueldo + Number(b.dataset.anuncioSueldo) * EQUIPO.anuncio.paso); refrescar(); };
  });
  const pubAnuncio = document.getElementById('publicarAnuncio');
  if (pubAnuncio) pubAnuncio.onclick = () => { const r = publicarAnuncio(e, anuncioForm.puesto, anuncioForm.sueldo); anuncioForm.sueldo = null; accionEquipo(r); };
  const desc = document.getElementById('descartarAnuncio');
  if (desc) desc.onclick = () => { descartarAnuncio(e); guardarPartida(); refrescar(); };
}

// Sábado: cuánto produce el equipo
function lineaOperarios(e) {
  const ops = presentes(e, 'operario');
  const faltan = e.equipo.empleados.filter((x) => x.falta);
  if (!ops.length && !faltan.length) return '';
  const cap = capacidadEquipo(e);
  return `<p class="suave">${ops.length ? `${listaNombres(ops)} ${ops.length > 1 ? 'tienen' : 'tiene'} <strong>${String(cap.produccion).replace('.', ',')} h</strong> para producir. Lo que no les entra lo hacés vos.` : ''}${faltan.length ? ` ${listaNombres(faltan)} faltó esta semana.` : ''}</p>`;
}

function repartoTexto(e) {
  if (!presentes(e, 'operario').length) return '';
  const r = repartirProduccion(e, plan.producir);
  const delEquipo = r.operarios.reduce((t, o) => t + Object.values(o.unidades).reduce((a, b) => a + b, 0), 0);
  const tuyas = Object.values(r.vos.unidades).reduce((a, b) => a + b, 0);
  if (!delEquipo && !tuyas) return '';
  return `<p class="suave" style="margin-top:8px">De lo que cargaste, tu equipo hace <strong>${delEquipo}</strong> y vos <strong>${tuyas}</strong>.</p>`;
}

// ---------- Paso 1: publicidad en redes ----------
function pantallaPublicidad() {
  const e = partida;
  const fecha = avisoFecha(e.semana);
  const tutorial = e.semana <= 8 ? TUTORIAL[e.semana] : null;
  const v = validarPublicidad(e, pub);
  const horas = horasDomingo(e, pub);

  app.innerHTML = `
    ${bloqueEncabezado(e, '<div class="paso-semana">Domingo · Publicidad</div>')}
    ${aviso ? `<div class="tarjeta tio"><p>${aviso}</p></div>` : ''}
    ${tutorial ? `<div class="tarjeta tio con-avatar">${imagen('tio')}<p>${tutorial}</p></div>` : ''}
    ${fecha ? `<div class="tarjeta tio con-avatar">${imagen('calendario')}<p>${fecha}</p></div>` : ''}
    ${e.mejorDeLaCiudad ? '<div class="tarjeta"><p><strong>Sos el mejor de la ciudad.</strong> Lelo trabaja para vos como operario. La pelea por la provincia llega en la próxima versión.</p></div>' : ''}
    ${puedeHacerPromo(e) ? `<div class="tarjeta rumor">
      <div class="con-avatar">${imagen('lelo')}<p>${e.primo.rumor}</p></div>
      <label class="interruptor">
        <span><strong>Lanzar promo de contraataque</strong><br><span class="suave">${Math.round(PROMO.descuento * 100)}% de descuento en los pedidos de esta semana · ${PROMO.horas} h. Si Lelo ataca, no te saca ningún pedido y te llegan un ${Math.round(PROMO.extraDemanda * 100)}% más. Si era humo, regalaste el descuento.</span></span>
        <input type="checkbox" id="promo" ${pub.promo ? 'checked' : ''}>
      </label>
    </div>` : ''}

    <div class="tarjeta">
      <h2>Publicidad en redes</h2>
      <p class="suave">Publicás en Instagram y Marketplace y respondés consultas: <strong>así te llegan los pedidos</strong>. Cuantas más horas, más pedidos, hasta que el mercado se agota. Al final de la semana te vas a enterar si te quedaste corto o si te pasaste.</p>
      <div class="producto">
        <div class="info"><div class="nombre">Tus horas de publicidad</div><div class="detalle">El resto de las horas te quedan para producir el sábado.</div></div>
        <div class="paso">
          <button data-redes="-1" aria-label="Menos horas">−</button>
          <span class="numero">${pub.horasRedes}</span>
          <button data-redes="1" aria-label="Más horas">+</button>
        </div>
      </div>
      ${lineaVendedores(e)}
    </div>

    <div class="tarjeta">
      <h2>Feria del domingo</h2>
      <label class="interruptor" style="border-top:0">
        <span><strong>Ir a la feria</strong><br><span class="suave">Mesa ${plata(VENTAS.feria.costoMesa)} · ${VENTAS.feria.horas} h · vendés lo que te sobró de stock (${stockTotal(e) ? `tenés ${stockTotal(e)}` : 'hoy no tenés nada'}). En la feria siempre pasa algo.</span></span>
        <input type="checkbox" id="feria" ${pub.feria ? 'checked' : ''} ${stockTotal(e) ? '' : 'disabled'}>
      </label>
      ${opcionFeriaVendedor(e)}
    </div>

    <div class="tarjeta">
      <h2>Estudiar</h2>
      ${e.curso.semanasRestantes > 0
        ? `<p>Estás haciendo el curso de <strong>${CURSOS[e.curso.id].nombre.toLowerCase()}</strong>: ${CURSOS[e.curso.id].horasPorSemana} h esta semana y termina ${e.curso.semanasRestantes === 1 ? 'esta semana' : `en ${e.curso.semanasRestantes} semanas`}.</p>`
        : `<p class="suave">Un curso corto dura ${Object.values(CURSOS)[0].semanas} semanas, ${Object.values(CURSOS)[0].horasPorSemana} h por semana, y cuesta ${plata(Object.values(CURSOS)[0].costo)}. Lo aprendido se va olvidando de a poco si no te actualizás.</p>
          ${Object.entries(CURSOS).map(([id, cu]) => `<label class="interruptor">
            <span><strong>${cu.nombre}</strong><br><span class="suave">${cu.efecto.charAt(0).toUpperCase() + cu.efecto.slice(1)}. Nivel: ${e.formacion.cursos[id]}/40</span></span>
            <input type="radio" name="curso" value="${id}" ${pub.curso === id ? 'checked' : ''}>
          </label>`).join('')}
          ${pub.curso ? '<button class="chico" id="sinCurso" style="margin-top:8px">No estudiar esta semana</button>' : ''}`}
    </div>

    ${bloqueEquipo(e)}
    ${bloqueEstado(e)}
    ${bloqueComprasYReinicio(e)}
    ${barraInferior(horas, v.costo || null, v.errores, 'Arrancar la semana', 'publicar')}
  `;
  aviso = null;
  conectarMenu();

  app.querySelectorAll('[data-redes]').forEach((b) => { b.onclick = () => { pub.horasRedes = Math.max(0, pub.horasRedes + Number(b.dataset.redes)); refrescar(); }; });
  const promo = document.getElementById('promo');
  if (promo) promo.onchange = (ev) => { pub.promo = ev.target.checked; refrescar(); };
  document.getElementById('feria').onchange = (ev) => { pub.feria = ev.target.checked; if (!pub.feria) pub.feriaVendedor = null; refrescar(); };
  conectarEquipo();
  app.querySelectorAll('input[name="curso"]').forEach((r) => { r.onchange = () => { pub.curso = r.value; refrescar(); }; });
  const sinCurso = document.getElementById('sinCurso');
  if (sinCurso) sinCurso.onclick = () => { pub.curso = null; refrescar(); };
  conectarComprasYReinicio();
  document.getElementById('publicar').onclick = () => {
    const r = publicar(partida, pub);
    if (!r.ok) { aviso = r.errores.join(' '); refrescar(true); return; }
    partida.ultimaPublicidad = pub.horasRedes;
    pub = planPublicidad();
    guardarPartida();
    plan = planProduccion();
    pantallaAnimacion(r.semana);
  };
}


// ---------- La semana de publicidad, día por día ----------
function frenarAnimacion() {
  temporizadores.forEach(clearTimeout);
  temporizadores = [];
}

function pantallaAnimacion(sem) {
  frenarAnimacion();
  window.scrollTo(0, 0);
  const e = partida;
  const c = calendario(e.semana);
  app.innerHTML = `
    <div class="encabezado">
      <div class="fila"><span class="plata">${plata(e.plata)}</span><span class="fecha">Semana ${e.semana} · ${c.nombreMes}</span></div>
      <div class="paso-semana">Publicidad en marcha · ${sem.horasRedes} h</div>
    </div>
    <div class="dias">${sem.dias.map((d, i) => `<span class="dia" data-dia="${i}">${d.nombre}</span>`).join('')}</div>
    <div class="tarjeta"><ul class="feed" id="feed"></ul></div>
    <div class="barra-inferior"><div class="contenido">
      <button class="boton secundario" id="saltar">Saltar</button>
    </div></div>
  `;
  const feed = document.getElementById('feed');
  const marcarDia = (i) => app.querySelectorAll('.dia').forEach((el) => {
    const n = Number(el.dataset.dia);
    el.classList.toggle('activo', n === i);
    el.classList.toggle('pasado', n < i);
  });
  const agregar = (item) => {
    const li = document.createElement('li');
    li.className = `nuevo ${item.tipo}`;
    li.textContent = item.texto;
    feed.appendChild(li);
    li.scrollIntoView({ block: 'nearest' });
  };
  const terminar = () => {
    frenarAnimacion();
    marcarDia(7);
    feed.innerHTML = '';
    sem.dias.forEach((d, i) => {
      const titulo = document.createElement('li');
      titulo.className = 'titulo-dia';
      titulo.textContent = DIAS_LARGOS[i];
      feed.appendChild(titulo);
      if (!d.items.length) agregar({ texto: 'Sin novedades.', tipo: 'vacio' });
      d.items.forEach(agregar);
    });
    const barra = app.querySelector('.barra-inferior .contenido');
    barra.innerHTML = '<button class="boton" id="aProducir">Es sábado: ir a producir</button>';
    document.getElementById('aProducir').onclick = () => { window.scrollTo(0, 0); pantallaSemana(); };
  };
  let t = 300;
  sem.dias.forEach((d, i) => {
    temporizadores.push(setTimeout(() => {
      marcarDia(i);
      const titulo = document.createElement('li');
      titulo.className = 'titulo-dia';
      titulo.textContent = DIAS_LARGOS[i];
      feed.appendChild(titulo);
      if (!d.items.length) agregar({ texto: 'Sin novedades.', tipo: 'vacio' });
    }, t));
    t += 350;
    d.items.forEach((item) => {
      temporizadores.push(setTimeout(() => agregar(item), t));
      t += 450;
    });
    t += 300;
  });
  temporizadores.push(setTimeout(terminar, t + 400));
  document.getElementById('saltar').onclick = terminar;
}

// ---------- Paso 2: pedidos y producción ----------
function pantallaPedidos() {
  const e = partida;
  const sem = e.semanaEnCurso;
  const pedidas = unidadesPedidas(sem);
  const productos = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  const v = validarPlan(e, plan);
  const precio = (p) => Math.round(p.cantidad * PRODUCTOS[p.producto].precio * (sem.promo ? 1 - PROMO.descuento : 1));

  app.innerHTML = `
    ${bloqueEncabezado(e, '<div class="paso-semana">Sábado · Pedidos y producción</div>')}
    ${aviso ? `<div class="tarjeta tio"><p>${aviso}</p></div>` : ''}
    ${sem.eventos.length ? `<div class="tarjeta"><ul class="eventos">${sem.eventos.map((ev) => `<li class="${ev.tipo}">${ev.texto}</li>`).join('')}</ul></div>` : ''}

    <div class="tarjeta">
      <h2>Pedidos de la semana (${sem.pedidos.filter((p) => !p.rechazado).length})</h2>
      ${sem.pedidos.length ? sem.pedidos.map((p) => `
        <div class="pedido ${p.rechazado ? 'rechazado' : ''}">
          <div class="info">
            <div class="nombre">${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}</div>
            <div class="detalle">${p.cliente} · ${plata(precio(p))}${p.rechazado ? ' · rechazado' : ''}</div>
          </div>
          <button class="chico" data-rechazar="${p.id}">${p.rechazado ? 'Aceptar' : 'Rechazar'}</button>
        </div>`).join('') : '<p class="suave">No llegaron pedidos. Probá con más horas de publicidad la semana que viene.</p>'}
      <p class="suave" style="margin-top:8px">Si no entregás un pedido aceptado perdés reputación. Si sabés que no llegás, rechazalo: perdés mucho menos.</p>
    </div>

    <div class="tarjeta">
      <h2>Producir</h2>
      ${lineaOperarios(e)}
      ${productos.map((id) => {
        const pr = PRODUCTOS[id];
        const faltan = Math.max(0, pedidas[id] - e.stock[id] - plan.producir[id]);
        return `<div class="producto">
          ${imagen(id)}
          <div class="info">
            <div class="nombre">${pr.nombre}</div>
            <div class="detalle">Pedidos ${pedidas[id]} · stock ${e.stock[id]} · ${faltan > 0 ? `<span class="faltan">faltan ${faltan}</span>` : pedidas[id] ? '<span class="cubierto">cubierto ✔</span>' : 'sin pedidos'}<br>${Math.round(horasPorUnidad(e, id) * 60)} min c/u · costo ${plata(pr.costo)}</div>
          </div>
          <div class="paso">
            <button data-menos="${id}" aria-label="Menos">−</button>
            <span class="numero">${plan.producir[id]}</span>
            <button data-mas="${id}" aria-label="Más">+</button>
          </div>
        </div>`;
      }).join('')}
      ${repartoTexto(e)}
      <p class="suave" style="margin-top:8px">Alguna puede salir mal en la prensa. Cuanta más experiencia tengas, menos errores vas a cometer: producir una de más te cubre.</p>
      <p class="suave">Lo que te sobre queda en stock para llevar a la feria del domingo. Pero no acumules mucho: lo guardado siempre se termina rompiendo.</p>
    </div>

    ${bloqueEstado(e)}
    ${barraInferior(v.horas, v.costo, v.errores, 'Producir y entregar el domingo', 'terminar')}
  `;
  aviso = null;
  conectarMenu();

  app.querySelectorAll('[data-rechazar]').forEach((b) => {
    b.onclick = () => {
      const p = sem.pedidos.find((x) => x.id === b.dataset.rechazar);
      rechazarPedido(partida, p.id, !p.rechazado);
      guardarPartida();
      refrescar();
    };
  });
  app.querySelectorAll('[data-mas]').forEach((b) => { b.onclick = () => { plan.producir[b.dataset.mas]++; refrescar(); }; });
  app.querySelectorAll('[data-menos]').forEach((b) => { b.onclick = () => { plan.producir[b.dataset.menos] = Math.max(0, plan.producir[b.dataset.menos] - 1); refrescar(); }; });
  document.getElementById('terminar').onclick = terminarSemana;
}

function pantallaSemana() {
  frenarAnimacion();
  if (partida.semanaEnCurso) pantallaPedidos();
  else pantallaPublicidad();
}

function refrescar(arriba = false) {
  const y = window.scrollY;
  pantallaSemana();
  window.scrollTo(0, arriba ? 0 : y);
}

function terminarSemana() {
  const r = cerrarSemana(partida, plan);
  if (!r.ok) { aviso = r.errores.join(' '); refrescar(true); return; }
  guardarPartida();
  pub = planPublicidad();
  pantallaResumen(r.resumen);
}

// ---------- Pantalla: resumen de la semana ----------
function pantallaResumen(r) {
  window.scrollTo(0, 0);
  const neto = r.ingresos - r.gastos;
  app.innerHTML = `
    <div class="encabezado">
      <div class="fila"><span class="plata">${plata(r.plata)}</span><span class="fecha">Resumen · semana ${r.semana} · ${r.mes}</span></div>
    </div>
    <div class="tarjeta">
      <div class="numeros">
        <span>Ingresos</span><span class="positivo">+${plata(r.ingresos)}</span>
        <span>Gastos</span><span class="negativo">−${plata(r.gastos)}</span>
        <span><strong>Resultado de la semana</strong></span><span class="${neto >= 0 ? 'positivo' : 'negativo'}">${neto >= 0 ? '+' : ''}${plata(neto)}</span>
        <span>Reputación</span><span>${Math.floor(r.rep)}/100 (${r.repDelta >= 0 ? '+' : ''}${r.repDelta})</span>
        ${r.gananciaMes !== undefined ? `<span>Resultado del mes</span><span class="${r.gananciaMes >= 0 ? 'positivo' : 'negativo'}">${plata(r.gananciaMes)}</span>` : ''}
      </div>
    </div>
    <div class="tarjeta">
      ${r.lineas.map((l) => `<p>${l}</p>`).join('')}
      ${r.eventos.length ? `<ul class="eventos">${r.eventos.map((ev) => `<li class="${ev.tipo}">${ev.texto}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="barra-inferior"><div class="contenido">
      <button class="boton" id="seguir">${r.hito === 'quiebra' ? 'Ver final' : r.hito === 'mejorDeLaCiudad' ? '¡Ver el logro!' : 'Siguiente semana'}</button>
    </div></div>
  `;
  document.getElementById('seguir').onclick = () => {
    if (r.hito === 'mejorDeLaCiudad') pantallaLogro();
    else siguientePantalla();
  };
}

// ---------- Pantallas de final y logro ----------
function pantallaLogro() {
  window.scrollTo(0, 0);
  const e = partida;
  app.innerHTML = `
    <h1>¡Sos el mejor de la ciudad! 🏆</h1>
    <div class="tarjeta">
      <p>Lelo no pudo competir y cerró el taller. En el almuerzo del domingo, el tío anunció que <strong>ahora trabaja para vos</strong>: entra como operario con experiencia 60 y cobra ${plata(40000)} por mes. Ya lo ves en tu equipo.</p>
      <p>Lo lograste en la semana ${e.semana - 1}, con ${plata(e.plata)} en la caja y ${e.totales.vendidas} productos vendidos.</p>
    </div>
    <div class="tarjeta tio">
      <p>En la próxima versión: la pelea por ser el mejor de la provincia contra Traicio Nero, las máquinas nuevas y las licitaciones de los clubes.</p>
    </div>
    <button class="boton" id="seguir">Seguir jugando</button>
  `;
  document.getElementById('seguir').onclick = siguientePantalla;
}

function pantallaQuiebra() {
  window.scrollTo(0, 0);
  app.innerHTML = `
    <h1>Fundiste 😬</h1>
    <div class="tarjeta">
      <p>Tres meses seguidos en rojo y el taller cerró. Lelo, en las fiestas, no para de mirarte.</p>
      <p>Llegaste a la semana ${partida.semana - 1} con reputación ${Math.floor(partida.rep)}/100.</p>
    </div>
    <button class="boton" id="otra">Empezar de nuevo</button>
  `;
  document.getElementById('otra').onclick = () => { borrar(); partida = null; pantallaPrestamo(); };
}

function siguientePantalla() {
  if (partida.fin === 'quiebra') pantallaQuiebra();
  else { window.scrollTo(0, 0); pantallaSemana(); }
}

// ---------- Arranque ----------
pantallaInicio();
