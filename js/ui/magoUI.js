const MENSAJES = {
  normal: 'Hola, soy tu guía del CNB. ¿Qué clase preparamos hoy?',
  pensando: 'Deja que la magia del CNB me guíe...',
  feliz: '¡Tu plan de clase está listo!',
  error: 'Algo salió mal en el hechizo. Intentemos de nuevo.',
  grado: (grado) => `Ah, ${grado} primaria... una edad maravillosa para aprender.`,
};

let magoAbierto = false;

function elementos() {
  return {
    avatar: document.getElementById('magoAvatar'),
    burbuja: document.getElementById('magoBurbuja'),
    texto: document.getElementById('magoTexto'),
    toggle: document.getElementById('magoToggle'),
    cerrar: document.getElementById('magoCerrar'),
  };
}

export function actualizarMago(estado, mensajeCustom) {
  const { avatar, burbuja, texto } = elementos();
  if (!avatar) return;
  avatar.src = `assets/mago/mago_${estado}.svg`;
  texto.textContent = mensajeCustom || MENSAJES[estado] || MENSAJES.normal;
  mostrarBurbuja(true);
}

function mostrarBurbuja(mostrar) {
  const { burbuja, toggle } = elementos();
  magoAbierto = mostrar;
  burbuja.classList.toggle('hidden', !mostrar);
  toggle.setAttribute('aria-expanded', String(mostrar));
}

export function initMago() {
  const { toggle, cerrar } = elementos();
  toggle.addEventListener('click', () => mostrarBurbuja(!magoAbierto));
  cerrar.addEventListener('click', () => mostrarBurbuja(false));

  const grado = document.getElementById('grado');
  grado?.addEventListener('change', (e) => {
    if (e.target.value) actualizarMago('normal', MENSAJES.grado(e.target.value));
  });
}
