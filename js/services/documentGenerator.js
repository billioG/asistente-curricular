import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType,
} from 'https://esm.sh/docx@8';

const NOMBRE_MOMENTO = { inicio: 'Inicio', desarrollo: 'Desarrollo', cierre: 'Cierre' };

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

function bloqueActividad(momento, act) {
  const children = [
    new Paragraph({ text: `${NOMBRE_MOMENTO[momento] || momento} — ${act.titulo || ''}`, heading: HeadingLevel.HEADING_2 }),
  ];
  if (act.objetivo) children.push(new Paragraph({ text: `Objetivo: ${act.objetivo}` }));
  if (act.descripcion) children.push(new Paragraph({ text: `Descripción: ${act.descripcion}` }));
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

  if (plan.actividades) {
    children.push(new Paragraph({ text: 'Secuencia Didáctica', heading: HeadingLevel.HEADING_1 }));
    ['inicio', 'desarrollo', 'cierre'].forEach((momento, i) => {
      if (plan.actividades[i]) children.push(...bloqueActividad(momento, plan.actividades[i]));
    });
  }

  if (plan.rubrica) {
    children.push(new Paragraph({ text: 'Evaluación', heading: HeadingLevel.HEADING_1 }));
    children.push(tablaRubrica(plan.rubrica));
  }

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
