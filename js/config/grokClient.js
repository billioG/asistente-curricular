import { supabase } from './supabaseClient.js';

export async function generarSeccion({ grado, area, competencia, indicadores, etapa, sesion }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No autenticado');

  const res = await fetch('/.netlify/functions/generar-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ grado, area, competencia, indicadores, etapa, sesion }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al generar contenido');
  }
  return data.resultado;
}
