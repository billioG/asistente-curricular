const MENSAJES = {
  normal: 'Hola, soy tu quetzal guía del CNB. ¿Qué clase preparamos hoy?',
  pensando: 'Alzando el vuelo para traerte las mejores ideas del CNB...',
  feliz: '¡Tu plan de clase está listo!',
  error: 'Se enredaron mis plumas. Intentemos de nuevo.',
  grado: (grado) => `Ah, ${grado} primaria... una edad maravillosa para aprender.`,
};

let quetzalAbierto = false;

function elementos() {
  return {
    avatar: document.getElementById('quetzalAvatar'),
    burbuja: document.getElementById('quetzalBurbuja'),
    texto: document.getElementById('quetzalTexto'),
    toggle: document.getElementById('quetzalToggle'),
    cerrar: document.getElementById('quetzalCerrar'),
  };
}

export function actualizarQuetzal(estado, mensajeCustom) {
  const { avatar, burbuja, texto } = elementos();
  if (!avatar) return;
  avatar.src = `assets/quetzal/quetzal_${estado}.svg`;
  texto.textContent = mensajeCustom || MENSAJES[estado] || MENSAJES.normal;
  mostrarBurbuja(true);
}

function mostrarBurbuja(mostrar) {
  const { burbuja, toggle } = elementos();
  quetzalAbierto = mostrar;
  burbuja.classList.toggle('hidden', !mostrar);
  toggle.setAttribute('aria-expanded', String(mostrar));
}

export function initQuetzal() {
  const { toggle, cerrar } = elementos();
  toggle.addEventListener('click', () => mostrarBurbuja(!quetzalAbierto));
  cerrar.addEventListener('click', () => mostrarBurbuja(false));

  const grado = document.getElementById('grado');
  grado?.addEventListener('change', (e) => {
    if (e.target.value) actualizarQuetzal('normal', MENSAJES.grado(e.target.value));
  });
}
