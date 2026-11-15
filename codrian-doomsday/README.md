# CODRIAN DOOMSDAY — trailer vertical (9:16, 60 s)

Trailer cinematográfico original para Reels/TikTok. Tudo é gerado por código: não há filmagem, banco de imagens nem trecho de trailer oficial.

## Como foi feito

| Camada | Ferramenta | Arquivos |
|---|---|---|
| Imagem | Shaders WebGL2 renderizados quadro a quadro no Chromium headless (Playwright) | `engine/` |
| Pós | HDR, bloom em 6 níveis, profundidade de campo, aberração cromática, glitch, grão, vinheta, motion blur por subquadros | `engine/core.js` |
| Cenas | Terra procedural + anomalia, cidade em raymarching, corredor de servidores, antagonista original em SDF, explosão de energia | `engine/shaders.js` |
| Montagem | Decupagem plano a plano, cortes na grade de 0,25 s da trilha | `engine/shots.js` |
| 2D | Partículas, painéis em fio, mapa, legendas palavra a palavra, logo oficial | `engine/fx.js` |
| Narração | ElevenLabs, voz "Miguel" (pt-BR, F0 mediana 94 Hz), com timestamps por caractere | `scripts/tts.py` |
| Trilha | Eleven Music, plano de composição em 5 seções cronometradas | `scripts/music.py` |
| Efeitos | ElevenLabs Sound Effects (14 efeitos) | `scripts/sfx.py` |
| Mix | Ducking sob a voz, silêncio dramático em 28,2–31,2 s, loudnorm em 2 passadas (-14 LUFS, -1,5 dBTP) | `scripts/mix.py` |

O logo é o arquivo oficial `codrian-logo-negativo.svg` do brand book (letras em curvas). O código só divide o desenho por letra para animar; a geometria não muda. A animação segue a seção "Motion e som" do brand book: letras da direita para a esquerda, 85 ms de intervalo, 950 ms, out-expo, desfoque de 14 px; ponto de 15% a 90% e oscilação `1 + 0,28·e^(−7t)·cos(14t)`; flash lima de 220 ms; dois anéis até 9×.

## Linha do tempo

| Cena | Tempo | Golpe da trilha |
|---|---|---|
| 1 O presságio | 0–8,24 | 0,23 |
| 2 O colapso | 8,24–16,0 | 8,24 · cortes a cada tempo |
| 3 A chegada | 16,0–31,23 | 16,0 (aterrissagem), silêncio 28,2–31,2 |
| 4 A virada | 31,23–48,5 | 31,23 · 39,22 (golpe maior) · cartões a cada 1 s |
| 5 A revelação | 48,5–60 | 48,5 explosão · 51,8 logo |

## Regerar

```bash
python3 scripts/tts.py && python3 scripts/music.py score_a && python3 scripts/sfx.py   # áudio (usa créditos ElevenLabs)
python3 scripts/build_timeline.py                                                     # legendas e cues
python3 scripts/mix.py                                                                # mix final
node scripts/render.js --out frames --from 0 --to 1800 --workers 4                    # 1800 quadros
scripts/encode.sh frames 30 out/codrian_doomsday_1080x1920.mp4
```

Para ver um instante específico: `node scripts/render.js --out stills --times 12.5,30.4`.

Os quadros (`frames/`, `stills*/`) e o áudio intermediário não vão para o git. O MP4 final fica em `out/`.
