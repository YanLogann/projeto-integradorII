// Mixagem: lê a timeline (mesmos tempos da animação), posiciona voz + efeitos,
// abaixa a trilha sob a narração (sidechain) e normaliza para -14 LUFS (Reels/TikTok).
import fs from 'node:fs'; import vm from 'node:vm'; import { execFileSync } from 'node:child_process';
const CDg = {}; const ctx = { window: { CD: CDg }, CD: CDg, console }; vm.createContext(ctx);
for (const f of ['src/vo-data.js', 'src/lib/core.js', 'src/timeline.js', 'src/scenes/lp.js']) vm.runInContext(fs.readFileSync(f, 'utf8').replace(/^window\.CD = window\.CD \|\| \{\};/m, ''), ctx);
const CD = ctx.window.CD; CD.buildKeys();
const inputs = ['audio/music.wav'], voice = [], sfx = [];
for (const [id, t] of Object.entries(CD.T)) { inputs.push(`audio/voice/${id}.mp3`); voice.push({ i: inputs.length - 1, t, id }); }
for (const c of CD.CUES) { inputs.push(`audio/sfx/${c.s}.wav`); sfx.push({ i: inputs.length - 1, t: c.t, g: c.g }); }
const ms = (t) => Math.max(0, Math.round(t * 1000));
let f = '';
voice.forEach((v) => {
  const tel = v.id === 'd1' ? 'highpass=f=350,lowpass=f=3200,acrusher=bits=10:mix=0.25,volume=1.3,' : '';
  f += `[${v.i}]aresample=44100,aformat=channel_layouts=stereo,${tel}adelay=${ms(v.t)}|${ms(v.t)}[v${v.i}];`;
});
sfx.forEach((s) => { f += `[${s.i}]aformat=channel_layouts=stereo,volume=${s.g},adelay=${ms(s.t)}|${ms(s.t)}[s${s.i}];`; });
f += `${voice.map((v) => `[v${v.i}]`).join('')}amix=inputs=${voice.length}:normalize=0,apad=whole_dur=${CD.DUR}[vo];[vo]asplit=2[vo1][vosc];`;
f += `${sfx.map((s) => `[s${s.i}]`).join('')}amix=inputs=${sfx.length}:normalize=0,volume=0.8[fx];`;
f += `[0]volume=0.55[mu];[mu][vosc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[mud];`;
f += `[vo1][mud][fx]amix=inputs=3:normalize=0,atrim=0:${CD.DUR},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[out]`;
const args = ['-v', 'error', '-y']; inputs.forEach((p) => args.push('-i', p));
args.push('-filter_complex', f, '-map', '[out]', '-ac', '2', '-ar', '44100', 'out/mix.wav');
fs.mkdirSync('out', { recursive: true });
execFileSync('ffmpeg', args, { stdio: 'inherit' });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'out/mix.wav', '-c:a', 'aac', '-b:a', '192k', 'out/mix.m4a'], { stdio: 'inherit' });
console.log('out/mix.wav + out/mix.m4a ok —', inputs.length, 'faixas');
