import { supabase } from '../config/supabaseClient.js';

export async function buscarCompetencia(grado, area, textoLibre) {
  const { data, error } = await supabase
    .from('competencias')
    .select('id, grado, area, texto_completo, codigo_cnb, indicadores')
    .eq('grado', grado)
    .eq('area', area)
    .ilike('texto_completo', `%${textoLibre.slice(0, 100)}%`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error('No se pudo consultar el CNB');

  if (data) {
    return { texto: data.texto_completo, indicadores: data.indicadores || [] };
  }
  return { texto: textoLibre, indicadores: [] };
}
