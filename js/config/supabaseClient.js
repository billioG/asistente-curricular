import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase no configurado: falta SUPABASE_URL o SUPABASE_ANON_KEY en window.__ENV__');
}

// Placeholder evita que createClient('', '') lance de forma síncrona y rompa
// la carga del módulo (y con ella, toda la UI, incluido el mago guardián)
// cuando aún no se han inyectado las credenciales.
export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder');

export async function checkAuth() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}
