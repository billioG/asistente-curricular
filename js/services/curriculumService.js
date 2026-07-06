import { supabase } from '../config/supabaseClient.js';

const ORDEN_NIVEL = ['Inicial', 'Preprimaria', 'Primaria', 'Básico', 'Bachillerato', 'Perito'];

function nivelDeGrado(grado) {
  if (/nivel inicial/i.test(grado)) return 'Inicial';
  if (/párvulos/i.test(grado)) return 'Preprimaria';
  if (/bachillerato/i.test(grado)) return 'Bachillerato';
  if (/perito/i.test(grado)) return 'Perito';
  if (/básico/i.test(grado)) return 'Básico';
  return 'Primaria';
}

function rangoOrdinal(grado) {
  const s = grado.toLowerCase();
  const pares = [
    [/\b0 a 1\b/, 0], [/\b1 a 2\b/, 1], [/\b2 a 3\b/, 2], [/\b3 a 4\b/, 3],
    [/párvulos 1\b/, 0], [/párvulos 2\b/, 1], [/párvulos 3\b/, 2],
    [/primer(o)?\b/, 0], [/segundo\b/, 1], [/tercer(o)?\b/, 2],
    [/cuarto\b/, 3], [/quinto\b/, 4], [/sexto\b/, 5],
  ];
  for (const [re, rank] of pares) if (re.test(s)) return rank;
  return 99;
}

export function ordenarGrados(grados) {
  return [...grados].sort((a, b) => {
    const diffNivel = ORDEN_NIVEL.indexOf(nivelDeGrado(a)) - ORDEN_NIVEL.indexOf(nivelDeGrado(b));
    if (diffNivel !== 0) return diffNivel;
    const diffOrdinal = rangoOrdinal(a) - rangoOrdinal(b);
    if (diffOrdinal !== 0) return diffOrdinal;
    return a.localeCompare(b, 'es');
  });
}

export function agruparGradosPorNivel(gradosOrdenados) {
  const grupos = new Map();
  for (const grado of gradosOrdenados) {
    const nivel = nivelDeGrado(grado);
    if (!grupos.has(nivel)) grupos.set(nivel, []);
    grupos.get(nivel).push(grado);
  }
  return grupos;
}

export async function obtenerGrados() {
  const { data, error } = await supabase.from('competencias').select('grado');
  if (error) throw new Error('No se pudieron cargar los grados');
  const distintos = [...new Set(data.map((r) => r.grado))];
  return ordenarGrados(distintos);
}

export async function obtenerAreasPorGrado(grado) {
  const { data, error } = await supabase
    .from('competencias')
    .select('area')
    .eq('grado', grado)
    .order('area');
  if (error) throw new Error('No se pudieron cargar las áreas');
  return [...new Set(data.map((r) => r.area))];
}

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
