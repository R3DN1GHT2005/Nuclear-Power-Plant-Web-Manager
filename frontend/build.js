/*
 * frontend/build.js
 * Build script for Vercel deployment — reads FRONTEND_API_URL from
 * environment and generates public/env-config.js with the value.
 * Called by "npm run build" during Vercel's deploy step.
 */
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
