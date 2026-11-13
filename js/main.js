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
  confianzaTio, prestamoDisponible, pedirPrestamo, proximaMaquina, horasDisponibles, resolverDecision, esSemanaCyber,
  alquilarLocal, dejarLocal, localActual, precioPedido, leloDeViaje,
  MAZO, LOCALES, VOLANTES, SERVICIOS, CYBER, TRAICIO,
  enProvincia, leloCompite, rumorTraicio, ofertarLicitacion, calidadLicitacion, cambiarDefensa, contratarSeguridad, despedirSeguridad,
  subirSueldoSeguridad, mediaSeguridad, responderPedidoEmpresa, tercerizarPedidoEmpresa, unidadesEmpresa, porCobrar,
  abuelaPide, responderAbuela, tercerizarVarios, tercerizarTodo, tercerizarResto, LELO_EMPLEADO,
  ponerNombreTaller, nombreDelTaller, localesDisponibles, PROVINCIA, LELO_GERENTE, DEFENSAS, SEGURIDAD, EMPRESAS, LICITACION, TERCERIZAR,
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
let montoPrestamo = null; // monto que le pedís al tío (préstamo para la próxima máquina)
let ofertaLic = null; // precio por combo que ofertás en la licitación
let temporizadores = [];
let seleccionTerc = null; // pedidos marcados para tercerizar (null = sin modo selección)
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ---------- Utilidades ----------
const plata = (n) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n))}`;
const pct = (v) => `${Math.max(0, Math.min(100, v))}%`;

function planPublicidad() {
  return { horasRedes: partida?.ultimaPublicidad ?? 0, promo: false, feria: false, curso: null, capacitar: null, feriaVendedor: null, volantes: false, volantesVendedor: null, cyber: false };
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
    <div class="tarjeta opcion sec-finanzas">
      <h2>Opción A · Todo junto</h2>
      <ul>
        <li>${plata(PRESTAMO.A.total)} en la semana 52 (20% de interés).</li>
        <li>Si pagás antes, el interés baja (en la semana 26 serían ${plata(costoPagoAnticipadoA(26))}).</li>
        <li>Pagar todo junto te suma mucha confianza con el tío.</li>
        <li>Si no llegás, el tío se enoja mucho.</li>
      </ul>
      <button class="boton" data-opcion="A">Elegir opción A</button>
    </div>
    <div class="tarjeta opcion sec-finanzas">
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

// Secciones contraíbles: cada tarjeta con título lleva un +/− arriba a la derecha (se recuerda por título).
const CLAVE_CONTRAIDAS = 'el-taller-contraidas';
let contraidas = new Set();
try { contraidas = new Set(JSON.parse(localStorage.getItem(CLAVE_CONTRAIDAS) || '[]')); } catch { contraidas = new Set(); }
function claveSeccion(h2) {
  return h2.textContent.replace(/\(.*?\)|[−+]/g, '').replace(/\d+/g, '').trim().slice(0, 40);
}
function hacerContraibles() {
  app.querySelectorAll('.tarjeta').forEach((t) => {
    const h2 = t.querySelector(':scope > h2');
    if (!h2) return;
    const clave = claveSeccion(h2);
    const b = document.createElement('button');
    b.className = 'contraer';
    b.type = 'button';
    const pintar = () => {
      const cerrada = contraidas.has(clave);
      t.classList.toggle('contraida', cerrada);
      b.textContent = cerrada ? '+' : '−';
      b.setAttribute('aria-label', cerrada ? 'Mostrar sección' : 'Achicar sección');
    };
    b.onclick = () => {
      if (contraidas.has(clave)) contraidas.delete(clave); else contraidas.add(clave);
      try { localStorage.setItem(CLAVE_CONTRAIDAS, JSON.stringify([...contraidas])); } catch { /* sin guardado */ }
      pintar();
    };
    t.classList.add('contraible');
    t.prepend(b);
    pintar();
  });
}

function conectarMenu() {
  hacerContraibles();
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
  else if (p.opcion === 'A') estadoPrestamo = p.vencido ? `Vencido: debés ${plata(p.deuda)}` : `Opción A · hoy saldás con ${plata(costoPagoAnticipadoA(e.semana, p))}`;
  else estadoPrestamo = `Opción B · ${p.cuotasPagadas + p.cuotasPerdonadas}/${p.cuotas} cuotas de ${plata(p.cuota)}${p.atrasadas ? ` · ${p.atrasadas} atrasada(s)` : ''}`;
  // Rival: Lelo en la ciudad; en la provincia, Traicio Nero (lo que publicó La Voz de Adentro)
  let rival;
  if (enProvincia(e)) {
    const t = e.traicio;
    const valor = e.mejorDeLaProvincia ? 'Cerró' : t?.visible === null || t?.visible === undefined ? 'Sin noticias todavía' : `${t.visible}/100`;
    rival = `<div class="stat"><div class="etiqueta">${TRAICIO.nombre} (${TRAICIO.empresa})</div><div class="valor" style="font-size:${t?.visible === null ? '.85rem' : '1.1rem'}">${valor}</div><div class="barra"><span style="width:${pct(e.mejorDeLaProvincia ? 0 : t?.visible || 0)}"></span></div>${t?.mesVisible && !e.mejorDeLaProvincia ? `<div class="detalle suave">Según La Voz de Adentro (${t.mesVisible.toLowerCase()})</div>` : ''}</div>`;
  } else {
    rival = `<div class="stat"><div class="etiqueta">Lelo (tu primo)</div><div class="valor">${Math.floor(e.primo.rep)}/100</div><div class="barra"><span style="width:${pct(e.primo.rep)}"></span></div></div>`;
  }
  return `<div class="tarjeta">
      <div class="stats">
        <div class="stat"><div class="etiqueta">Reputación (${enProvincia(e) ? 'provincia' : 'ciudad'})</div><div class="valor">${Math.floor(e.rep)}/100</div><div class="barra"><span style="width:${pct(e.rep)}"></span></div></div>
        ${rival}
        <div class="stat"><div class="etiqueta">Experiencia</div><div class="valor">${Math.floor(e.exp)}/100</div><div class="barra"><span style="width:${pct(e.exp)}"></span></div></div>
        <div class="stat"><div class="etiqueta">Cansancio</div><div class="valor">${Math.round(e.cansancio)}/100</div><div class="barra cansancio"><span style="width:${pct(e.cansancio)}"></span></div></div>
        <div class="stat"><div class="etiqueta">Préstamo</div><div class="valor" style="font-size:.85rem">${estadoPrestamo}</div></div>
        <div class="stat"><div class="etiqueta">Confianza del tío</div><div class="valor">${confianzaTio(e)}/100</div></div>
        <div class="stat"><div class="etiqueta">Equipo · ${localActual(e).nombre.toLowerCase()}</div><div class="valor">${empleadosContratados(e)}/${cupoEquipo(e)}${e.equipo.empleados.some((x) => x.esLelo) ? ' + Lelo' : ''}</div></div>
        <div class="stat"><div class="etiqueta">Sueldos por mes</div><div class="valor">${plata(e.equipo.empleados.reduce((t, x) => t + x.sueldo, 0))}</div></div>
      </div>
      <p class="suave" style="margin-top:8px">Stock: ${Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina] && (!PRODUCTOS[id].soloPedido || e.stock[id])).map((id) => `${e.stock[id]} ${nombreUnidades(id, e.stock[id])}`).join(' · ')}</p>
      ${porCobrar(e) ? `<p class="suave">Por cobrar de empresas: ${plata(porCobrar(e))} (${e.cobros.map((c) => `${c.cliente} en ${c.semana - e.semana} sem.`).join(', ')}).</p>` : ''}
      ${e.retraso && Object.keys(e.retraso).some((m) => e.retraso[m] >= 1 && e.maquinas[m]) ? `<p class="suave">Todavía te estás acostumbrando a ${Object.keys(e.retraso).filter((m) => e.retraso[m] >= 1 && e.maquinas[m]).map((m) => `la ${MAQUINAS[m].nombre.toLowerCase()}`).join(' y ')}: ahí rendís menos hasta que le agarres la mano.</p>` : ''}
      <p class="suave">Gastos fijos del mes: ${plata(gastosFijosDelMes(e))}${localActual(e).alquiler ? ` (incluye ${plata(localActual(e).alquiler)} de alquiler)` : ''}${e.equipo.empleados.length ? ' más sueldos' : ''} (se pagan en la última semana de ${c.nombreMes.toLowerCase()}${c.finDeMes ? ': ¡es esta!' : ''}).</p>
    </div>`;
}

function barraInferior(horas, costo, errores, textoBoton, idBoton) {
  const total = horasDisponibles(partida);
  const horasPct = (horas / total) * 100;
  const ayuda = partida.horasAyuda || 0;
  return `<div class="barra-inferior"><div class="contenido">
      <div class="resumen-plan"><span>Tus horas: <strong>${String(horas).replace('.', ',')}</strong> / ${total}${total !== HORAS_POR_SEMANA ? ` <span class="suave">(esta semana)</span>` : ''}${horas - ayuda > CANSANCIO.umbral ? ' <span class="faltan">te cansa</span>' : ''}</span>${costo !== null ? `<span>Gastás: <strong>${plata(costo)}</strong></span>` : ''}</div>
      <div class="barra horas ${horas > total ? 'pasado' : ''}" style="margin-bottom:8px"><span style="width:${pct(horasPct)}"></span></div>
      ${errores.length ? `<ul class="errores">${errores.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <button class="boton" id="${idBoton}" ${errores.length ? 'disabled' : ''}>${textoBoton}</button>
    </div></div>`;
}

function accionCompra(r) {
  aviso = r.ok ? r.mensaje : r.motivo;
  if (r.ok) guardarPartida();
  refrescar(true);
}

function conectarComprasYReinicio() {
  app.querySelectorAll('[data-comprar]').forEach((b) => { b.onclick = () => accionCompra(comprarMaquina(partida, b.dataset.comprar)); });
  const pagar = document.getElementById('pagarTio');
  if (pagar) pagar.onclick = () => accionCompra(pagarPrestamoA(partida));
  app.querySelectorAll('[data-monto-prestamo]').forEach((b) => {
    b.onclick = () => {
      const d = prestamoDisponible(partida);
      montoPrestamo = Math.max(10000, Math.min(d.tope, (montoPrestamo ?? d.tope) + Number(b.dataset.montoPrestamo) * 10000));
      refrescar();
    };
  });
  app.querySelectorAll('[data-pedir-prestamo]').forEach((b) => {
    b.onclick = () => {
      const d = prestamoDisponible(partida);
      const r = pedirPrestamo(partida, b.dataset.pedirPrestamo, montoPrestamo ?? d.tope);
      montoPrestamo = null;
      accionCompra(r);
    };
  });
  app.querySelectorAll('[data-local]').forEach((b) => { b.onclick = () => accionCompra(alquilarLocal(partida, b.dataset.local)); });
  const dejar = document.getElementById('dejarLocal');
  if (dejar) dejar.onclick = () => accionCompra(dejarLocal(partida));
}

function bloquePrestamoNuevo(e) {
  const d = prestamoDisponible(e);
  if (!e.prestamo.pagado) return '';
  if (!d.ok) return `<p class="suave">${d.motivo}</p>`;
  const monto = Math.min(montoPrestamo ?? d.tope, d.tope);
  const totalA = Math.round(monto * (1 + PRESTAMO.interesA));
  const cuotaB = Math.round((monto * (1 + PRESTAMO.interesB)) / PRESTAMO.B.cuotas / 100) * 100;
  return `<div class="subtitulo">Pedirle otro préstamo al tío</div>
    <p class="suave">Para la ${d.maquina.nombre.toLowerCase()} (${plata(d.maquina.precio)}). Con tu confianza (${d.confianza}/100) te presta hasta <strong>${plata(d.tope)}</strong>, el ${Math.round(d.parte * 100)}% de la máquina. Cuanto más cumplidor seas y mejor reputación tengas, más te presta.</p>
    <div class="producto">
      <div class="info"><div class="nombre">Le pedís</div><div class="detalle">hasta ${plata(d.tope)}</div></div>
      <div class="paso"><button data-monto-prestamo="-1" aria-label="Menos">−</button><span class="numero" style="min-width:86px">${plata(monto)}</span><button data-monto-prestamo="1" aria-label="Más">+</button></div>
    </div>
    <div class="alterna">
      <button class="chico" data-pedir-prestamo="A">Opción A: ${plata(totalA)} en un año</button>
      <button class="chico" data-pedir-prestamo="B">Opción B: ${PRESTAMO.B.cuotas} cuotas de ${plata(cuotaB)}</button>
    </div>`;
}

function bloqueComprasYReinicio(e) {
  const p = e.prestamo;
  const local = localActual(e);
  return `<div class="tarjeta sec-finanzas">
      <h2>Comprar y pagar</h2>
      ${Object.keys(MAQUINAS).filter((m) => !e.maquinas[m]).map((m) => `<button class="boton secundario" data-comprar="${m}">Comprar ${MAQUINAS[m].nombre.toLowerCase()} (${plata(MAQUINAS[m].precio)})</button>`).join('') || '<p class="suave">Ya tenés todas las máquinas.</p>'}
      <p class="suave">${Object.keys(MAQUINAS).filter((m) => !e.maquinas[m]).length ? 'Plancha 30x30: remeras, mangas largas y buzos. Plancha 1x1 m: los mismos en full color, al doble de precio. Calandra: combos para las licitaciones de clubes.' : ''}</p>
      ${p.opcion === 'A' && !p.pagado ? `<button class="boton secundario" id="pagarTio">Pagarle al tío ahora (${plata(p.vencido ? p.deuda : costoPagoAnticipadoA(e.semana, p))})</button>` : ''}
      ${bloquePrestamoNuevo(e)}
      <div class="subtitulo">Dónde trabajás: ${local.nombre.toLowerCase()}</div>
      <p class="suave">Entran hasta ${local.cupo} empleados${local.alquiler ? `. Pagás ${plata(local.alquiler)} de alquiler y ${plata(local.luz)} más de luz por mes` : ''}.</p>
      ${localesDisponibles(e).filter((id) => id !== 'casa' && id !== (e.local || 'casa')).map((id) => `<button class="boton secundario" data-local="${id}">Mudarte a un ${LOCALES[id].nombre.toLowerCase()}: hasta ${LOCALES[id].cupo} empleados, ${plata(LOCALES[id].alquiler)} + ${plata(LOCALES[id].luz)} de luz por mes</button>`).join('')}
      ${(e.local || 'casa') !== 'casa' ? '<button class="chico" id="dejarLocal">Devolver el local y volver a tu casa</button>' : ''}
      ${!enProvincia(e) ? `<p class="suave">El ${LOCALES.grande.nombre.toLowerCase()} (hasta ${LOCALES.grande.cupo}) se consigue en la provincia.</p>` : ''}
    </div>`;
}

// ---------- Equipo ----------
const semEquipoPub = () => ({ capacitacion: pub.capacitar, feriaVendedor: pub.feriaVendedor });
const nombreVariante = (x) => (x.esLelo ? (partida?.leloGerente ? 'Gerente de operaciones' : 'Primo') : PUESTOS[x.puesto].variantes[x.variante].nombre);
const puestosVisibles = (e) => Object.keys(PUESTOS).filter((id) => !PUESTOS[id].desdeProvincia || enProvincia(e));
const textoTarea = (c) => (c.puesto === 'disenador'
  ? `no produce: baja los errores de ${PUESTOS.disenador.variantes[c.variante].maquinas.map((m) => MAQUINAS[m].nombre.toLowerCase()).join(' y ')}`
  : `${PUESTOS[c.puesto].horas} h por semana de ${PUESTOS[c.puesto].tarea}`);
// "Operario · Senior", o solo "Operario" si la variante se llama igual que el puesto
const tituloPuesto = (x) => {
  const p = PUESTOS[x.puesto].nombre;
  const v = nombreVariante(x);
  if (x.esLelo && partida?.leloGerente) return v;
  return v === p ? p : x.esLelo ? `${v} · ${p.toLowerCase()}` : `${p} · ${v}`;
};
const listaNombres = (xs) => xs.map((x) => x.nombre).join(' y ');

function lineaVendedores(e) {
  const vs = presentes(e, 'vendedor');
  if (!vs.length) return '';
  const h = vs.reduce((t, v) => t + horasEmpleado(e, v, semEquipoPub()), 0);
  return `<p class="suave" style="margin-top:8px">Además, ${listaNombres(vs)} ${vs.length > 1 ? 'suman' : 'suma'} <strong>${String(h).replace('.', ',')} h</strong> de redes esta semana.</p>`;
}

function opcionVolantesVendedor(e) {
  if (!pub.volantes) return '';
  const v = presentes(e, 'vendedor').find((x) => horasEmpleado(e, x, { capacitacion: pub.capacitar, feriaVendedor: pub.feriaVendedor }) >= VOLANTES.horas);
  if (!v) return '';
  return `<label class="interruptor">
      <span><strong>Que los reparta ${v.nombre}</strong><br><span class="suave">Te ahorrás las ${VOLANTES.horas} h; se las saca a sus horas de redes.</span></span>
      <input type="checkbox" id="volantesVendedor" data-id="${v.id}" ${pub.volantesVendedor === v.id ? 'checked' : ''}>
    </label>`;
}

function bloqueAbuela(e) {
  if (!abuelaPide(e)) return '';
  const primera = e.abuela.veces === 1;
  return `<div class="tarjeta oportunidad">
      <p><strong>👵 ${primera ? 'La abuela te pide trabajo para Lelo' : 'La abuela vuelve a la carga'}</strong></p>
      <p>${primera ? 'Lelo volvió de Santa Clara del Mar y no consigue trabajo. Le lloró a la abuela, y ella te pregunta si le podés dar trabajo en tu taller.' : 'Lelo sigue sin conseguir trabajo y la abuela te vuelve a preguntar si le podés hacer un lugar.'}</p>
      <p class="suave">Lelo no te ocupa un lugar en el equipo: trabaja ${LELO_EMPLEADO.horas} h por semana y cobra ${plata(LELO_EMPLEADO.sueldo)} por mes.</p>
      <div class="alterna"><button class="chico" data-abuela="si">Sí, que venga</button><button class="chico" data-abuela="no">No</button></div>
    </div>`;
}

function bloqueDecision(e) {
  const d = e.decisiones[0];
  if (!d) return '';
  const def = MAZO.decisiones[d.id];
  return `<div class="tarjeta rumor">
      <p><strong>${d.texto}</strong> ${def.pregunta}</p>
      ${Object.entries(def.opciones).map(([id, o]) => `<div class="producto">
        <div class="info"><div class="nombre">${o.texto}</div><div class="detalle">${o.detalle}${d.monto && ['tecnico', 'acepta', 'limpia'].includes(id) ? ` (${plata(d.monto)})` : ''}</div></div>
        <button class="chico" data-decision="${id}">Elegir</button>
      </div>`).join('')}
    </div>`;
}

// ---------- Provincia: Traicio, licitación y defensas ----------
function bloqueProvincia(e) {
  if (!enProvincia(e)) return '';
  let html = '';
  const rumor = rumorTraicio(e);
  if (rumor) html += `<div class="tarjeta rumor"><p>🗡️ ${rumor} Preparate: ${e.defensas.proteccion || e.defensas.seguro || e.seguridad ? 'tus defensas ayudan.' : 'todavía no tenés ninguna defensa.'}</p></div>`;
  const a = e.licitacion.abierta;
  if (a && a.semana === e.semana) {
    const L = LICITACION;
    if (ofertaLic === null) ofertaLic = a.oferta ?? L.precioRef;
    html += `<div class="tarjeta sec-trabajo">
      <h2>🏟️ Licitación: ${a.club}</h2>
      <p class="suave">${L.combos} combos (camiseta + short) en ${L.plazo} semanas. Precio de referencia ${plata(L.precioRef)} por combo; cada uno te cuesta ${plata(L.costo)}. Acá pesan mucho el precio que ofrecés y tu reputación; la calidad suma, pero menos (tu reputación hoy: ${Math.floor(e.rep)} · tu calidad: ${calidadLicitacion(e)}). Compiten ${a.rivales.length} taller${a.rivales.length > 1 ? 'es' : ''} más. El club adelanta el 50%; lo que no entregues paga 3 veces su costo de multa.</p>
      ${!e.maquinas.calandra ? '<p><strong>Para participar necesitás la calandra.</strong></p>' : e.licitacion.contrato ? '<p class="suave">Todavía estás con otro contrato.</p>' : `
      <div class="producto">
        <div class="info"><div class="nombre">Tu precio por combo</div><div class="detalle">${a.oferta ? `Ofertaste ${plata(a.oferta)}` : 'Todavía no ofertaste'}</div></div>
        <div class="paso"><button data-lic="-1" aria-label="Menos">−</button><span class="numero" style="min-width:86px">${plata(ofertaLic)}</span><button data-lic="1" aria-label="Más">+</button></div>
      </div>
      <div class="alterna"><button class="chico" id="ofertar">${a.oferta ? 'Cambiar oferta' : 'Presentar oferta'}</button>${a.oferta ? '<button class="chico" id="noOfertar">Retirar oferta</button>' : ''}</div>`}
    </div>`;
  }
  const c = e.licitacion.contrato;
  if (c) html += `<div class="tarjeta sec-trabajo"><p>🏟️ Contrato con <strong>${c.club}</strong>: ${c.combos} combos a ${plata(c.precio)}. Tenés ${e.stock.combo}. Vence en ${Math.max(0, c.vence - e.semana)} semana${c.vence - e.semana === 1 ? '' : 's'}: producilos el sábado.</p></div>`;
  if (!e.mejorDeLaProvincia) {
    const seg = e.seguridad;
    html += `<div class="tarjeta sec-finanzas">
      <h2>Defensas contra ${TRAICIO.nombre}</h2>
      ${Object.entries(DEFENSAS).map(([id, d]) => `<label class="interruptor">
        <span><strong>${d.nombre}</strong> · ${plata(d.costo)} por mes<br><span class="suave">${d.detalle}</span></span>
        <input type="checkbox" data-defensa="${id}" ${e.defensas[id] ? 'checked' : ''}>
      </label>`).join('')}
      <div class="subtitulo">Persona de seguridad</div>
      ${seg ? `<p class="suave">Cuida el taller de noche y no ocupa lugar en el equipo. Cobra ${plata(seg.sueldo)} por mes (la media es ${plata(mediaSeguridad(e))}). Si le pagás menos que la media, ${TRAICIO.nombre} la puede comprar y deja de avisarte.</p>
        <div class="alterna"><button class="chico" id="subirSeguridad">Subirle el sueldo</button><button class="chico" id="despedirSeguridad">Despedirla</button></div>`
      : `<p class="suave">Frena algunos sabotajes y te avisa cuando ${TRAICIO.nombre} le hace una oferta a alguien de tu equipo. Lo que te dice siempre es cierto. ${plata(SEGURIDAD.sueldo)} por mes.</p>
        <button class="boton secundario" id="contratarSeguridad">Contratar persona de seguridad</button>`}
    </div>`;
  }
  return html;
}

function conectarProvincia() {
  app.querySelectorAll('[data-lic]').forEach((b) => { b.onclick = () => { ofertaLic = Math.max(30000, ofertaLic + Number(b.dataset.lic) * 5000); refrescar(); }; });
  const of = document.getElementById('ofertar');
  if (of) of.onclick = () => accionCompra(ofertarLicitacion(partida, ofertaLic));
  const no = document.getElementById('noOfertar');
  if (no) no.onclick = () => { ofertarLicitacion(partida, null); guardarPartida(); refrescar(); };
  app.querySelectorAll('[data-defensa]').forEach((i) => { i.onchange = (ev) => accionCompra(cambiarDefensa(partida, i.dataset.defensa, ev.target.checked)); });
  const cs = document.getElementById('contratarSeguridad');
  if (cs) cs.onclick = () => accionCompra(contratarSeguridad(partida));
  const ss = document.getElementById('subirSeguridad');
  if (ss) ss.onclick = () => accionCompra(subirSueldoSeguridad(partida));
  const ds = document.getElementById('despedirSeguridad');
  if (ds) ds.onclick = () => accionCompra(despedirSeguridad(partida));
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
        <div class="detalle">Experiencia ${c.exp} · ${plata(c.sueldo)} por mes · ${textoTarea(c)}</div>
        ${htmlProductosVendedor(c)}
        ${htmlRasgo(c, 'Rasgo: no sabés cómo es')}
      </div></div>
      <div class="acciones"><button class="chico" data-contratar="${origen}" data-indice="${indice}">Contratar</button>${extra}</div>
    </div>`;
}

function htmlEmpleado(e, x) {
  const h = horasEmpleado(e, x, semEquipoPub());
  const tarea = x.esLelo ? (e.leloGerente ? `gerencia: −${Math.round((1 - LELO_GERENTE.errores) * 100)}% de errores en todo el taller y te cansás desde las ${LELO_GERENTE.umbralCansancio} h` : 'producción') : x.puesto === 'disenador' ? textoTarea(x) : PUESTOS[x.puesto].tarea;
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
        <div class="detalle">${tarea} · experiencia ${Math.floor(x.exp)} · ${plata(x.sueldo)} por mes${x.falta ? ' · <strong>falta esta semana</strong>' : h ? ` · ${String(h).replace('.', ',')} h esta semana` : ''}</div>
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
  if (lleno) return `<div class="subtitulo">Contratar</div><p class="suave">No entra nadie más en ${localActual(e).nombre.toLowerCase()} (${cupoEquipo(e)} empleados${e.equipo.empleados.some((x) => x.esLelo) ? ', más Lelo' : ''}).${(e.local || 'casa') === 'casa' ? ' Para tener más, alquilá un local (abajo, en "Comprar y pagar").' : ''}</p>`;

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
      <div class="alterna">${puestosVisibles(e).map((id) => `<button class="chico" data-chuchu="${id}">Pedirle un ${PUESTOS[id].nombre.toLowerCase()}</button>`).join('')}</div>`;
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
      <div class="alterna">${puestosVisibles(e).map((id) => `<button class="chico ${f.puesto === id ? 'activo' : ''}" data-anuncio-puesto="${id}">${PUESTOS[id].nombre}</button>`).join('')}</div>
      <p class="suave">Media del mercado: ${Object.keys(vars).map((v) => `${vars[v].nombre.toLowerCase()} ${plata(mediaSueldo(e, f.puesto, v))}`).join(' · ')}</p>
      <div class="producto">
        <div class="info"><div class="nombre">Sueldo que ofrecés</div><div class="detalle">por mes</div></div>
        <div class="paso"><button data-anuncio-sueldo="-1" aria-label="Menos">−</button><span class="numero" style="min-width:86px">${plata(f.sueldo)}</span><button data-anuncio-sueldo="1" aria-label="Más">+</button></div>
      </div>
      <button class="boton secundario" id="publicarAnuncio">Publicar anuncio (${plata(EQUIPO.anuncio.costo)})</button>`;
  }

  return `<div class="subtitulo">Contratar · ${empleadosContratados(e)}/${cupoEquipo(e)}</div>
    <p class="suave">Los operarios producen por vos y los vendedores hacen redes y pueden ir a la feria. Cada uno trabaja medio día y cobra a fin de mes.${enProvincia(e) ? ' Los diseñadores no producen: bajan los errores de sus máquinas (sin diseñador textil, la plancha se equivoca más; para clubes de primera hace falta el deportivo).' : ''}</p>
    <div class="subtitulo" style="border-top:0;margin-top:4px">Bolsa de trabajo del municipio</div>${bolsa}
    <div class="subtitulo"><span class="con-avatar" style="align-items:center">${imagen('chuchu')} Llamar a Chuchu</span></div>${chuchu}
    <div class="subtitulo">Poner un anuncio</div>${anuncio}`;
}

function bloqueEquipo(e) {
  const emps = e.equipo.empleados;
  return `<div class="tarjeta sec-equipo">
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
    ${bloqueAbuela(e)}
    ${bloqueDecision(e)}
    ${e.mejorDeLaProvincia ? `<div class="tarjeta"><p><strong>${nombreDelTaller(e)} es el mejor de la provincia.</strong> La pelea por el país llega en la próxima versión.</p></div>`
      : enProvincia(e) ? `<div class="tarjeta"><p><strong>Peleás la provincia contra ${TRAICIO.nombre}.</strong> ${leloDeViaje(e) ? 'Lelo anda de vacaciones por Santa Clara del Mar.' : ''} Cada venta suma menos reputación que en la ciudad, pero los pedidos de empresas y las licitaciones suman mucho.</p></div>`
      : e.reconquista ? `<div class="tarjeta"><p><strong>Perdiste la provincia.</strong> Volvé a ser el mejor de la ciudad para revancharte: Lelo te la está peleando.</p></div>` : ''}
    ${bloqueProvincia(e)}
    ${puedeHacerPromo(e) ? `<div class="tarjeta rumor">
      <div class="con-avatar">${imagen('lelo')}<p>${e.primo.rumor}</p></div>
      <label class="interruptor">
        <span><strong>Lanzar promo de contraataque</strong><br><span class="suave">${Math.round(PROMO.descuento * 100)}% de descuento en los pedidos de esta semana · ${PROMO.horas} h. Si Lelo ataca, casi siempre lo frenás: no te saca pedidos y te llegan un ${Math.round(PROMO.extraDemanda * 100)}% más. Si era humo, regalaste el descuento. Y alguna vez la promo no prende.</span></span>
        <input type="checkbox" id="promo" ${pub.promo ? 'checked' : ''}>
      </label>
    </div>` : ''}

    ${esSemanaCyber(e.semana) ? `<div class="tarjeta sec-publicidad">
      <label class="interruptor" style="border-top:0">
        <span><strong>Sumarte al CyberMonday</strong><br><span class="suave">Bajás todos los precios un ${Math.round(CYBER.descuento * 100)}% esta semana y la gente te pide mucho más de todo. Si no te sumás, no ganás nada extra.</span></span>
        <input type="checkbox" id="cyber" ${pub.cyber ? 'checked' : ''}>
      </label>
    </div>` : ''}

    <div class="tarjeta sec-publicidad">
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
      <label class="interruptor">
        <span><strong>Repartir volantes</strong><br><span class="suave">${plata(VOLANTES.costo)} de imprenta · ${VOLANTES.horas} h recorriendo el barrio. Te piden más esta semana y un poco más la que viene.</span></span>
        <input type="checkbox" id="volantes" ${pub.volantes ? 'checked' : ''}>
      </label>
      ${opcionVolantesVendedor(e)}
    </div>

    <div class="tarjeta sec-feria">
      <h2>Feria del domingo</h2>
      <label class="interruptor" style="border-top:0">
        <span><strong>Ir a la feria</strong><br><span class="suave">Mesa ${plata(VENTAS.feria.costoMesa)} · ${VENTAS.feria.horas} h · vendés lo que te sobró de stock (${stockTotal(e) ? `tenés ${stockTotal(e)}` : 'hoy no tenés nada'}). En la feria siempre pasa algo.</span></span>
        <input type="checkbox" id="feria" ${pub.feria ? 'checked' : ''} ${stockTotal(e) ? '' : 'disabled'}>
      </label>
      ${opcionFeriaVendedor(e)}
    </div>

    <div class="tarjeta sec-estudio">
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
  const cyber = document.getElementById('cyber');
  if (cyber) cyber.onchange = (ev) => { pub.cyber = ev.target.checked; refrescar(); };
  document.getElementById('volantes').onchange = (ev) => { pub.volantes = ev.target.checked; if (!pub.volantes) pub.volantesVendedor = null; refrescar(); };
  const vv = document.getElementById('volantesVendedor');
  if (vv) vv.onchange = (ev) => { pub.volantesVendedor = ev.target.checked ? vv.dataset.id : null; refrescar(); };
  app.querySelectorAll('[data-decision]').forEach((b) => { b.onclick = () => accionCompra(resolverDecision(partida, b.dataset.decision)); });
  app.querySelectorAll('[data-abuela]').forEach((b) => { b.onclick = () => accionCompra(responderAbuela(partida, b.dataset.abuela === 'si')); });
  conectarProvincia();
  document.getElementById('feria').onchange = (ev) => { pub.feria = ev.target.checked; if (!pub.feria) pub.feriaVendedor = null; refrescar(); };
  conectarEquipo();
  app.querySelectorAll('input[name="curso"]').forEach((r) => { r.onchange = () => { pub.curso = r.value; refrescar(); }; });
  const sinCurso = document.getElementById('sinCurso');
  if (sinCurso) sinCurso.onclick = () => { pub.curso = null; refrescar(); };
  conectarComprasYReinicio();
  document.getElementById('publicar').onclick = () => {
    const r = publicar(partida, pub);
    if (!r.ok) { aviso = r.errores.join(' '); refrescar(true); return; }
    ofertaLic = null;
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
  const productos = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina] && (!PRODUCTOS[id].soloPedido || e.licitacion?.contrato || e.stock[id]));
  const v = validarPlan(e, plan);
  const precio = (p) => precioPedido(p, sem);
  const costoTerc = (p) => Math.round(PRODUCTOS[p.producto].precio * p.cantidad * (p.factorTerc || TERCERIZAR.max));
  const empresa = unidadesEmpresa(e);
  const combos = e.licitacion?.contrato ? Math.max(0, e.licitacion.contrato.combos) : 0;
  const servicios = (p) => `${p.envio ? ` · 🚚 envío (+${Math.round(SERVICIOS.envio.recargo * 100)}%, ${SERVICIOS.envio.horas} h)` : ''}${p.diseno ? ` · 🎨 diseño propio (+${Math.round(SERVICIOS.diseno.recargo * 100)}%, lleva más tiempo)` : ''}`;

  app.innerHTML = `
    ${bloqueEncabezado(e, '<div class="paso-semana">Sábado · Pedidos y producción</div>')}
    ${aviso ? `<div class="tarjeta tio"><p>${aviso}</p></div>` : ''}
    ${sem.eventos.length ? `<div class="tarjeta"><ul class="eventos">${sem.eventos.map((ev) => `<li class="${ev.tipo}">${ev.texto}</li>`).join('')}</ul></div>` : ''}

    <div class="tarjeta sec-trabajo">
      <h2>Pedidos de la semana (${sem.pedidos.filter((p) => !p.rechazado).length})</h2>
      ${sem.pedidos.length ? sem.pedidos.map((p) => `
        <div class="pedido ${p.rechazado ? 'rechazado' : ''}">
          <div class="info">
            <div class="nombre">${p.cantidad} ${nombreUnidades(p.producto, p.cantidad)}</div>
            <div class="detalle">${p.cliente} · ${plata(precio(p))}${servicios(p)}${p.rechazado ? ' · rechazado' : ''}${p.tercerizado ? ` · <strong>tercerizado</strong> (${plata(costoTerc(p))})` : ''}</div>
          </div>
          <div class="acciones-pedido">
            ${seleccionTerc && !p.rechazado ? `<label class="marcar"><input type="checkbox" data-marcar="${p.id}" ${seleccionTerc.has(p.id) ? 'checked' : ''}> ${plata(costoTerc(p))}</label>`
              : p.tercerizado ? '' : `<button class="chico" data-rechazar="${p.id}">${p.rechazado ? 'Aceptar' : 'Rechazar'}</button>`}
          </div>
        </div>`).join('') : '<p class="suave">No llegaron pedidos. Probá con más horas de publicidad la semana que viene.</p>'}
      ${e.mejorDeLaCiudad && sem.pedidos.some((p) => !p.rechazado) ? (seleccionTerc
        ? `<div class="alterna" style="margin-top:8px"><button class="chico activo" id="tercConfirmar">Tercerizar marcados (${seleccionTerc.size})</button><button class="chico" id="tercCancelar">Cancelar</button></div>`
        : `<div class="alterna" style="margin-top:8px"><button class="chico" id="tercTodo">Tercerizar todo</button><button class="chico" id="tercResto">Tercerizar el resto</button><button class="chico" id="tercElegir">Elegir cuáles</button>${sem.pedidos.some((p) => p.tercerizado) ? '<button class="chico" id="tercNada">No tercerizar nada</button>' : ''}</div>`) : ''}
      ${e.mejorDeLaCiudad ? '<p class="suave" style="margin-top:8px">Tercerizar: otro taller lo hace por vos. No te lleva horas ni stock, pero te queda solo un 5-10% de ganancia. "El resto" son los pedidos que no cubrís con tu stock y lo que vas a producir. Ojo: a veces la tercerizadora entrega mal y perdés el pedido.</p>' : ''}
      <p class="suave" style="margin-top:8px">Si no entregás un pedido aceptado perdés reputación. Si sabés que no llegás, rechazalo: perdés mucho menos.${sem.pedidos.some((p) => p.envio || p.diseno) ? ' Los envíos los hace un operario con horas libres (si no, vos) y suman reputación; el diseño propio lo hace tu diseñador de esa máquina (si no tenés, o no le alcanzan las horas, vos).' : ''}</p>
    </div>

    ${bloqueEmpresas(e)}

    <div class="tarjeta sec-trabajo">
      <h2>Producir</h2>
      ${lineaOperarios(e)}
      ${productos.map((id) => {
        const pr = PRODUCTOS[id];
        const necesita = pedidas[id] + empresa[id] + (id === 'combo' ? combos : 0);
        const faltan = Math.max(0, necesita - e.stock[id] - plan.producir[id]);
        return `<div class="producto">
          ${imagen(id)}
          <div class="info">
            <div class="nombre">${pr.nombre}</div>
            <div class="detalle">Pedidos ${necesita}${empresa[id] || (id === 'combo' && combos) ? ` (${empresa[id] ? `${empresa[id]} de empresas` : `${combos} del club`})` : ''} · stock ${e.stock[id]} · ${faltan > 0 ? `<span class="faltan">faltan ${faltan}</span>` : necesita ? '<span class="cubierto">cubierto ✔</span>' : 'sin pedidos'}<br>${Math.round(horasPorUnidad(e, id) * 60)} min c/u · costo ${plata(pr.costo)}</div>
          </div>
          <div class="paso">
            <button data-menos="${id}" aria-label="Menos">−</button>
            <input class="numero" type="number" inputmode="numeric" min="0" step="1" data-cant="${id}" value="${plan.producir[id]}" aria-label="Cantidad de ${pr.nombre.toLowerCase()}">
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
  const terc = (r) => { seleccionTerc = null; if (r.ok) guardarPartida(); else aviso = r.motivo; refrescar(!r.ok); };
  const bt = (id, f) => { const b = document.getElementById(id); if (b) b.onclick = f; };
  bt('tercTodo', () => terc(tercerizarTodo(partida)));
  bt('tercResto', () => terc(tercerizarResto(partida, plan.producir)));
  bt('tercNada', () => terc(tercerizarVarios(partida, [])));
  bt('tercElegir', () => { seleccionTerc = new Set(sem.pedidos.filter((p) => p.tercerizado).map((p) => p.id)); refrescar(); });
  bt('tercCancelar', () => { seleccionTerc = null; refrescar(); });
  bt('tercConfirmar', () => terc(tercerizarVarios(partida, [...seleccionTerc])));
  app.querySelectorAll('[data-marcar]').forEach((i) => {
    i.onchange = () => { if (i.checked) seleccionTerc.add(i.dataset.marcar); else seleccionTerc.delete(i.dataset.marcar); refrescar(); };
  });
  app.querySelectorAll('[data-empresa]').forEach((b) => {
    b.onclick = () => {
      const [accion, id] = [b.dataset.empresa, b.dataset.id];
      const r = accion === 'aceptar' ? responderPedidoEmpresa(partida, id, true)
        : accion === 'rechazar' ? responderPedidoEmpresa(partida, id, false)
          : tercerizarPedidoEmpresa(partida, id, accion === 'tercerizar');
      if (r.ok) guardarPartida(); else aviso = r.motivo;
      refrescar(!r.ok);
    };
  });
  app.querySelectorAll('[data-mas]').forEach((b) => mantenerApretado(b, b.dataset.mas, 1));
  app.querySelectorAll('[data-menos]').forEach((b) => mantenerApretado(b, b.dataset.menos, -1));
  app.querySelectorAll('[data-cant]').forEach((i) => {
    i.onfocus = () => i.select();
    i.onkeydown = (ev) => { if (ev.key === 'Enter') i.blur(); };
    i.onchange = () => { plan.producir[i.dataset.cant] = Math.max(0, Math.floor(Number(i.value) || 0)); refrescar(); };
  });
  document.getElementById('terminar').onclick = terminarSemana;
}

// Botón +/− que, si lo mantenés apretado, sigue sumando cada vez más rápido. La pantalla se actualiza al soltar.
function mantenerApretado(boton, id, paso) {
  const campo = app.querySelector(`[data-cant="${id}"]`);
  let timer = null;
  let veces = 0;
  const mover = () => {
    plan.producir[id] = Math.max(0, plan.producir[id] + paso);
    if (campo) campo.value = plan.producir[id];
  };
  const seguir = () => {
    mover();
    veces++;
    timer = setTimeout(seguir, veces < 5 ? 180 : veces < 15 ? 90 : 40);
  };
  const soltar = () => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    refrescar();
  };
  boton.onpointerdown = (ev) => {
    ev.preventDefault();
    veces = 0;
    mover();
    timer = setTimeout(seguir, 400);
  };
  boton.onpointerup = soltar;
  boton.onpointerleave = soltar;
  boton.onpointercancel = soltar;
  boton.oncontextmenu = (ev) => ev.preventDefault();
  boton.onclick = (ev) => { if (ev.detail === 0) { mover(); refrescar(); } }; // con teclado
}

// Pedidos de empresas (provincia): tienen plazo de varias semanas y se cobran a 30 días.
function bloqueEmpresas(e) {
  if (!e.pedidosEmpresa?.length) return '';
  return `<div class="tarjeta sec-trabajo">
      <h2>Pedidos de empresas</h2>
      ${e.pedidosEmpresa.map((p) => {
        const faltan = Math.max(0, p.vence - e.semana);
        const items = Object.entries(p.items).map(([id, n]) => `${n} ${nombreUnidades(id, n)}`).join(', ');
        const cliente = e.empresas.clientes[p.cliente];
        let acciones;
        if (p.estado === 'oferta') acciones = `<button class="chico" data-empresa="aceptar" data-id="${p.id}">Aceptar</button><button class="chico" data-empresa="rechazar" data-id="${p.id}">Rechazar</button>`;
        else if (e.mejorDeLaCiudad) acciones = `<button class="chico ${p.tercerizar ? 'activo' : ''}" data-empresa="${p.tercerizar ? 'producir' : 'tercerizar'}" data-id="${p.id}">${p.tercerizar ? 'Tercerizado ✔ (deshacer)' : `Tercerizar (${plata(Math.round(p.precio * p.factorTerc))})`}</button>`;
        else acciones = '';
        return `<div class="pedido">
          <div class="info">
            <div class="nombre">${p.cliente}${cliente?.fijo ? ' <span class="chip">fijo</span>' : ''}</div>
            <div class="detalle">${items} · ${plata(p.precio)}, se cobra a ${p.cobro} semanas · ${p.estado === 'oferta' ? 'te espera la respuesta' : faltan ? `vence en ${faltan} semana${faltan > 1 ? 's' : ''}` : '<span class="faltan">vence esta semana</span>'}</div>
          </div>
          <div class="acciones-pedido">${acciones}</div>
        </div>`;
      }).join('')}
      <p class="suave" style="margin-top:8px">Se entrega solo cuando tenés todo en stock (después de los pedidos de redes). Si vence y no llegaste: ${EMPRESAS.repNoEntrega} de reputación y perdés al cliente. Con ${EMPRESAS.entregasParaFijo} entregas a tiempo, el cliente se vuelve fijo.</p>
    </div>`;
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
  seleccionTerc = null;
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
    <div class="tarjeta sec-finanzas">
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
      <button class="boton" id="seguir">${r.hito === 'quiebra' ? 'Ver final' : ['mejorDeLaCiudad', 'mejorDeLaProvincia', 'perdisteProvincia', 'reconquista'].includes(r.hito) ? 'Seguir' : 'Siguiente semana'}</button>
    </div></div>
  `;
  document.getElementById('seguir').onclick = () => {
    const e = partida;
    if (r.hito === 'mejorDeLaCiudad') pantallaLogro();
    else if (r.hito === 'mejorDeLaProvincia') pantallaHito('¡El mejor de la provincia! 🏆', [`${nombreDelTaller(e)} le ganó a ${TRAICIO.nombre}: Talleres Judas cerró.`, ...(r.leloAsciende ? [`Lelo asciende a gerente de operaciones (${plata(LELO_GERENTE.sueldo)} por mes): deja de producir, pero baja los errores de todo el taller y te cansás menos.`] : []), 'La pelea por el país llega en la próxima versión. Mientras tanto, podés seguir jugando.']);
    else if (r.hito === 'perdisteProvincia') pantallaHito('Traicio te ganó la provincia 😖', [`${TRAICIO.nombre} llegó primero a 100. Perdiste el título y volvés a la ciudad con ${PROVINCIA.repAlPerder} de reputación.`, 'Conservás todo (máquinas, plata y empleados), pero el mercado vuelve a ser el de la ciudad.', `${r.textoLelo || 'Lelo volvió a abrir su taller para competirte.'} Cuando llegues otra vez a 100, se rinde.`], 'A revancharse');
    else if (r.hito === 'reconquista') pantallaHito('¡Otra vez el mejor de la ciudad! 🏆', ['Lelo se rindió otra vez: cerró el taller y se fue un mes a Santa Clara del Mar.', `Arranca la revancha por la provincia: ${TRAICIO.nombre} te espera con ${PROVINCIA.repTraicioRevancha} de reputación.`]);
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
      <p>Lelo se dio cuenta de que no tenía nada que hacer contra tu majestuosidad. Cerró el taller, vendió la máquina de tazas y con la plata <strong>se fue un mes a Santa Clara del Mar</strong>.</p>
      <p class="suave">Mientras tanto, pensá si querés sumar más gente al equipo.</p>
      <p>Lo lograste en la semana ${e.semana - 1}, con ${plata(e.plata)} en la caja y ${e.totales.vendidas} productos vendidos.</p>
    </div>
    <div class="tarjeta tio">
      <p>Ahora arranca la pelea por la <strong>provincia</strong> contra ${TRAICIO.nombre}, de ${TRAICIO.empresa}: un ex empleado de Lelo que juega sucio. El mercado es el doble, pero cada venta suma mucho menos reputación. Los pedidos de empresas y las licitaciones de clubes suman fuerte. Ya podés tercerizar pedidos.</p>
    </div>
    <div class="tarjeta">
      <h2>Bautizá tu taller</h2>
      <p class="suave">Desde ahora competís como empresa.</p>
      <input type="text" id="nombreTaller" maxlength="40" placeholder="Por ejemplo: Talleres Iván" value="${e.nombreTaller || ''}" style="width:100%;padding:10px;font-size:1rem;border-radius:10px;border:1px solid var(--borde)">
    </div>
    <button class="boton" id="seguir">Arrancar la provincia</button>
  `;
  document.getElementById('seguir').onclick = () => {
    const r = ponerNombreTaller(partida, document.getElementById('nombreTaller').value);
    if (!r.ok) { document.getElementById('nombreTaller').focus(); document.getElementById('nombreTaller').placeholder = r.motivo; return; }
    guardarPartida();
    siguientePantalla();
  };
}

function pantallaHito(titulo, parrafos, boton = 'Seguir jugando') {
  window.scrollTo(0, 0);
  app.innerHTML = `<h1>${titulo}</h1><div class="tarjeta">${parrafos.map((x) => `<p>${x}</p>`).join('')}</div><button class="boton" id="seguir">${boton}</button>`;
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
