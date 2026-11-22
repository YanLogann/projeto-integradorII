# CODRIAN — O Cemitério dos Clientes

Vídeo publicitário 9:16 em estética **paper cutout / stop motion**, 100% em JavaScript (Canvas 2D),
renderizado quadro a quadro no Chromium e codificado com ffmpeg.

## Estrutura
- `index.html` — player ao vivo (com áudio) e modo render (`?render&scale=0.5`)
- `src/lib/` — motor: `core` (câmera/parallax, easing, tempo 12 fps), `paper` (recortes com borda viva, sombra, textura), `chars` (empresário, clientes, telefone, celular, balões, ícones), `fx` (luz, grão, estilhaços, legendas)
- `src/scenes/` — `shop` (cenário da loja), `lp` (landing page de papel), `s1`…`s6` (uma por cena)
- `src/timeline.js` — tempos mestres; a narração dita o ritmo (timestamps por palavra da ElevenLabs)
- `audio/voice/` — falas (ElevenLabs, multilingual v2) + alinhamento por palavra
- `audio/sfx/`, `audio/music.wav` — efeitos e trilha sintetizados por `scripts/gen-audio.mjs` (originais)

## Renderizar de novo
```bash
npm install                 # fontes (Anton, Inter)
npm run voice               # (opcional) regera as falas — usa a credencial do ambiente, nunca no código
npm run audio && npm run mix
npm run preview             # 540x960 rápido
npm run render              # 1080x1920 final
```
Para ver ao vivo: sirva a pasta (`npx serve .`) e abra `index.html`.
