// Validación de UX en frontend. La validación de seguridad real ocurre en el backend
// (netlify/functions/generar-plan.js) — nunca confiar solo en esto.

const ALLOWED_GRADOS = ['1ro', '2do', '3ro', '4to', '5to', '6to'];
const ALLOWED_AREAS = ['Comunicacion', 'Matematica', 'Ciencias', 'Sociales'];

export function validarFormulario({ grado, area, competencia }) {
  if (!ALLOWED_GRADOS.includes(grado)) throw new Error('Selecciona un grado válido');
  if (!ALLOWED_AREAS.includes(area)) throw new Error('Selecciona un área válida');
  if (!competencia || competencia.trim().length < 5) {
    throw new Error('Describe la competencia con al menos 5 caracteres');
  }
  if (competencia.length > 500) throw new Error('Competencia demasiado larga');
  return { grado, area, competencia: competencia.trim() };
}
