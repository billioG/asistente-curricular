function crearBloque(titulo, contenidoObj) {
  const wrap = document.createElement('div');
  wrap.className = 'plan-bloque';

  const h = document.createElement('h3');
  h.textContent = titulo;
  wrap.appendChild(h);

  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(contenidoObj, null, 2);
  wrap.appendChild(pre);

  return wrap;
}

export function renderizarPlan(plan) {
  const contenedor = document.getElementById('planContent');
  contenedor.textContent = '';

  const compTitulo = document.createElement('h2');
  compTitulo.textContent = 'Competencia';
  contenedor.appendChild(compTitulo);

  const compTexto = document.createElement('p');
  compTexto.textContent = plan.competencia;
  contenedor.appendChild(compTexto);

  if (plan.componentes) {
    contenedor.appendChild(crearBloque('Componentes', plan.componentes));
  }
  if (plan.actividades) {
    ['Inicio', 'Desarrollo', 'Cierre'].forEach((label, i) => {
      if (plan.actividades[i]) contenedor.appendChild(crearBloque(`Actividad: ${label}`, plan.actividades[i]));
    });
  }
  if (plan.rubrica) {
    contenedor.appendChild(crearBloque('Rúbrica', plan.rubrica));
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
