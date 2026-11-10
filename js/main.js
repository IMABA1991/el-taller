// Pantallas de "El Taller" (versión sin diseño).
import {
  nuevaPartida, publicar, cerrarSemana, validarPublicidad, validarPlan, rechazarPedido, unidadesPedidas,
  calendario, fechaEspecial, demandaEsperada, horasPorUnidad, horasPorVenta, horasPublicidadSugeridas,
  probabilidadError, comprarMaquina, pagarPrestamoA, costoPagoAnticipadoA, gastosFijosDelMes, nombreUnidades,
  fmt, puedeHacerPromo, HORAS_POR_SEMANA, PRODUCTOS, MAQUINAS, CURSO_CORTO, VENTAS, PRESTAMO, TUTORIAL, PROMO,
} from './engine.js';
import { guardar, cargar, borrar } from './storage.js';

const app = document.getElementById('app');
let partida = null;
let plan = null; // paso 2: producción
let pub = null; // paso 1: publicidad
let aviso = null; // mensaje después de una acción (compra, pago)
let confirmarReinicio = false;

// ---------- Utilidades ----------
const plata = (n) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n))}`;
const pct = (v) => `${Math.max(0, Math.min(100, v))}%`;

function planPublicidad() {
  const sugeridas = partida ? horasPublicidadSugeridas(partida) : 4;
  return { horasRedes: partida?.ultimaPublicidad ?? sugeridas, promo: false };
}

// Por defecto se produce lo que falta para cubrir los pedidos.
function planProduccion() {
  const sem = partida.semanaEnCurso;
  const pedidas = unidadesPedidas(sem);
  const producir = {};
  for (const id of Object.keys(PRODUCTOS)) producir[id] = Math.max(0, pedidas[id] - partida.stock[id]);
  return { producir, feria: partida.ultimaFeria ?? false, curso: false };
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
      partida = guardada;
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
      <div class="fila"><span class="plata">${plata(e.plata)}</span><span class="fecha">Semana ${e.semana} · ${c.nombreMes} (${c.estacion})</span></div>
      ${extra}
    </div>`;
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
      </div>
      <p class="suave" style="margin-top:8px">Stock: ${Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]).map((id) => `${e.stock[id]} ${nombreUnidades(id, e.stock[id])}`).join(' · ')}</p>
      <p class="suave">Gastos fijos del mes: ${plata(gastosFijosDelMes(e))} (se pagan en la última semana de ${c.nombreMes.toLowerCase()}${c.finDeMes ? ': ¡es esta!' : ''}).</p>
    </div>`;
}

function barraInferior(horas, costo, errores, textoBoton, idBoton) {
  const horasPct = (horas / HORAS_POR_SEMANA) * 100;
  return `<div class="barra-inferior"><div class="contenido">
      <div class="resumen-plan"><span>Horas: <strong>${String(horas).replace('.', ',')}</strong> / ${HORAS_POR_SEMANA}</span>${costo !== null ? `<span>Gastás: <strong>${plata(costo)}</strong></span>` : ''}</div>
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
  document.getElementById('reiniciar').onclick = () => {
    if (!confirmarReinicio) { confirmarReinicio = true; refrescar(); return; }
    confirmarReinicio = false;
    borrar();
    partida = null;
    pantallaInicio();
  };
}

function bloqueComprasYReinicio(e) {
  const p = e.prestamo;
  return `<div class="tarjeta">
      <h2>Comprar y pagar</h2>
      ${!e.maquinas.gorras ? `<button class="boton secundario" id="comprarGorras">Comprar máquina de gorras (${plata(MAQUINAS.gorras.precio)})</button>` : '<p class="suave">Ya tenés la máquina de gorras.</p>'}
      ${p.opcion === 'A' && !p.pagado ? `<button class="boton secundario" id="pagarTio">Pagarle al tío ahora (${plata(p.vencido ? p.deuda : costoPagoAnticipadoA(e.semana))})</button>` : ''}
    </div>
    <div class="tarjeta">
      <button class="boton peligro" id="reiniciar">${confirmarReinicio ? 'Tocá de nuevo para borrar la partida' : 'Empezar de nuevo'}</button>
    </div>`;
}

// ---------- Paso 1: publicidad en redes ----------
function pantallaPublicidad() {
  const e = partida;
  const fecha = fechaEspecial(e.semana);
  const tutorial = e.semana <= 8 ? TUTORIAL[e.semana] : null;
  const productos = Object.keys(PRODUCTOS).filter((id) => e.maquinas[PRODUCTOS[id].maquina]);
  const mercado = productos.reduce((s, id) => s + demandaEsperada(e, id), 0) * (pub.promo ? 1 + PROMO.extraDemanda : 1);
  const porHora = 1 / horasPorVenta(e);
  const sugeridas = Math.ceil(mercado / porHora);
  const v = validarPublicidad(e, pub);
  const horas = pub.horasRedes + (pub.promo ? PROMO.horas : 0) + (e.curso.semanasRestantes > 0 ? CURSO_CORTO.horasPorSemana : 0);

  app.innerHTML = `
    ${bloqueEncabezado(e, '<div class="paso-semana">Paso 1 de 2 · Publicidad</div>')}
    ${aviso ? `<div class="tarjeta tio"><p>${aviso}</p></div>` : ''}
    ${tutorial ? `<div class="tarjeta tio"><p>${tutorial}</p></div>` : ''}
    ${fecha ? `<div class="tarjeta tio"><p><strong>${fecha.nombre}</strong>: esta semana llegan muchos más pedidos.</p></div>` : ''}
    ${e.mejorDeLaCiudad ? '<div class="tarjeta"><p><strong>Sos el mejor de la ciudad.</strong> Lelo trabaja para vos. Lo que sigue (empleados, provincia) llega en la próxima versión.</p></div>' : ''}
    ${puedeHacerPromo(e) ? `<div class="tarjeta rumor">
      <p>🗣️ ${e.primo.rumor}</p>
      <label class="interruptor">
        <span><strong>Lanzar promo de contraataque</strong><br><span class="suave">${Math.round(PROMO.descuento * 100)}% de descuento en los pedidos de esta semana · ${PROMO.horas} h. Si Lelo ataca, no te saca ningún pedido y te llegan un ${Math.round(PROMO.extraDemanda * 100)}% más. Si era humo, regalaste el descuento.</span></span>
        <input type="checkbox" id="promo" ${pub.promo ? 'checked' : ''}>
      </label>
    </div>` : ''}

    <div class="tarjeta">
      <h2>Publicidad en redes</h2>
      <p class="suave">Publicás en Instagram y Marketplace y respondés consultas. <strong>Así te llegan los pedidos</strong>: cada hora atrae unos ${String(Math.round(porHora * 10) / 10).replace('.', ',')} productos pedidos.</p>
      <p class="suave">Esta semana el mercado pide unos <strong>${Math.round(mercado)}</strong> productos: con <strong>${sugeridas} h</strong> llegás a todos. Más horas no suman pedidos.</p>
      <div class="producto">
        <div class="info"><div class="nombre">Horas de publicidad</div><div class="detalle">Después de ver los pedidos vas a producir con las horas que te queden.</div></div>
        <div class="paso">
          <button data-redes="-1" aria-label="Menos horas">−</button>
          <span class="numero">${pub.horasRedes}</span>
          <button data-redes="1" aria-label="Más horas">+</button>
        </div>
      </div>
    </div>

    ${bloqueEstado(e)}
    ${bloqueComprasYReinicio(e)}
    ${barraInferior(horas, null, v.errores, 'Publicar y ver los pedidos', 'publicar')}
  `;
  aviso = null;

  app.querySelectorAll('[data-redes]').forEach((b) => { b.onclick = () => { pub.horasRedes = Math.max(0, pub.horasRedes + Number(b.dataset.redes)); refrescar(); }; });
  const promo = document.getElementById('promo');
  if (promo) promo.onchange = (ev) => { pub.promo = ev.target.checked; refrescar(); };
  conectarComprasYReinicio();
  document.getElementById('publicar').onclick = () => {
    const r = publicar(partida, pub);
    if (!r.ok) { aviso = r.errores.join(' '); refrescar(true); return; }
    partida.ultimaPublicidad = pub.horasRedes;
    guardarPartida();
    plan = planProduccion();
    window.scrollTo(0, 0);
    pantallaSemana();
  };
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
    ${bloqueEncabezado(e, '<div class="paso-semana">Paso 2 de 2 · Pedidos y producción</div>')}
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
      ${productos.map((id) => {
        const pr = PRODUCTOS[id];
        const faltan = Math.max(0, pedidas[id] - e.stock[id]);
        return `<div class="producto">
          <div class="info">
            <div class="nombre">${pr.nombre}</div>
            <div class="detalle">Pedidos ${pedidas[id]} · stock ${e.stock[id]} · <strong>faltan ${faltan}</strong><br>${Math.round(horasPorUnidad(e, id) * 60)} min c/u · costo ${plata(pr.costo)}</div>
          </div>
          <div class="paso">
            <button data-menos="${id}" aria-label="Menos">−</button>
            <span class="numero">${plan.producir[id]}</span>
            <button data-mas="${id}" aria-label="Más">+</button>
          </div>
        </div>`;
      }).join('')}
      <p class="suave" style="margin-top:8px">Alguna puede salir mal en la prensa (hoy ~${Math.round(probabilidadError(e) * 100)}%): producir una de más te cubre.</p>
      <label class="interruptor">
        <span><strong>Ir a la feria</strong><br><span class="suave">Mesa ${plata(VENTAS.feria.costoMesa)} · ${VENTAS.feria.horas} h · vende lo que te sobre de stock (5 a 8 productos)</span></span>
        <input type="checkbox" id="feria" ${plan.feria ? 'checked' : ''}>
      </label>
    </div>

    <div class="tarjeta">
      <h2>Formación</h2>
      ${e.curso.semanasRestantes > 0
        ? `<p>Estás haciendo el curso corto: ${CURSO_CORTO.horasPorSemana} h por semana, te quedan ${e.curso.semanasRestantes} semana(s).</p>`
        : e.semana >= 7
          ? `<label class="interruptor" style="border-top:0">
              <span><strong>Curso corto de sublimación</strong><br><span class="suave">${plata(CURSO_CORTO.costo)} · ${CURSO_CORTO.horasPorSemana} h por semana durante ${CURSO_CORTO.semanas} semanas · +${CURSO_CORTO.puntos} de formación (baja 5 por mes)</span></span>
              <input type="checkbox" id="curso" ${plan.curso ? 'checked' : ''}>
            </label>`
          : '<p class="suave">Los cursos se habilitan en la semana 7.</p>'}
    </div>

    ${bloqueEstado(e)}
    ${barraInferior(v.horas, v.costo, v.errores, 'Producir, entregar y cerrar la semana', 'terminar')}
  `;
  aviso = null;

  app.querySelectorAll('[data-rechazar]').forEach((b) => {
    b.onclick = () => {
      const p = sem.pedidos.find((x) => x.id === b.dataset.rechazar);
      rechazarPedido(partida, p.id, !p.rechazado);
      const ped = unidadesPedidas(partida.semanaEnCurso);
      plan.producir[p.producto] = Math.max(0, ped[p.producto] - e.stock[p.producto]);
      guardarPartida();
      refrescar();
    };
  });
  app.querySelectorAll('[data-mas]').forEach((b) => { b.onclick = () => { plan.producir[b.dataset.mas]++; refrescar(); }; });
  app.querySelectorAll('[data-menos]').forEach((b) => { b.onclick = () => { plan.producir[b.dataset.menos] = Math.max(0, plan.producir[b.dataset.menos] - 1); refrescar(); }; });
  document.getElementById('feria').onchange = (ev) => { plan.feria = ev.target.checked; refrescar(); };
  const curso = document.getElementById('curso');
  if (curso) curso.onchange = (ev) => { plan.curso = ev.target.checked; refrescar(); };
  document.getElementById('terminar').onclick = terminarSemana;
}

function pantallaSemana() {
  if (partida.semanaEnCurso) pantallaPedidos();
  else pantallaPublicidad();
}

function refrescar(arriba = false) {
  const y = window.scrollY;
  pantallaSemana();
  window.scrollTo(0, arriba ? 0 : y);
}

function terminarSemana() {
  const feria = plan.feria;
  const r = cerrarSemana(partida, plan);
  if (!r.ok) { aviso = r.errores.join(' '); refrescar(true); return; }
  partida.ultimaFeria = feria;
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
      <p>Lelo no pudo competir y cerró el taller. En el almuerzo del domingo, el tío anunció que <strong>ahora trabaja para vos</strong>.</p>
      <p>Lo lograste en la semana ${e.semana - 1}, con ${plata(e.plata)} en la caja y ${e.totales.vendidas} productos vendidos.</p>
    </div>
    <div class="tarjeta tio">
      <p>Hasta acá llega la <strong>versión mínima</strong>. En la próxima versión: Lelo como empleado, las demás máquinas y la pelea por ser el mejor de la provincia.</p>
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
