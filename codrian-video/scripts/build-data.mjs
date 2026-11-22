// Converte os alinhamentos de voz (audio/voice/*.json) em src/vo-data.js para o navegador.
import fs from 'node:fs';
const VO = {};
for (const id of ['d1', 'd2', 'n1', 'n2', 'n3', 'n4', 'n5']) VO[id] = JSON.parse(fs.readFileSync(`audio/voice/${id}.json`, 'utf8'));
fs.writeFileSync('src/vo-data.js', `// gerado por scripts/build-data.mjs\nwindow.CD = window.CD || {};\nCD.VO = ${JSON.stringify(VO)};\n`);
console.log('src/vo-data.js ok');
