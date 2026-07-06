// Concatena todos los archivos SQL de data/raw/ en un solo archivo de migración,
// ordenados por nivel educativo (inicial, preprimaria, primaria, basico, bachillerato, perito)
// y numéricamente dentro de cada nivel (cnb_primaria_2 antes que cnb_primaria_10).
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'data', 'raw');
const OUT_FILE = path.join(__dirname, '..', 'data', 'cnb_competencias_seed.sql');

const LEVEL_ORDER = ['inicial', 'preprimaria', 'primaria', 'basico', 'bachillerato', 'perito'];

function levelOf(filename) {
  const m = filename.match(/^cnb_([a-z]+)/);
  return m ? m[1] : 'zzz';
}

function numOf(filename) {
  const m = filename.match(/_(\d+)\.sql$/);
  return m ? parseInt(m[1], 10) : 0;
}

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.sql'));

files.sort((a, b) => {
  const la = LEVEL_ORDER.indexOf(levelOf(a));
  const lb = LEVEL_ORDER.indexOf(levelOf(b));
  if (la !== lb) return la - lb;
  return numOf(a) - numOf(b);
});

const header = `-- CNB Guatemala - Seed de competencias (Currículum Nacional Base)
-- Generado automáticamente concatenando ${files.length} archivos de data/raw/
-- Niveles: Inicial, Preprimaria, Primaria, Ciclo Básico, Bachillerato (15 orientaciones), Perito
-- Ejecutar contra la tabla \`competencias\` definida en supabase/schema.sql
-- Fecha de generación: ejecutar \`npm run concat-cnb\` para regenerar tras nuevos archivos en data/raw/

`;

const body = files
  .map(f => `-- ===== ${f} =====\n` + fs.readFileSync(path.join(RAW_DIR, f), 'utf8').trimEnd() + '\n')
  .join('\n');

fs.writeFileSync(OUT_FILE, header + body);

console.log(`Concatenados ${files.length} archivos -> ${path.relative(process.cwd(), OUT_FILE)}`);
