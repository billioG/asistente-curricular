const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

const content = `window.__ENV__ = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey })};\n`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'config', 'env.js'), content);
console.log('env.js generado');
