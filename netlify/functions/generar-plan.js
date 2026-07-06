const { createClient } = require('@supabase/supabase-js');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const ALLOWED_GRADOS = ['1ro', '2do', '3ro', '4to', '5to', '6to'];
const ALLOWED_AREAS = ['Comunicacion', 'Matematica', 'Ciencias', 'Sociales'];
const ALLOWED_ETAPAS = ['extraccion', 'actividad', 'rubrica'];
const LIMITE_MENSUAL_DEFECTO = 30;

function validarEntrada(body) {
  const { grado, area, competencia, etapa, momento } = body || {};

  if (!ALLOWED_GRADOS.includes(grado)) throw new Error('Grado no válido');
  if (!ALLOWED_AREAS.includes(area)) throw new Error('Área no válida');
  if (!ALLOWED_ETAPAS.includes(etapa)) throw new Error('Etapa no válida');
  if (typeof competencia !== 'string' || competencia.length < 5 || competencia.length > 500) {
    throw new Error('Competencia inválida');
  }
  if (/[<>]/.test(competencia)) throw new Error('Caracteres no permitidos en competencia');
  if (etapa === 'actividad' && !['inicio', 'desarrollo', 'cierre'].includes(momento)) {
    throw new Error('Momento no válido');
  }
  return { grado, area, competencia: competencia.trim(), etapa, momento };
}

function construirPrompt({ etapa, grado, competencia, momento, indicadores }) {
  if (etapa === 'extraccion') {
    return `Extrae de la siguiente competencia del CNB de Guatemala sus componentes clave (indicadores de logro, contenidos, saberes) en formato JSON: "${competencia}"`;
  }
  if (etapa === 'actividad') {
    return `Como experto en pedagogía, diseña la actividad de "${momento}" para una clase de grado ${grado} cuya competencia es: "${competencia}". Responde en JSON con: titulo, descripcion, materiales, duracionMinutos.`;
  }
  return `Como experto en evaluación, genera una rúbrica en JSON (criterios, niveles: excelente/logrado/en_proceso/inicial) para la competencia: "${competencia}". Indicadores: ${(indicadores || []).join(', ')}`;
}

async function verificarLimite(supabaseAdmin, userId) {
  const inicioDelMes = new Date();
  inicioDelMes.setDate(1);
  inicioDelMes.setHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from('uso_api')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('fecha', inicioDelMes.toISOString());

  if (error) throw new Error('No se pudo verificar el límite de uso');
  if ((count || 0) >= LIMITE_MENSUAL_DEFECTO) {
    const err = new Error('Límite de generaciones mensual alcanzado');
    err.statusCode = 429;
    throw err;
  }
}

async function registrarUso(supabaseAdmin, userId) {
  await supabaseAdmin.from('uso_api').insert([{ user_id: userId, tipo: 'generacion_plan' }]);
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autenticado' }) };
    }
    const accessToken = authHeader.slice('Bearer '.length);

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sesión inválida' }) };
    }
    const userId = userData.user.id;

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) };
    }

    const datos = validarEntrada(payload);

    await verificarLimite(supabaseAdmin, userId);

    const prompt = construirPrompt(datos);

    const groqRes = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Eres experto en el Currículo Nacional Base (CNB) de Guatemala y en pedagogía. Responde siempre en JSON válido, sin texto adicional.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Error Groq:', errBody);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Error generando contenido con IA' }) };
    }

    const groqData = await groqRes.json();
    let resultado;
    try {
      resultado = JSON.parse(groqData.choices[0].message.content);
    } catch {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Respuesta de IA no válida' }) };
    }

    await registrarUso(supabaseAdmin, userId);

    return { statusCode: 200, headers, body: JSON.stringify({ resultado }) };
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return { statusCode, headers, body: JSON.stringify({ error: error.message }) };
  }
};
