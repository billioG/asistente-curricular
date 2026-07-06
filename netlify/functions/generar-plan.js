const { createClient } = require('@supabase/supabase-js');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const ALLOWED_ETAPAS = ['actividad', 'rubrica'];
const LIMITE_MENSUAL_DEFECTO = 30;

function validarEntrada(body) {
  const { grado, area, competencia, indicadores, etapa, momento } = body || {};

  if (typeof grado !== 'string' || grado.trim().length === 0 || grado.length > 150) {
    throw new Error('Grado no válido');
  }
  if (typeof area !== 'string' || area.trim().length === 0 || area.length > 150) {
    throw new Error('Área no válida');
  }
  if (!ALLOWED_ETAPAS.includes(etapa)) throw new Error('Etapa no válida');
  if (typeof competencia !== 'string' || competencia.length < 5 || competencia.length > 500) {
    throw new Error('Competencia inválida');
  }
  if (/[<>]/.test(competencia) || /[<>]/.test(grado) || /[<>]/.test(area)) {
    throw new Error('Caracteres no permitidos');
  }
  if (etapa === 'actividad' && !['inicio', 'desarrollo', 'cierre'].includes(momento)) {
    throw new Error('Momento no válido');
  }
  const indicadoresLimpios = Array.isArray(indicadores)
    ? indicadores.filter((i) => typeof i === 'string').slice(0, 20).map((i) => i.slice(0, 300))
    : [];

  return {
    grado: grado.trim(),
    area: area.trim(),
    competencia: competencia.trim(),
    indicadores: indicadoresLimpios,
    etapa,
    momento,
  };
}

async function verificarGradoArea(supabaseAdmin, grado, area) {
  const { data, error } = await supabaseAdmin
    .from('competencias')
    .select('id')
    .eq('grado', grado)
    .eq('area', area)
    .limit(1);
  if (error) throw new Error('No se pudo verificar el grado/área');
  if (!data || data.length === 0) {
    throw new Error('Ese grado/área no existe en el CNB');
  }
}

function construirPrompt({ etapa, grado, area, competencia, momento, indicadores }) {
  if (etapa === 'actividad') {
    return `Eres experto en pedagogía guatemalteca y el CNB. Diseña la actividad de "${momento}" de una clase de ${grado}, área ${area}, para la competencia: "${competencia}". Responde en JSON con las claves: titulo (string breve), objetivo (string), descripcion (string con los pasos detallados de la actividad), recursos (array de strings) y duracionMinutos (number).`;
  }
  return `Eres experto en evaluación educativa guatemalteca. Genera una rúbrica de evaluación en JSON para la competencia: "${competencia}" del área ${area}, ${grado}. Indicadores de logro: ${(indicadores || []).join('; ')}. Responde con la clave "criterios": un array de 3 a 4 objetos, cada uno con: criterio (string), excelente (string), logrado (string), en_proceso (string), inicial (string).`;
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

    await verificarGradoArea(supabaseAdmin, datos.grado, datos.area);
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
