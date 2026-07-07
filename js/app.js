import { checkAuth, logout } from './config/supabaseClient.js';
import { generarSeccion } from './config/grokClient.js';
import { buscarCompetencia, obtenerGrados, obtenerAreasPorGrado, agruparGradosPorNivel } from './services/curriculumService.js';
import { validarFormulario } from './services/validation.js';
import { descargarDocx } from './services/documentGenerator.js';
import { renderizarPlan, mostrarLoading, mostrarError, limpiarError } from './ui/resultsRenderer.js';
import { actualizarMago, initMago } from './ui/magoUI.js';
import { ETAPAS, SESIONES } from './prompts/promptTemplates.js';

let ultimoPlan = null;

async function generarPlan(datos) {
  const competenciaData = await buscarCompetencia(datos.grado, datos.area, datos.competencia);

  const sesiones = await Promise.all(
    SESIONES.map((sesion) =>
      generarSeccion({
        grado: datos.grado,
        area: datos.area,
        competencia: competenciaData.texto,
        indicadores: competenciaData.indicadores,
        etapa: ETAPAS.SESION,
        sesion,
      })
    )
  );

  const rubrica = await generarSeccion({
    grado: datos.grado,
    area: datos.area,
    competencia: competenciaData.texto,
    indicadores: competenciaData.indicadores,
    etapa: ETAPAS.RUBRICA,
  });

  return {
    grado: datos.grado,
    area: datos.area,
    competencia: competenciaData.texto,
    indicadores: competenciaData.indicadores,
    sesiones,
    rubrica,
    fecha: new Date().toLocaleDateString('es-GT'),
  };
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

  document.getElementById('formGenerar').addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarError();

    let datos;
    try {
      datos = validarFormulario({
        grado: document.getElementById('grado').value,
        area: document.getElementById('area').value,
        competencia: document.getElementById('competencia').value,
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
}

init();
