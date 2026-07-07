// Referencia: los prompts reales se construyen en el backend (netlify/functions/generar-plan.js)
// para evitar exponer lógica de negocio y prevenir inyección de prompt desde el cliente.

export const ETAPAS = {
  PASO: 'paso',
  RUBRICA: 'rubrica',
};

export const PASOS_DISENO = ['explorar', 'sintetizar', 'imaginar', 'crear', 'compartir'];

export const NOMBRE_PASO = {
  explorar: 'Explorar',
  sintetizar: 'Sintetizar',
  imaginar: 'Imaginar',
  crear: 'Crear',
  compartir: 'Compartir',
};

export const ICONO_PASO = {
  explorar: '🔍',
  sintetizar: '⚙️',
  imaginar: '💡',
  crear: '🛠️',
  compartir: '📣',
};

export const COLOR_PASO = {
  explorar: '#6d28d9',
  sintetizar: '#059669',
  imaginar: '#ea580c',
  crear: '#2563eb',
  compartir: '#db2777',
};
