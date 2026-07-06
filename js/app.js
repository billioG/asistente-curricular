import { checkAuth, logout } from './config/supabaseClient.js';
import { generarSeccion } from './config/grokClient.js';
import { buscarCompetencia } from './services/curriculumService.js';
import { validarFormulario } from './services/validation.js';
import { descargarDocx } from './services/documentGenerator.js';
import { renderizarPlan, mostrarLoading, mostrarError, limpiarError } from './ui/resultsRenderer.js';
import { actualizarMago, initMago } from './ui/magoUI.js';
import { ETAPAS, MOMENTOS } from './prompts/promptTemplates.js';

let ultimoPlan = null;

async function generarPlan(datos) {
  const competenciaData = await buscarCompetencia(datos.grado, datos.area, datos.competencia);

  const componentes = await generarSeccion({
    ...datos,
    competencia: competenciaData.texto,
    etapa: ETAPAS.EXTRACCION,
  });

  const actividades = await Promise.all(
    MOMENTOS.map((momento) =>
      generarSeccion({ ...datos, competencia: competenciaData.texto, etapa: ETAPAS.ACTIVIDAD, momento })
    )
  );

  const rubrica = await generarSeccion({
    ...datos,
    competencia: competenciaData.texto,
    etapa: ETAPAS.RUBRICA,
  });

  return { competencia: competenciaData.texto, componentes, actividades, rubrica };
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
