import { supabase } from '../config/supabaseClient.js';

let modoRegistro = false;

function mostrarError(mensaje) {
  const box = document.getElementById('authError');
  box.textContent = mensaje;
  box.classList.remove('hidden');
}

function limpiarError() {
  const box = document.getElementById('authError');
  box.textContent = '';
  box.classList.add('hidden');
}

async function redirigirSiAutenticado() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) window.location.href = '/index.html';
}

function init() {
  redirigirSiAutenticado();

  const form = document.getElementById('formLogin');
  const btnToggle = document.getElementById('btnToggleMode');

  btnToggle.addEventListener('click', () => {
    modoRegistro = !modoRegistro;
    btnToggle.textContent = modoRegistro
      ? '¿Ya tienes cuenta? Inicia sesión'
      : '¿No tienes cuenta? Regístrate';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const { error } = modoRegistro
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      window.location.href = '/index.html';
    } catch (err) {
      mostrarError(err.message || 'Error de autenticación');
    }
  });
}

init();
