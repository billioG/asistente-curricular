const { createClient } = require('@supabase/supabase-js');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const ALLOWED_ETAPAS = ['sesion', 'rubrica'];
const LIMITE_MENSUAL_DEFECTO = 200;

function validarEntrada(body) {
  const { grado, area, competencia, indicadores, etapa, sesion } = body || {};

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
  if (etapa === 'sesion' && ![1, 2, 3].includes(sesion)) {
    throw new Error('Número de sesión no válido');
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
    sesion,
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

const ENFOQUE_SESION = {
  1: 'Inicio + Concreto',
  2: 'Pictórico + Práctica Guiada',
  3: 'Abstracto + Cierre',
};

const PLANTILLA_PASOS_SESION = {
  1: [
    { tiempo: '0-5 min', guia: 'Presentar un objeto real, una historia gancho o una pregunta detonante relacionada con el tema para activar curiosidad.' },
    { tiempo: '5-10 min', guia: 'Plantear un reto o problema inicial para que los estudiantes intenten resolverlo en parejas con sus propias ideas (dibujos, intentos, tanteo), sin enseñarles todavía el procedimiento.' },
    { tiempo: '10-35 min', guia: 'Entregar un material concreto y manipulable adaptado al área, y dar instrucciones paso a paso para construir el concepto a través del tacto y la manipulación.' },
    { tiempo: '35-40 min', guia: 'Cerrar preguntando qué encontraron y qué creen que aprendieron, verbalizando sus hallazgos para conectar con la siguiente sesión.' },
  ],
  2: [
    { tiempo: '0-5 min', guia: 'Recordar lo manipulado en la sesión 1 para activar la memoria.' },
    { tiempo: '5-25 min', guia: 'Dibujar en el pizarrón una representación visual de lo manipulado y pedir a los estudiantes que la copien y coloreen en su cuaderno, pasando de lo físico a lo pictórico.' },
    { tiempo: '25-35 min', guia: 'Escribir junto al dibujo la operación, fórmula o estructura abstracta correspondiente, resolviendo un ejemplo con participación guiada (el docente escribe, los estudiantes dictan los pasos).' },
    { tiempo: '35-40 min', guia: 'Cerrar anticipando la práctica autónoma de la siguiente sesión.' },
  ],
  3: [
    { tiempo: '0-5 min', guia: 'Presentar 3 problemas o retos escalonados en dificultad (fácil, medio, retador) relacionados con el tema.' },
    { tiempo: '5-25 min', guia: 'Los estudiantes resuelven en parejas mostrando el procedimiento mientras el docente circula apoyando a quienes se atrasan.' },
    { tiempo: '25-35 min', guia: 'Presentar un problema o situación de la vida real del estudiante (su casa, su comunidad) para aplicar lo aprendido de forma significativa.' },
    { tiempo: '35-40 min', guia: 'Cerrar con una pregunta de metacognición: qué aprendieron y dónde lo pueden usar en su vida.' },
  ],
};

function construirPromptSesion({ grado, area, competencia, sesion, indicadores }) {
  const enfoque = ENFOQUE_SESION[sesion];
  const guiaPasos = PLANTILLA_PASOS_SESION[sesion].map((p) => `- ${p.tiempo}: ${p.guia}`).join('\n');

  return `Eres experto en pedagogía guatemalteca y el CNB. Diseña la Sesión ${sesion} de 3 (enfoque: "${enfoque}") de una secuencia semanal de 3 sesiones de 40 minutos para ${grado}, área ${area}, sobre la competencia: "${competencia}". Indicadores de logro: ${(indicadores || []).join('; ')}.

Esta secuencia sigue el modelo Concreto-Pictórico-Abstracto (CPA): la sesión 1 usa material concreto y manipulable, la sesión 2 pasa a representación pictórica y práctica guiada, la sesión 3 practica de forma abstracta/autónoma y cierra con metacognición.

Estructura obligatoria de esta sesión (4 momentos con su rango de tiempo):
${guiaPasos}

Reglas obligatorias:
- Para cada uno de los 4 momentos, escribe accionMaestro como texto literal que el maestro puede decir o hacer en el aula (usa comillas para lo que dice), accionEstudiante describiendo lo que hace el estudiante, y proposito explicando el objetivo pedagógico de ese momento.
- Si el área es Matemática usa material concreto como palitos, frijoles o tiras de papel; si es Ciencias Naturales usa un experimento sencillo; si es Ciencias Sociales usa un mapa, foto antigua u objeto de la comunidad; si es Comunicación y Lenguaje usa un objeto misterioso o un cuento gancho; para otras áreas elige un objeto o herramienta real y manipulable ligada al tema.
- Nunca repitas el mismo texto en los 4 momentos; cada uno debe avanzar la secuencia.

Responde en JSON con las claves: titulo (string breve de la sesión), enfoque (string, exactamente "${enfoque}"), pasos (array de exactamente 4 objetos con: tiempo (string), accionMaestro (string), accionEstudiante (string), proposito (string)).`;
}

function construirPromptRubrica({ grado, area, competencia, indicadores }) {
  return `Eres experto en evaluación educativa guatemalteca. Genera una rúbrica de evaluación en JSON para la competencia: "${competencia}" del área ${area}, ${grado}, trabajada a lo largo de una secuencia de 3 sesiones. Indicadores de logro: ${(indicadores || []).join('; ')}.

Reglas obligatorias:
- Cada criterio debe tener un peso (porcentaje) y la suma de todos los pesos debe ser 100.
- Cada nivel (excelente, logrado, en_proceso, inicial) debe describir de forma concreta y observable qué hace el estudiante en ese nivel, evitando frases genéricas como "cumple" o "no cumple".
- Incluye criterios que evalúen tanto el dominio conceptual/técnico de la competencia como habilidades transversales relevantes (trabajo colaborativo, comunicación, pensamiento crítico) cuando la competencia lo permita.

Responde con la clave "criterios": un array de 3 a 5 objetos, cada uno con: criterio (string), peso (number, porcentaje), excelente (string), logrado (string), en_proceso (string), inicial (string).`;
}

function construirPrompt({ etapa, grado, area, competencia, sesion, indicadores }) {
  if (etapa === 'sesion') {
    return construirPromptSesion({ grado, area, competencia, sesion, indicadores });
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
