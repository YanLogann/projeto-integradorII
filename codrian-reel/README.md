# Codrian — Reel 28s (1080×1920)

Vite + React + TypeScript + `motion` (`motion/react`). Um relógio único (`time`, em segundos)
dirige tudo: cenas, legendas e animações são funções dele — o mesmo `t` sempre gera o mesmo quadro.

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `src/script.ts` | **Fonte única**: narração por cena, textos de tela, vozes, modelo TTS |
| `src/scenes.json` | Gerado pelo `gen-voice`: início/fim das cenas e tempo de cada palavra, por voz |
| `src/clock.tsx` | Relógio + helpers (`useTween`, `useSpringAt`) presos ao relógio |
| `src/scenes/*` | Gancho, Dor, Virada, Série, CTA |
| `src/Captions.tsx` | Legenda queimada, palavra ativa destacada |
| `scripts/gen-voice.mjs` | ElevenLabs TTS `/with-timestamps` → mp3 + `scenes.json` |
| `scripts/render.mjs` | Playwright + ffmpeg → MP4 H.264 yuv420p 30fps |

## Uso

```bash
npm install
cp .env.example .env            # coloque ELEVENLABS_API_KEY (nunca commitar)
npm run voice                   # gera só o que falta (cache em public/voice); --force refaz
npm run dev                     # preview com áudio: ?voice=masculina|feminina|jovem  (&safe mostra a safe-zone)
npm run render:preview          # 540×960, 3 vozes, para aprovação → out/
npm run render -- --voice=feminina   # final 1080×1920
```

As cenas se ajustam à fala: duração = max(mínimo visual da cena, respiro + fala real + respiro).
A fala real é medida no mp3 (silencedetect) porque o alinhamento da ElevenLabs estica a última palavra.

## Render: `record` vs `frames`

- `--mode=record` grava em tempo real com `recordVideo` do Playwright. Medido aqui:
  **714/856 quadros (16,6% perdidos)** — o screencast do Chromium entrega ~25fps, e o MP4 sai com engasgos.
- `--mode=frames` (padrão do `npm run render`) congela o relógio em cada `t = i/30`, tira screenshot
  e envia ao ffmpeg. Zero quadros perdidos, mesmas animações. Por isso Remotion não é necessário
  agora; só vale migrar se quiser renderização distribuída/na nuvem ou o editor do Remotion.

## Antes de publicar

- Placeholders em `public/cases/` são **fictícios** (`npm run cases` os recria). Os números dos cases
  em `script.ts` (“+38 agendamentos/mês” etc.) são inventados: troque por dados reais ou remova.
- Confirme o @ e a cor da marca (`BRAND.handle` em `script.ts`, `--brand` em `src/index.css`).
