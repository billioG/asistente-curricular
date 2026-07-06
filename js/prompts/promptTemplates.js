// Referencia: los prompts reales se construyen en el backend (netlify/functions/generar-plan.js)
// para evitar exponer lógica de negocio y prevenir inyección de prompt desde el cliente.

export const ETAPAS = {
  ACTIVIDAD: 'actividad',
  RUBRICA: 'rubrica',
};

export const MOMENTOS = ['inicio', 'desarrollo', 'cierre'];
