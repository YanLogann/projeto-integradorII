// Gera as falas via ElevenLabs. A credencial é injetada pelo proxy do ambiente
// (ou via env ELEVENLABS_API_KEY). Nenhuma chave fica no código.
import fs from 'node:fs';
const NARRATOR = process.env.NARRATOR_VOICE || 'GIuLCSVfgJaUuh7hYOY8'; // Lucas - Deep narrator (pt-BR)
const CALLER   = 'BKv4Uz2HPF6TFlDgFBKN'; // voz feminina pt-BR (cliente ao telefone)
const OWNER    = '6PhbMr9YjdeOaTNz9y24'; // voz masculina pt-BR (empresário)
const lines = [
  { id: 'd1', voice: CALLER, text: 'Alô? Vocês têm site?', s: { stability: 0.5, similarity_boost: 0.8, style: 0.2, speed: 1.05 } },
  { id: 'd2', voice: OWNER,  text: 'Não...', s: { stability: 0.35, similarity_boost: 0.8, style: 0.4, speed: 0.9 } },
  { id: 'n1', voice: NARRATOR, text: 'Seu concorrente não precisa ser melhor que você. Só precisa ser mais fácil de encontrar.', s: { stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 1.12 } },
  { id: 'n2', voice: NARRATOR, text: 'Enquanto você espera o cliente chegar... ele já está comprando de alguém.', s: { stability: 0.4, similarity_boost: 0.8, style: 0.4, speed: 1.1 } },
  { id: 'n3', voice: NARRATOR, text: 'Mas existe uma maneira de mudar essa história: uma página que apresenta sua empresa, valoriza seus serviços e transforma visitas em oportunidades.', s: { stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: 1.15 } },
  { id: 'n4', voice: NARRATOR, text: 'A sua empresa merece mais do que apenas existir na internet. Ela precisa ser encontrada e lembrada.', s: { stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: 1.12 } },
  { id: 'n5', voice: NARRATOR, text: 'Pare de perder oportunidades. Comece a ser encontrado.', s: { stability: 0.55, similarity_boost: 0.8, style: 0.35, speed: 1.0 } },
];
const only = process.argv.slice(2);
for (const l of lines) {
  if (only.length && !only.includes(l.id)) continue;
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.ELEVENLABS_API_KEY) headers['xi-api-key'] = process.env.ELEVENLABS_API_KEY;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${l.voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: l.text, model_id: 'eleven_multilingual_v2', voice_settings: l.s }),
  });
  if (!r.ok) { console.error(l.id, r.status, await r.text()); process.exit(1); }
  const j = await r.json();
  fs.writeFileSync(`audio/voice/${l.id}.mp3`, Buffer.from(j.audio_base64, 'base64'));
  // agrupa caracteres em palavras com tempo de início/fim
  const a = j.alignment, words = [];
  let cur = null;
  a.characters.forEach((c, i) => {
    if (/\s/.test(c)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', s: a.character_start_times_seconds[i] };
    cur.w += c; cur.e = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  fs.writeFileSync(`audio/voice/${l.id}.json`, JSON.stringify({ text: l.text, words }, null, 1));
  console.log('ok', l.id);
}
