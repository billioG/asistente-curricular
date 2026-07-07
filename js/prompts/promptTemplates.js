// Referencia: los prompts reales se construyen en el backend (netlify/functions/generar-plan.js)
// para evitar exponer lógica de negocio y prevenir inyección de prompt desde el cliente.

export const ETAPAS = {
  SESION: 'sesion',
  RUBRICA: 'rubrica',
};

export const SESIONES = [1, 2, 3];

export const ENFOQUE_SESION = {
  1: 'Inicio + Concreto',
  2: 'Pictórico + Práctica Guiada',
  3: 'Abstracto + Cierre',
};
