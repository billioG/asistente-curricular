import {
  CRITERIOS_AUTOEVALUACION, PREGUNTAS_REFLEXION, CRITERIOS_COEVALUACION, ESCALA_COEVALUACION,
} from '../services/evaluationSheets.js';
import { PASOS_DISENO, NOMBRE_PASO } from '../prompts/promptTemplates.js';
import { crearIconoPaso } from './icons.js';

function conScroll(tabla) {
  const wrap = document.createElement('div');
  wrap.className = 'tabla-scroll';
  wrap.appendChild(tabla);
  return wrap;
}

function fila(etiqueta, valor) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.textContent = etiqueta;
  const td = document.createElement('td');
  td.textContent = valor;
  tr.append(th, td);
  return tr;
}

function crearEncabezado(plan) {
  const tabla = document.createElement('table');
  tabla.className = 'plan-encabezado';
  tabla.appendChild(fila('Grado', plan.grado));
  tabla.appendChild(fila('Área', plan.area));
  tabla.appendChild(fila('Fecha', plan.fecha || ''));
  return tabla;
}

function crearSeccion(titulo) {
  const section = document.createElement('section');
  section.className = 'plan-seccion';
  const h = document.createElement('h2');
  h.textContent = titulo;
  section.appendChild(h);
  return section;
}

function crearLista(items) {
  const ul = document.createElement('ul');
  (items || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  return ul;
}

function crearActividadDiseno(paso, act) {
  const wrap = document.createElement('div');
  wrap.className = 'plan-paso';
  wrap.dataset.paso = paso;

  const header = document.createElement('div');
  header.className = 'plan-paso-header';

  const badge = document.createElement('div');
  badge.className = 'plan-paso-badge';
  badge.appendChild(crearIconoPaso(paso));
  header.appendChild(badge);

  const tituloWrap = document.createElement('div');
  const etiqueta = document.createElement('span');
  etiqueta.className = 'plan-paso-etiqueta';
  etiqueta.textContent = NOMBRE_PASO[paso] || paso;
  tituloWrap.appendChild(etiqueta);
  if (act.titulo) {
    const h3 = document.createElement('h3');
    h3.textContent = act.titulo;
    tituloWrap.appendChild(h3);
  }
  header.appendChild(tituloWrap);

  wrap.appendChild(header);

  if (act.objetivo) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Objetivo: ';
    p.appendChild(strong);
    p.append(act.objetivo);
    wrap.appendChild(p);
  }

  if (act.tarea) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Tarea: ';
    p.appendChild(strong);
    p.append(act.tarea);
    wrap.appendChild(p);
  }

  if (Array.isArray(act.recursos) && act.recursos.length) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Recursos:';
    p.appendChild(strong);
    wrap.appendChild(p);
    wrap.appendChild(crearLista(act.recursos));
  }

  if (act.duracionMinutos) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Duración: ';
    p.appendChild(strong);
    p.append(`${act.duracionMinutos} min`);
    wrap.appendChild(p);
  }

  return wrap;
}

function crearTablaRubrica(rubrica) {
  const tabla = document.createElement('table');
  tabla.className = 'plan-rubrica';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  ['Criterio', 'Peso', 'Excelente', 'Logrado', 'En proceso', 'Inicial'].forEach((titulo) => {
    const th = document.createElement('th');
    th.textContent = titulo;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  (rubrica.criterios || []).forEach((criterio) => {
    const tr = document.createElement('tr');
    const peso = criterio.peso != null ? `${criterio.peso}%` : '';
    [criterio.criterio, peso, criterio.excelente, criterio.logrado, criterio.en_proceso, criterio.inicial].forEach((valor) => {
      const td = document.createElement('td');
      td.textContent = valor || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);

  return tabla;
}

function crearCampo(etiqueta, valor) {
  const campo = document.createElement('div');
  campo.className = 'hoja-campo';
  const label = document.createElement('label');
  label.textContent = etiqueta;
  campo.appendChild(label);
  if (valor) {
    const p = document.createElement('p');
    p.textContent = valor;
    campo.appendChild(p);
  } else {
    campo.appendChild(document.createElement('div')).className = 'hoja-linea';
  }
  return campo;
}

function crearLineasEscritura(n) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i += 1) {
    const linea = document.createElement('div');
    linea.className = 'hoja-linea';
    frag.appendChild(linea);
  }
  return frag;
}

function crearTablaChecklistAutoeval() {
  const tabla = document.createElement('table');
  tabla.className = 'hoja-checklist';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const thVacio = document.createElement('th');
  trHead.appendChild(thVacio);
  ['Sí, siempre', 'A veces', 'No, casi nunca'].forEach((titulo) => {
    const th = document.createElement('th');
    th.textContent = titulo;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  CRITERIOS_AUTOEVALUACION.forEach((criterio) => {
    const tr = document.createElement('tr');
    const tdCriterio = document.createElement('td');
    tdCriterio.textContent = criterio;
    tr.appendChild(tdCriterio);
    for (let i = 0; i < 3; i += 1) {
      const td = document.createElement('td');
      const casilla = document.createElement('div');
      casilla.className = 'hoja-checkbox';
      td.appendChild(casilla);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);
  return tabla;
}

function crearOpcionesCalificacion() {
  const wrap = document.createElement('div');
  wrap.className = 'hoja-opciones';
  ['Excelente (4)', 'Logrado (3)', 'En Proceso (2)', 'Inicial (1)'].forEach((texto) => {
    const span = document.createElement('span');
    span.className = 'hoja-opcion';
    span.textContent = texto;
    wrap.appendChild(span);
  });
  return wrap;
}

function crearHojaAutoevaluacion(plan) {
  const hoja = document.createElement('div');
  hoja.className = 'hoja-evaluacion';

  const h3 = document.createElement('h3');
  h3.textContent = 'Autoevaluación — Reflexión Individual';
  hoja.appendChild(h3);

  const campos = document.createElement('div');
  campos.className = 'hoja-campos';
  campos.appendChild(crearCampo('Proyecto / Competencia', plan.competencia?.slice(0, 80)));
  campos.appendChild(crearCampo('Grado', plan.grado));
  campos.appendChild(crearCampo('Nombre del estudiante'));
  campos.appendChild(crearCampo('Fecha'));
  hoja.appendChild(campos);

  const instrucciones = document.createElement('p');
  instrucciones.className = 'hoja-instrucciones';
  instrucciones.textContent = 'Responde con honestidad. Esto no es un examen: es para reflexionar sobre lo que aprendiste y cómo trabajaste. No hay respuestas correctas o incorrectas.';
  hoja.appendChild(instrucciones);

  const h4Check = document.createElement('h4');
  h4Check.textContent = '1. Mi contribución al grupo';
  hoja.appendChild(h4Check);
  hoja.appendChild(conScroll(crearTablaChecklistAutoeval()));

  const h4Reflexion = document.createElement('h4');
  h4Reflexion.textContent = '2. Reflexión (mínimo 3 líneas por pregunta)';
  hoja.appendChild(h4Reflexion);

  PREGUNTAS_REFLEXION.forEach((pregunta) => {
    const wrap = document.createElement('div');
    wrap.className = 'hoja-pregunta';
    const p = document.createElement('p');
    p.textContent = pregunta;
    wrap.appendChild(p);
    wrap.appendChild(crearLineasEscritura(3));
    hoja.appendChild(wrap);
  });

  const h4Nota = document.createElement('h4');
  h4Nota.textContent = '3. Mi autocalificación';
  hoja.appendChild(h4Nota);
  const pNota = document.createElement('p');
  pNota.textContent = 'Teniendo en cuenta mi esfuerzo real y mi aprendizaje, yo creo que merezco:';
  hoja.appendChild(pNota);
  hoja.appendChild(crearOpcionesCalificacion());
  const pPorque = document.createElement('p');
  pPorque.textContent = '¿Por qué elegiste esa nota?';
  hoja.appendChild(pPorque);
  hoja.appendChild(crearLineasEscritura(2));

  return hoja;
}

function crearTablaCoevaluacion() {
  const tabla = document.createElement('table');
  tabla.className = 'hoja-tabla-coeval';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const thNombre = document.createElement('th');
  thNombre.textContent = 'Nombre del compañero';
  trHead.appendChild(thNombre);
  CRITERIOS_COEVALUACION.forEach((criterio) => {
    const th = document.createElement('th');
    th.textContent = criterio;
    trHead.appendChild(th);
  });
  const thPromedio = document.createElement('th');
  thPromedio.textContent = 'Promedio';
  trHead.appendChild(thPromedio);
  thead.appendChild(trHead);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 0; i < 4; i += 1) {
    const tr = document.createElement('tr');
    const tdNombre = document.createElement('td');
    tr.appendChild(tdNombre);
    for (let j = 0; j < CRITERIOS_COEVALUACION.length + 1; j += 1) {
      tr.appendChild(document.createElement('td'));
    }
    tbody.appendChild(tr);
  }
  tabla.appendChild(tbody);
  return tabla;
}

function crearHojaCoevaluacion(plan) {
  const hoja = document.createElement('div');
  hoja.className = 'hoja-evaluacion';

  const h3 = document.createElement('h3');
  h3.textContent = 'Coevaluación — Evaluación entre Compañeros';
  hoja.appendChild(h3);

  const campos = document.createElement('div');
  campos.className = 'hoja-campos';
  campos.appendChild(crearCampo('Tu nombre'));
  campos.appendChild(crearCampo('Grado', plan.grado));
  campos.appendChild(crearCampo('Nombre del grupo'));
  hoja.appendChild(campos);

  const instrucciones = document.createElement('p');
  instrucciones.className = 'hoja-instrucciones';
  instrucciones.textContent = 'Evalúa a cada integrante de tu grupo (no te evalúes a ti mismo). Usa la siguiente escala para cada criterio.';
  hoja.appendChild(instrucciones);

  const escala = document.createElement('ul');
  escala.className = 'hoja-escala';
  ESCALA_COEVALUACION.forEach(({ valor, etiqueta, desc }) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${valor} (${etiqueta}): `;
    li.appendChild(strong);
    li.append(desc);
    escala.appendChild(li);
  });
  hoja.appendChild(escala);

  hoja.appendChild(conScroll(crearTablaCoevaluacion()));

  const pComentario = document.createElement('p');
  pComentario.className = 'hoja-instrucciones';
  pComentario.textContent = 'Comentario adicional (opcional): ¿hubo algún problema en el grupo que el maestro deba conocer?';
  hoja.appendChild(pComentario);
  hoja.appendChild(crearLineasEscritura(2));

  return hoja;
}

export function renderizarPlan(plan) {
  const contenedor = document.getElementById('planContent');
  contenedor.textContent = '';

  const banner = document.createElement('div');
  banner.className = 'plan-banner';
  const kicker = document.createElement('span');
  kicker.className = 'plan-banner-kicker';
  kicker.textContent = 'Generador de Planes CNB';
  banner.appendChild(kicker);
  const titulo = document.createElement('h1');
  titulo.textContent = 'Plan de Clase';
  banner.appendChild(titulo);
  const narrativa = document.createElement('p');
  narrativa.className = 'plan-banner-narrativa';
  narrativa.textContent = `Hoy eres un diseñador de soluciones: tu misión es resolver un reto real relacionado con "${(plan.competencia || '').slice(0, 90)}${(plan.competencia || '').length > 90 ? '…' : ''}" siguiendo el proceso de diseño paso a paso.`;
  banner.appendChild(narrativa);
  if (plan.adecuacionNEE) {
    const badgeNEE = document.createElement('span');
    badgeNEE.className = 'plan-banner-kicker plan-banner-nee';
    badgeNEE.textContent = 'Incluye adecuación curricular NEE';
    banner.appendChild(badgeNEE);
  }
  contenedor.appendChild(banner);

  contenedor.appendChild(crearEncabezado(plan));

  const compSeccion = crearSeccion('Competencia de Grado');
  const compTexto = document.createElement('p');
  compTexto.textContent = plan.competencia;
  compSeccion.appendChild(compTexto);
  contenedor.appendChild(compSeccion);

  if (plan.indicadores && plan.indicadores.length) {
    const indSeccion = crearSeccion('Indicadores de Logro');
    indSeccion.appendChild(crearLista(plan.indicadores));
    contenedor.appendChild(indSeccion);
  }

  if (plan.actividades && plan.actividades.length) {
    const actividadesSeccion = crearSeccion('Proceso de Diseño');
    PASOS_DISENO.forEach((paso, i) => {
      if (plan.actividades[i]) actividadesSeccion.appendChild(crearActividadDiseno(paso, plan.actividades[i]));
    });
    contenedor.appendChild(actividadesSeccion);
  }

  if (plan.rubrica) {
    const rubricaSeccion = crearSeccion('Evaluación');
    rubricaSeccion.appendChild(conScroll(crearTablaRubrica(plan.rubrica)));
    contenedor.appendChild(rubricaSeccion);
  }

  const instrumentosSeccion = crearSeccion('Instrumentos de Evaluación');
  instrumentosSeccion.appendChild(crearHojaAutoevaluacion(plan));
  instrumentosSeccion.appendChild(crearHojaCoevaluacion(plan));
  contenedor.appendChild(instrumentosSeccion);

  document.getElementById('resultadosVacio').classList.add('hidden');
  document.getElementById('resultados').classList.remove('hidden');
}

export function mostrarLoading(mostrar) {
  document.getElementById('loading').classList.toggle('hidden', !mostrar);
}

export function mostrarError(mensaje) {
  const box = document.getElementById('errorBox');
  box.textContent = mensaje;
  box.classList.remove('hidden');
}

export function limpiarError() {
  const box = document.getElementById('errorBox');
  box.textContent = '';
  box.classList.add('hidden');
}
