import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType,
} from 'https://esm.sh/docx@8';
import {
  CRITERIOS_AUTOEVALUACION, PREGUNTAS_REFLEXION, CRITERIOS_COEVALUACION, ESCALA_COEVALUACION,
} from './evaluationSheets.js';
import { NOMBRE_PASO } from '../prompts/promptTemplates.js';

const LINEA_ESCRITURA = '_'.repeat(70);

function celda(texto, opts = {}) {
  return new TableCell({
    width: { size: opts.size || 20, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ text: String(texto || ''), bold: opts.bold })],
  });
}

function tablaEncabezado(plan) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celda('Grado', { bold: true, size: 30 }), celda(plan.grado, { size: 70 })] }),
      new TableRow({ children: [celda('Área', { bold: true, size: 30 }), celda(plan.area, { size: 70 })] }),
      new TableRow({ children: [celda('Fecha', { bold: true, size: 30 }), celda(plan.fecha || '', { size: 70 })] }),
    ],
  });
}

function listaParrafos(items) {
  return (items || []).map((item) => new Paragraph({ text: `• ${item}` }));
}

function bloqueActividadDiseno(paso, act) {
  const titulo = `${NOMBRE_PASO[paso] || paso}${act.titulo ? ` — ${act.titulo}` : ''}`;
  const children = [
    new Paragraph({ text: titulo, heading: HeadingLevel.HEADING_2 }),
  ];
  if (act.objetivo) children.push(new Paragraph({ text: `Objetivo: ${act.objetivo}` }));
  if (act.tarea) children.push(new Paragraph({ text: `Tarea: ${act.tarea}` }));
  if (Array.isArray(act.recursos) && act.recursos.length) {
    children.push(new Paragraph({ text: 'Recursos:' }));
    children.push(...listaParrafos(act.recursos));
  }
  if (act.duracionMinutos) children.push(new Paragraph({ text: `Duración: ${act.duracionMinutos} min` }));
  return children;
}

function tablaRubrica(rubrica) {
  const encabezados = ['Criterio', 'Peso', 'Excelente', 'Logrado', 'En proceso', 'Inicial'];
  const filaEncabezado = new TableRow({
    children: encabezados.map((titulo) => celda(titulo, { bold: true })),
  });
  const filas = (rubrica.criterios || []).map(
    (c) => new TableRow({
      children: [c.criterio, c.peso != null ? `${c.peso}%` : '', c.excelente, c.logrado, c.en_proceso, c.inicial].map((valor) => celda(valor)),
    })
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [filaEncabezado, ...filas] });
}

function tablaCampos(campos) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: campos.map(([etiqueta, valor]) => new TableRow({
      children: [celda(etiqueta, { bold: true, size: 30 }), celda(valor || '', { size: 70 })],
    })),
  });
}

function tablaChecklistAutoeval() {
  const encabezado = new TableRow({
    children: [celda('', { bold: true, size: 40 }), celda('Sí, siempre', { bold: true, size: 20 }), celda('A veces', { bold: true, size: 20 }), celda('No, casi nunca', { bold: true, size: 20 })],
  });
  const filas = CRITERIOS_AUTOEVALUACION.map(
    (criterio) => new TableRow({
      children: [celda(criterio, { size: 40 }), celda('☐', { size: 20 }), celda('☐', { size: 20 }), celda('☐', { size: 20 })],
    })
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [encabezado, ...filas] });
}

function bloqueAutoevaluacion(plan) {
  const children = [
    new Paragraph({ text: 'Autoevaluación — Reflexión Individual', heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    tablaCampos([
      ['Proyecto / Competencia', (plan.competencia || '').slice(0, 80)],
      ['Grado', plan.grado],
      ['Nombre del estudiante', ''],
      ['Fecha', ''],
    ]),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Responde con honestidad. Esto no es un examen: es para reflexionar sobre lo que aprendiste y cómo trabajaste.' }),
    new Paragraph({ text: '1. Mi contribución al grupo', heading: HeadingLevel.HEADING_2 }),
    tablaChecklistAutoeval(),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '2. Reflexión (mínimo 3 líneas por pregunta)', heading: HeadingLevel.HEADING_2 }),
  ];

  PREGUNTAS_REFLEXION.forEach((pregunta) => {
    children.push(new Paragraph({ text: pregunta }));
    children.push(new Paragraph({ text: LINEA_ESCRITURA }));
    children.push(new Paragraph({ text: LINEA_ESCRITURA }));
    children.push(new Paragraph({ text: LINEA_ESCRITURA }));
  });

  children.push(new Paragraph({ text: '3. Mi autocalificación', heading: HeadingLevel.HEADING_2 }));
  children.push(new Paragraph({ text: 'Teniendo en cuenta mi esfuerzo real y mi aprendizaje, yo creo que merezco:' }));
  children.push(new Paragraph({ text: 'Excelente (4)   Logrado (3)   En Proceso (2)   Inicial (1)' }));
  children.push(new Paragraph({ text: '¿Por qué elegiste esa nota?' }));
  children.push(new Paragraph({ text: LINEA_ESCRITURA }));
  children.push(new Paragraph({ text: LINEA_ESCRITURA }));

  return children;
}

function tablaCoevaluacion() {
  const encabezado = new TableRow({
    children: [
      celda('Nombre del compañero', { bold: true, size: 30 }),
      ...CRITERIOS_COEVALUACION.map((c) => celda(c, { bold: true, size: 15 })),
      celda('Promedio', { bold: true, size: 10 }),
    ],
  });
  const filas = Array.from({ length: 4 }, () => new TableRow({
    children: [
      celda('', { size: 30 }),
      ...CRITERIOS_COEVALUACION.map(() => celda('', { size: 15 })),
      celda('', { size: 10 }),
    ],
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [encabezado, ...filas] });
}

function bloqueCoevaluacion(plan) {
  const children = [
    new Paragraph({ text: 'Coevaluación — Evaluación entre Compañeros', heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    tablaCampos([
      ['Tu nombre', ''],
      ['Grado', plan.grado],
      ['Nombre del grupo', ''],
    ]),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Evalúa a cada integrante de tu grupo (no te evalúes a ti mismo). Usa la siguiente escala para cada criterio.' }),
  ];

  ESCALA_COEVALUACION.forEach(({ valor, etiqueta, desc }) => {
    children.push(new Paragraph({ text: `${valor} (${etiqueta}): ${desc}` }));
  });

  children.push(new Paragraph({ text: '' }));
  children.push(tablaCoevaluacion());
  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Comentario adicional (opcional): ¿hubo algún problema en el grupo que el maestro deba conocer?' }));
  children.push(new Paragraph({ text: LINEA_ESCRITURA }));
  children.push(new Paragraph({ text: LINEA_ESCRITURA }));

  return children;
}

export async function descargarDocx(plan) {
  const children = [
    new Paragraph({ text: 'Plan de Clase - CNB Guatemala', heading: HeadingLevel.TITLE }),
    tablaEncabezado(plan),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Competencia de Grado', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: plan.competencia }),
  ];

  if (plan.indicadores && plan.indicadores.length) {
    children.push(new Paragraph({ text: 'Indicadores de Logro', heading: HeadingLevel.HEADING_1 }));
    children.push(...listaParrafos(plan.indicadores));
  }

  if (plan.actividades && plan.actividades.length) {
    children.push(new Paragraph({ text: 'Proceso de Diseño', heading: HeadingLevel.HEADING_1 }));
    ['explorar', 'sintetizar', 'imaginar', 'crear', 'compartir'].forEach((paso, i) => {
      if (plan.actividades[i]) children.push(...bloqueActividadDiseno(paso, plan.actividades[i]));
    });
  }

  if (plan.rubrica) {
    children.push(new Paragraph({ text: 'Evaluación', heading: HeadingLevel.HEADING_1 }));
    children.push(tablaRubrica(plan.rubrica));
  }

  children.push(...bloqueAutoevaluacion(plan));
  children.push(...bloqueCoevaluacion(plan));

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plan_clase_${Date.now()}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
