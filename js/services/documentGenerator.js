import { Document, Packer, Paragraph, HeadingLevel } from 'https://esm.sh/docx@8';

function parrafosDesdeTexto(texto) {
  return String(texto)
    .split('\n')
    .filter(Boolean)
    .map((linea) => new Paragraph(linea));
}

export async function descargarDocx(plan) {
  const children = [
    new Paragraph({ text: 'Plan de Clase - CNB Guatemala', heading: HeadingLevel.TITLE }),
    new Paragraph({ text: 'Competencia', heading: HeadingLevel.HEADING_1 }),
    ...parrafosDesdeTexto(plan.competencia),
  ];

  if (plan.componentes) {
    children.push(new Paragraph({ text: 'Componentes', heading: HeadingLevel.HEADING_1 }));
    children.push(...parrafosDesdeTexto(JSON.stringify(plan.componentes, null, 2)));
  }

  if (plan.actividades) {
    children.push(new Paragraph({ text: 'Actividades', heading: HeadingLevel.HEADING_1 }));
    ['inicio', 'desarrollo', 'cierre'].forEach((momento, i) => {
      const act = plan.actividades[i];
      if (!act) return;
      children.push(new Paragraph({ text: momento.toUpperCase(), heading: HeadingLevel.HEADING_2 }));
      children.push(...parrafosDesdeTexto(JSON.stringify(act, null, 2)));
    });
  }

  if (plan.rubrica) {
    children.push(new Paragraph({ text: 'Rúbrica de Evaluación', heading: HeadingLevel.HEADING_1 }));
    children.push(...parrafosDesdeTexto(JSON.stringify(plan.rubrica, null, 2)));
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
