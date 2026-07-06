const NOMBRE_MOMENTO = { inicio: 'Inicio', desarrollo: 'Desarrollo', cierre: 'Cierre' };

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

function crearActividad(momento, act) {
  const wrap = document.createElement('div');
  wrap.className = 'plan-momento';

  const h3 = document.createElement('h3');
  h3.textContent = `${NOMBRE_MOMENTO[momento] || momento} — ${act.titulo || ''}`;
  wrap.appendChild(h3);

  if (act.objetivo) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Objetivo: ';
    p.appendChild(strong);
    p.append(act.objetivo);
    wrap.appendChild(p);
  }

  if (act.descripcion) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Descripción: ';
    p.appendChild(strong);
    p.append(act.descripcion);
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

export function renderizarPlan(plan) {
  const contenedor = document.getElementById('planContent');
  contenedor.textContent = '';

  const titulo = document.createElement('h1');
  titulo.textContent = 'Plan de Clase';
  contenedor.appendChild(titulo);

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

  if (plan.actividades) {
    const actSeccion = crearSeccion('Secuencia Didáctica');
    ['inicio', 'desarrollo', 'cierre'].forEach((momento, i) => {
      if (plan.actividades[i]) actSeccion.appendChild(crearActividad(momento, plan.actividades[i]));
    });
    contenedor.appendChild(actSeccion);
  }

  if (plan.rubrica) {
    const rubricaSeccion = crearSeccion('Evaluación');
    rubricaSeccion.appendChild(crearTablaRubrica(plan.rubrica));
    contenedor.appendChild(rubricaSeccion);
  }

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
