# CODRIAN | The Digital Apocalypse — trailer vertical 40 s

Vídeo publicitário 1080×1920 (9:16), 30 fps, 40 s, feito 100 % em código: **Three.js** (cenas 3D, shaders, partículas na GPU),
**GSAP** (timeline mestre e DOM), **Canvas 2D** (relâmpagos/HUD) e **Web Audio API** (trilha e SFX sintetizados) + locuções **ElevenLabs**
(vozes **Yan v1** e **Rodrigo Ishikawa**; o concorrente usa a voz Thales).

## Como usar
```bash
cd codrian-trailer && npm install
npm run serve            # prévia em http://localhost:5173  (Play / scrub / ←→ quadro a quadro / som)
npm run voices           # (re)gera as locuções (precisa de acesso ao ElevenLabs: ELEVENLABS_API_KEY ou proxy)
npm run render           # MP4 final -> out/codrian_trailer_1080x1920.mp4
node tools/render.mjs --still 1.5,17.9,35.6   # PNGs de inspeção em out/stills/
node tools/render.mjs --frames 0-89 --out out/teste.mp4 --workers 4
node tools/audio-only.mjs                     # só a trilha -> out/audio_mix.wav
```
**Exportação:** o navegador não grava MP4 em tempo real com qualidade/sincronia garantidas, então o export usa uma *pipeline*:
Chromium headless → `CODRIAN.seek(t)` (cada quadro é função pura do tempo: determinístico) → JPEG → FFmpeg (H.264 CRF 16 + AAC).
O áudio é renderizado offline pelo **mesmo** motor da prévia e entra no MP4. Requer `ffmpeg` e Chromium/Playwright.

## Arquitetura
```
index.html                  prévia
src/config.js               formato, paleta da marca, cenas, marcos de tempo e cues de voz (fonte única de verdade)
src/main.js                 boot, API determinística window.CODRIAN.seek(t), transições entre cenas
src/core/stage.js           render → mistura de cenas (glitch / onda radial) → bloom → pós (CA, glitch, grain, vinheta, freeze)
src/core/camera-rig.js      câmeras por keyframes (Hermite), handheld e shakes por evento
src/core/particles.js       sistema de partículas GPU: ambient / burst / converge (determinístico por uTime)
src/core/gfx.js             cidade procedural (shader de fachadas), feixes volumétricos, grade, ambiente PMREM, placas holo
src/core/characters.js      personagens procedurais (rosto em canvas animável, lip-sync pela envoltória da voz)
src/core/overlay2d.js       relâmpagos e HUD em Canvas 2D
src/scenes/s1…s6            uma cena por módulo: three + dom + timeline GSAP + update(t) + post(t)
src/audio/engine|sfx|score  motor Web Audio offline, instrumentos/SFX, partitura (cue sheet) e mix das vozes
src/ui/                     texto animado (slam/glitch/shake), legendas sincronizadas, prévia
tools/                      gen-voices, render (frames+FFmpeg), audio-only, serve
assets/vo/                  locuções MP3 + envelopes.json (lip-sync/reatividade)
```
Linha do tempo: S1 0–4 · S2 4–10 · S3 10–16 · S4 16–24 (congela 16,0 → silêncio absoluto até 17,35 → onda de energia 17,4) · S5 24–34 · S6 34–40 (revelação 35,0; marca visível ≥ 5 s).

## Identidade visual (importante)
Paleta, fontes e regras vêm do *Pacote do Yan* (brand book): void `#100C1C`, violet `#6938E8`, violet-hi `#8B6CFF`, **lime `#B7FF4A`** (o "verde" da marca), ink `#F4F1FF`; DM Sans 700+, Silkscreen para rótulos.
- O **logotipo está reconstruído pela especificação** do brand book (`src/brand/logo.js`: "codrian" minúsculo, DM Sans 700, tracking −0,045 em, ponto lima 0,2 em na linha de base). **O vetor oficial não estava acessível** (fica no cofre do Yan). Para usar o arquivo oficial, troque `logoCanvas()` por um `drawImage` do SVG/PNG em `src/brand/logo.js`.
- O brief pede energia verde+roxa; o brand book limita o lima a ~3 % por peça e proíbe gradiente violeta→lima. O trailer usa lima/violeta como cores de efeito (decisão do brief), mas **sem gradiente violeta→lima no logotipo e com o ponto sempre lima**.
- Textos legais/promessas: nenhum número, resultado financeiro, depoimento ou posição no Google é prometido.
