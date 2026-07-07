import { checkAuth, logout } from './config/supabaseClient.js';
import { generarSeccion } from './config/grokClient.js';
import {
  buscarCompetencia, obtenerGrados, obtenerAreasPorGrado, agruparGradosPorNivel, sugerirCompetencias,
} from './services/curriculumService.js';
import { validarFormulario } from './services/validation.js';
import { descargarDocx } from './services/documentGenerator.js';
import { renderizarPlan, mostrarLoading, mostrarError, limpiarError } from './ui/resultsRenderer.js';
import { actualizarMago, initMago } from './ui/magoUI.js';
import { ETAPAS, PASOS_DISENO } from './prompts/promptTemplates.js';

let ultimoPlan = null;

async function generarPlan(datos) {
  const competenciaData = await buscarCompetencia(datos.grado, datos.area, datos.competencia);

  const actividades = [];
  for (const paso of PASOS_DISENO) {
    actividades.push(await generarSeccion({
      grado: datos.grado,
      area: datos.area,
      competencia: competenciaData.texto,
      indicadores: competenciaData.indicadores,
      etapa: ETAPAS.PASO,
      paso,
      adecuacionNEE: datos.adecuacionNEE,
    }));
  }

  const rubrica = await generarSeccion({
    grado: datos.grado,
    area: datos.area,
    competencia: competenciaData.texto,
    indicadores: competenciaData.indicadores,
    etapa: ETAPAS.RUBRICA,
    adecuacionNEE: datos.adecuacionNEE,
  });

  return {
    grado: datos.grado,
    area: datos.area,
    competencia: competenciaData.texto,
    indicadores: competenciaData.indicadores,
    adecuacionNEE: datos.adecuacionNEE,
    actividades,
    rubrica,
    fecha: new Date().toLocaleDateString('es-GT'),
  };
}

function debounce(fn, ms) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), ms);
  };
}

async function actualizarSugerencias() {
  const grado = document.getElementById('grado').value;
  const area = document.getElementById('area').value;
  const texto = document.getElementById('competencia').value;
  const lista = document.getElementById('competenciaSugerencias');

  const sugerencias = await sugerirCompetencias(grado, area, texto);
  lista.textContent = '';
  if (!sugerencias.length) {
    lista.classList.add('hidden');
    return;
  }
  sugerencias.forEach((texto_completo) => {
    const li = document.createElement('li');
    li.textContent = texto_completo;
    li.addEventListener('click', () => {
      document.getElementById('competencia').value = texto_completo;
      lista.classList.add('hidden');
    });
    lista.appendChild(li);
  });
  lista.classList.remove('hidden');
}

async function poblarGrados() {
  const gradoSelect = document.getElementById('grado');
  try {
    const grados = await obtenerGrados();
    const grupos = agruparGradosPorNivel(grados);
    gradoSelect.textContent = '';
    gradoSelect.appendChild(new Option('Seleccionar...', ''));
    for (const [nivel, gradosDelNivel] of grupos) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = nivel;
      gradosDelNivel.forEach((grado) => optgroup.appendChild(new Option(grado, grado)));
      gradoSelect.appendChild(optgroup);
    }
  } catch (err) {
    gradoSelect.textContent = '';
    gradoSelect.appendChild(new Option('Error al cargar grados', ''));
    mostrarError(err.message);
  }
}

async function poblarAreas(grado) {
  const areaSelect = document.getElementById('area');
  if (!grado) {
    areaSelect.textContent = '';
    areaSelect.appendChild(new Option('Selecciona un grado primero', ''));
    areaSelect.disabled = true;
    return;
  }
  areaSelect.disabled = true;
  areaSelect.textContent = '';
  areaSelect.appendChild(new Option('Cargando áreas...', ''));
  try {
    const areas = await obtenerAreasPorGrado(grado);
    areaSelect.textContent = '';
    areaSelect.appendChild(new Option('Seleccionar...', ''));
    areas.forEach((area) => areaSelect.appendChild(new Option(area, area)));
    areaSelect.disabled = false;
  } catch (err) {
    areaSelect.textContent = '';
    areaSelect.appendChild(new Option('Error al cargar áreas', ''));
    mostrarError(err.message);
  }
}

async function init() {
  initMago();

  let user;
  try {
    user = await checkAuth();
  } catch {
    window.location.href = '/login.html';
    return;
  }
  if (!user) return;

  document.getElementById('btnLogout').addEventListener('click', logout);

  poblarGrados();

  document.getElementById('grado').addEventListener('change', (e) => {
    poblarAreas(e.target.value);
  });

  const sugerenciasLista = document.getElementById('competenciaSugerencias');
  const competenciaInput = document.getElementById('competencia');
  const sugerenciasDebounced = debounce(actualizarSugerencias, 300);
  competenciaInput.addEventListener('input', sugerenciasDebounced);
  document.addEventListener('click', (e) => {
    if (e.target !== competenciaInput && !sugerenciasLista.contains(e.target)) {
      sugerenciasLista.classList.add('hidden');
    }
  });

  document.getElementById('formGenerar').addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarError();

    let datos;
    try {
      datos = validarFormulario({
        grado: document.getElementById('grado').value,
        area: document.getElementById('area').value,
        competencia: document.getElementById('competencia').value,
        adecuacionNEE: document.getElementById('adecuacionNEE').checked,
      });
    } catch (err) {
      mostrarError(err.message);
      return;
    }

    mostrarLoading(true);
    actualizarMago('pensando');

    try {
      ultimoPlan = await generarPlan(datos);
      renderizarPlan(ultimoPlan);
      actualizarMago('feliz');
    } catch (err) {
      mostrarError(err.message);
      actualizarMago('error');
    } finally {
      mostrarLoading(false);
    }
  });

  document.getElementById('btnDescargar').addEventListener('click', () => {
    if (ultimoPlan) descargarDocx(ultimoPlan);
  });

  document.getElementById('btnDescargarPdf').addEventListener('click', () => {
    if (ultimoPlan) window.print();
  });
}

init();
