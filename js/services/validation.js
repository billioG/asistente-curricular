// Validación de UX en frontend. La validación de seguridad real ocurre en el backend
// (netlify/functions/generar-plan.js), que verifica grado/área contra la base de datos.

export function validarFormulario({ grado, area, competencia, adecuacionNEE }) {
  if (!grado) throw new Error('Selecciona un grado');
  if (!area) throw new Error('Selecciona un área');
  if (!competencia || competencia.trim().length < 5) {
    throw new Error('Describe la competencia con al menos 5 caracteres');
  }
  if (competencia.length > 500) throw new Error('Competencia demasiado larga');
  return { grado, area, competencia: competencia.trim(), adecuacionNEE: Boolean(adecuacionNEE) };
}
