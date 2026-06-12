const fs = require('fs');
const path = require('path');

const apiUrl = process.env.FRONTEND_API_URL;
if (!apiUrl) {
  console.error('Eroare: FRONTEND_API_URL nu este setată.');
  process.exit(1);
}

const output = `window.FRONTEND_API_URL = ${JSON.stringify(apiUrl)};\n`;
const outPath = path.join(__dirname, 'public', 'env-config.js');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`env-config.js generat: ${apiUrl}`);
