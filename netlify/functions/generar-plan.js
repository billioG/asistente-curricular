const { createClient } = require('@supabase/supabase-js');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const ALLOWED_ETAPAS = ['paso', 'rubrica'];
const PASOS_VALIDOS = ['explorar', 'sintetizar', 'imaginar', 'crear', 'compartir'];
const LIMITE_MENSUAL_DEFECTO = 200;

function validarEntrada(body) {
  const { grado, area, competencia, indicadores, etapa, paso } = body || {};

  if (typeof grado !== 'string' || grado.trim().length === 0 || grado.length > 150) {
    throw new Error('Grado no válido');
  }
  if (typeof area !== 'string' || area.trim().length === 0 || area.length > 150) {
    throw new Error('Área no válida');
  }
  if (!ALLOWED_ETAPAS.includes(etapa)) throw new Error('Etapa no válida');
  if (typeof competencia !== 'string' || competencia.length < 5 || competencia.length > 1000) {
    throw new Error('Competencia inválida');
  }
  if (/[<>]/.test(competencia) || /[<>]/.test(grado) || /[<>]/.test(area)) {
    throw new Error('Caracteres no permitidos');
  }
  if (etapa === 'paso' && !PASOS_VALIDOS.includes(paso)) {
    throw new Error('Paso del proceso de diseño no válido');
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
    paso,
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

const NOMBRE_PASO = {
  explorar: 'Explorar',
  sintetizar: 'Sintetizar',
  imaginar: 'Imaginar',
  crear: 'Crear',
  compartir: 'Compartir',
};

const FUNCION_PASO = {
  explorar: 'Investigar y comprender el problema o tema desde distintos puntos de vista: qué lo causa, a quién afecta, qué se sabe y qué no. El estudiante recolecta datos, hace preguntas u observaciones concretas (anotándolas en su cuaderno de diseño) antes de proponer soluciones.',
  sintetizar: 'Organizar lo investigado en la fase anterior, darle sentido y definir con claridad el reto específico que se va a resolver: un objetivo concreto y accionable, eligiendo un enfoque o situación real específica cuando aplique.',
  imaginar: 'Generar tantas ideas creativas como sea posible para resolver el reto definido, siguiendo reglas de lluvia de ideas: generar muchas ideas, construir sobre las ideas de los demás, no descartar ideas poco convencionales, y evitar quedarse con la primera solución obvia.',
  crear: 'Construir un prototipo o producto tangible (maqueta, dibujo detallado, esquema, texto, experimento) de la mejor idea, y definir cómo se probará o mejorará con retroalimentación de otros.',
  compartir: 'Comunicar la solución diseñada a una audiencia real (compañeros, familia, comunidad) de forma clara y convincente, explicando el problema, la solución y por qué funciona.',
};

function construirPromptPaso({ grado, area, competencia, paso, indicadores }) {
  const nombre = NOMBRE_PASO[paso];

  return `Eres experto en pedagogía guatemalteca, el CNB y el proceso de diseño (design thinking) usado por agencias de innovación educativa. Diseña la actividad del paso "${nombre}" del proceso de diseño (Explorar, Sintetizar, Imaginar, Crear, Compartir) para ${grado}, área ${area}, sobre la competencia: "${competencia}". Indicadores de logro: ${(indicadores || []).join('; ')}.

Función pedagógica de este paso: ${FUNCION_PASO[paso]}

Reglas obligatorias:
- Enmarca al estudiante como un "ingeniero" o "diseñador de soluciones" que resuelve un reto real relacionado con la competencia, en tono motivador y cercano a su edad.
- La tarea debe usar el cuaderno de diseño del estudiante (donde anota, dibuja o escribe) y dar pasos concretos y accionables, nunca instrucciones vagas.
- El objetivo y la tarea deben ser distintos y avanzar respecto a los otros 4 pasos; nunca repitas el mismo contenido genérico en todos.
- La duración debe ser realista para un período de clase (10 a 20 minutos por paso).

Responde en JSON con las claves: titulo (string breve), objetivo (string específico de este paso), tarea (string con las instrucciones detalladas para el estudiante), recursos (array de strings) y duracionMinutos (number).`;
}

function construirPromptRubrica({ grado, area, competencia, indicadores }) {
  return `Eres experto en evaluación educativa guatemalteca. Genera una rúbrica de evaluación en JSON para la competencia: "${competencia}" del área ${area}, ${grado}, trabajada a lo largo de un proceso de diseño de 5 pasos (Explorar, Sintetizar, Imaginar, Crear, Compartir). Indicadores de logro: ${(indicadores || []).join('; ')}.

Reglas obligatorias:
- Cada criterio debe tener un peso (porcentaje) y la suma de todos los pesos debe ser 100.
- Cada nivel (excelente, logrado, en_proceso, inicial) debe describir de forma concreta y observable qué hace el estudiante en ese nivel, evitando frases genéricas como "cumple" o "no cumple".
- Incluye criterios que evalúen tanto el dominio conceptual/técnico de la competencia como habilidades transversales relevantes (trabajo colaborativo, comunicación, pensamiento crítico, creatividad) cuando la competencia lo permita.

Responde con la clave "criterios": un array de 3 a 5 objetos, cada uno con: criterio (string), peso (number, porcentaje), excelente (string), logrado (string), en_proceso (string), inicial (string).`;
}

function construirPrompt({ etapa, grado, area, competencia, paso, indicadores }) {
  if (etapa === 'paso') {
    return construirPromptPaso({ grado, area, competencia, paso, indicadores });
  }
  return construirPromptRubrica({ grado, area, competencia, indicadores });
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
