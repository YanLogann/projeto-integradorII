// Gera locução (ElevenLabs) + efeitos sonoros sincronizados com a cena e
// junta tudo no MP4 exportado por `npm run record`.
//
// Uso:
//   ELEVENLABS_API_KEY=... node scripts/audio.mjs <VOICE_ID>
//   (ou ELEVEN_VOICE_ID=... no ambiente)
//
// Saídas (em out/):
//   codrian-audio.m4a                  trilha final (-14 LUFS, padrão Instagram)
//   codrian-reels-com-audio.mp4        1080x1920 com som
//   codrian-previa-com-audio.mp4       540x960 leve, para aprovação
//
// Os áudios gerados ficam em .audio/<voice>/ e são reaproveitados: mudar uma
// fala só regenera aquela fala. Apague a pasta para gerar tudo de novo.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { createHash } from "node:crypto";

const VOICE = process.argv[2] ?? process.env.ELEVEN_VOICE_ID;
if (!VOICE) {
  console.error("Informe o Voice ID: node scripts/audio.mjs <VOICE_ID>");
  process.exit(1);
}
const KEY = process.env.ELEVENLABS_API_KEY ?? "";
const API = "https://api.elevenlabs.io/v1";
const MODEL = process.env.ELEVEN_MODEL ?? "eleven_multilingual_v2";
const DURATION = 15.5; // 15s de cena + 0,5s parado (igual ao record.mjs)

// ---- roteiro: cada fala começa junto com a legenda e precisa caber até `end`
const LINES = [
  { at: 0.2, end: 2.85, text: "O que tem dentro de um site que vende?" },
  { at: 3.0, end: 5.9, text: "Cada camada é pensada pra prender quem chega." },
  { at: 6.3, end: 7.1, text: "Rápido." },
  { at: 7.15, end: 7.95, text: "Bonito." },
  { at: 8.0, end: 9.6, text: "Vendendo!" },
  { at: 10.4, end: 13.0, text: "E o seu cliente chama direto no WhatsApp." },
  { at: 13.25, end: 15.4, text: "Codrian. Sites que vendem." },
];

// ---- efeitos (ElevenLabs Sound Effects), volume em dB
const SFX = [
  { at: 0, dur: 15.5, db: -20, text: "dark minimal cinematic ambient drone, soft low synth pad, subtle pulse, no melody, seamless" },
  { at: 0.25, dur: 1.6, db: -6, text: "fast bright light sweep whoosh, laser swipe, cinematic, clean" },
  { at: 1.5, dur: 1.2, db: -9, text: "soft deep cinematic sub bass impact, short reverb tail" },
  { at: 2.3, dur: 2.5, db: -12, text: "airy whoosh of glass layers separating in 3D, smooth, futuristic UI" },
  { at: 5.6, dur: 1.5, db: -13, text: "smooth camera orbit swoosh, subtle, airy" },
  { at: 10.7, dur: 1.0, db: -8, text: "clean smartphone message notification ding, modern, short" },
  { at: 13.15, dur: 2.0, db: -7, text: "elegant cinematic logo reveal hit with shimmer, short tail" },
];

const voiceSettings = { stability: 0.45, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true, speed: 1.0 };

const root = process.cwd();
const cache = join(root, ".audio", VOICE);
const out = join(root, "out");
mkdirSync(cache, { recursive: true });
mkdirSync(out, { recursive: true });

const hash = (o) => createHash("sha1").update(JSON.stringify(o)).digest("hex").slice(0, 10);
const probe = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

async function fetchAudio(url, body, file) {
  if (existsSync(file)) return file;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

// Corta o silêncio do começo/fim da fala para o encaixe ficar preciso.
function trimSilence(src) {
  const dst = src.replace(/\.mp3$/, ".trim.wav");
  if (!existsSync(dst)) {
    const f = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02";
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", src, "-af", `${f},areverse,${f},areverse`, "-ar", "44100", "-ac", "2", dst]);
  }
  return dst;
}

const inputs = []; // { file, at, filters }

for (const [i, line] of LINES.entries()) {
  const body = { text: line.text, model_id: MODEL, voice_settings: voiceSettings };
  const mp3 = join(cache, `voz-${i}-${hash(body)}.mp3`);
  await fetchAudio(`${API}/text-to-speech/${VOICE}?output_format=mp3_44100_128`, body, mp3);
  const wav = trimSilence(mp3);
  const len = probe(wav);
  const slot = line.end - line.at;
  // se a fala não couber, acelera um pouco (até 1.2x, acima disso soa artificial)
  const tempo = len > slot ? Math.min(len / slot, 1.2) : 1;
  if (len / slot > 1.2) console.warn(`! fala ${i + 1} ficou longa (${len.toFixed(2)}s para ${slot.toFixed(2)}s): encurte o texto`);
  console.log(`fala ${i + 1}: ${len.toFixed(2)}s${tempo > 1 ? ` -> x${tempo.toFixed(2)}` : ""}  "${line.text}"`);
  inputs.push({ file: wav, at: line.at, filters: [tempo > 1 ? `atempo=${tempo.toFixed(3)}` : null], voice: true });
}

for (const [i, fx] of SFX.entries()) {
  const body = { text: fx.text, duration_seconds: fx.dur, prompt_influence: 0.5 };
  const mp3 = join(cache, `sfx-${i}-${hash(body)}.mp3`);
  await fetchAudio(`${API}/sound-generation`, body, mp3);
  const fade = i === 0 ? ",afade=t=in:d=0.6,afade=t=out:st=14.3:d=1.2" : "";
  inputs.push({ file: mp3, at: fx.at, filters: [`volume=${fx.db}dB${fade}`] });
  console.log(`efeito ${i + 1}: "${fx.text.slice(0, 50)}..."`);
}

// ---- mixagem: voz por cima, efeitos abaixam (sidechain) quando há fala
const args = ["-loglevel", "error", "-y"];
inputs.forEach((x) => args.push("-i", x.file));
const parts = inputs.map((x, i) => {
  const ms = Math.round(x.at * 1000);
  const chain = [...x.filters.filter(Boolean), "aformat=sample_rates=44100:channel_layouts=stereo", `adelay=${ms}|${ms}`, "apad"];
  return `[${i}:a]${chain.join(",")}[a${i}]`;
});
const voices = inputs.map((x, i) => (x.voice ? `[a${i}]` : "")).join("");
const fx = inputs.map((x, i) => (x.voice ? "" : `[a${i}]`)).join("");
const nV = inputs.filter((x) => x.voice).length;
const nF = inputs.length - nV;
const graph = [
  ...parts,
  `${voices}amix=inputs=${nV}:normalize=0,volume=2dB,asplit[vox][key]`,
  `${fx}amix=inputs=${nF}:normalize=0[fxmix]`,
  `[fxmix][key]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=300[duck]`,
  `[vox][duck]amix=inputs=2:normalize=0,atrim=0:${DURATION},loudnorm=I=-14:TP=-1.5:LRA=11[out]`,
].join(";");

const audio = join(out, "codrian-audio.m4a");
execFileSync("ffmpeg", [...args, "-filter_complex", graph, "-map", "[out]", "-ar", "44100", "-c:a", "aac", "-b:a", "192k", audio]);
console.log(`\ntrilha: ${audio}`);

const video = join(out, "codrian-reels-1080x1920.mp4");
if (!existsSync(video)) {
  console.log("Vídeo não encontrado: rode `npm run record` e depois este script de novo.");
  process.exit(0);
}
const full = join(out, "codrian-reels-com-audio.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", full]);
const prev = join(out, "codrian-previa-com-audio.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", full, "-vf", "scale=540:960,fps=24", "-c:v", "libx264", "-preset", "veryfast", "-crf", "32", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", prev]);
console.log(`vídeo: ${full}\nprévia: ${prev}`);
