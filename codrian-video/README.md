# CODRIAN — "O CLIENTE FOI ROUBADO" (45s · 1080x1920)

Vídeo publicitário em **Frame Motion 2D** (HTML/SVG/Canvas + GSAP), renderizado quadro a quadro com Playwright e exportado em MP4 com ffmpeg. Vozes, trilha e efeitos gerados no **ElevenLabs**.

## Estrutura
```
scripts/roteiro.mjs      falas, vozes e tempo de entrada de cada fala
scripts/gen-voices.mjs   TTS ElevenLabs (com timestamps por caractere)
scripts/gen-music.mjs    trilha ElevenLabs Music com seções cronometradas aos cortes
scripts/gen-sfx.mjs      efeitos sonoros ElevenLabs
scripts/build-cues.mjs   timestamps → src/data/cues.js (legendas palavra a palavra)
scripts/mix-audio.mjs    mix: trilha c/ ducking + vozes + SFX sincronizados às palavras
scripts/render.mjs       render determinístico (__seek(t) por quadro) → MP4
src/core.js              timeline mestre, câmera, parallax, flash, shake, glitch
src/fx-canvas.js         chuva, bokeh, poeira, partículas, granulação (Canvas)
src/scenes/01..11        uma cena por arquivo, ancorada nas palavras faladas
src/captions.js          legendas integradas
```

## Comandos
```
npm run draft    # 540x960 · 24fps → out/CODRIAN_o-cliente-foi-roubado_DRAFT.mp4
npm run final    # 1080x1920 · 30fps → out/CODRIAN_o-cliente-foi-roubado_FINAL.mp4
npm run stills   # quadros de conferência em out/stills
```
Pré-visualização ao vivo: abra `src/index.html` no navegador (clique para tocar o áudio de `out/audio-mix.wav`).
Mudou uma fala? `node scripts/gen-voices.mjs --force <cue>` e depois `npm run draft` — cenas e legendas se reposicionam sozinhas pelos timestamps.

## Mapa de cenas
| Tempo | Cena | Fala |
|---|---|---|
| 0–4.6 | Cena do crime (fita, sirenes, título) | Caso 047. Um cliente desapareceu. |
| 4.6–8 | Dossiê da vítima | A vítima: Marcos. Doze anos de mercado. |
| 8–11 | Depoimento + direct | (Marcos) Ele pediu orçamento no direct… e sumiu. |
| 11–17.2 | CCTV: busca → perfil → 4s → SAIU | Pesquisou no Google… quatro segundos… e saiu. |
| 17.2–21.2 | Quadro de evidências | Seis minutos depois, fechou com o concorrente. |
| 21.2–24 | Virada (preto) | Mas ninguém roubou esse cliente. |
| 24–29 | "Ele foi entregue" + 3 falhas | …sem site, sem prova, sem caminho. |
| 29–32.2 | Evidência → LANDING PAGE | A arma do concorrente? Uma Landing Page. |
| 32.2–37.4 | Landing Page protagonista | Abre em um segundo. Mostra prova. E leva direto pro WhatsApp. |
| 37.4–40.4 | Caso encerrado + marca | Caso encerrado. CODRIAN. |
| 40.4–45 | CTA seguir | Siga a CODRIAN… antes que o próximo seja o seu. |
