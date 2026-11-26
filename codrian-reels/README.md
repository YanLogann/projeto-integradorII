# A internet está comendo sua empresa — Codrian

Reels de 22 s, 1080x1920 e 30 fps, feito em Remotion. Os visuais são todos procedurais (SVG): não há nenhuma imagem estática.

```bash
npm install
npm run render   # out/internet-comendo.mp4
npm run master   # áudio em -14 LUFS → out/codrian-internet-comendo-reels.mp4
```

Em ambientes sem o Chrome do Remotion, use `--browser-executable=/caminho/do/chromium`.

| Arquivo | O que faz |
|---|---|
| `src/theme.ts` | Paleta (copiada das variáveis CSS de codrian.com.br) e a linha do tempo de todas as cenas |
| `src/Mouth.tsx` | A boca digital e as curvas de sucção |
| `src/City.tsx` | Fachadas, fragmentação, detritos, partículas e a física de sucção, com congelamento e explosão |
| `src/Hero.tsx` | A empresa que resiste, o hipercubo (a estrutura digital) e as linhas neon |
| `src/Typo.tsx` | Tipografia cinética e legenda queimada |
| `public/audio/` | Locução (ElevenLabs, voz "Rodrigo Ishikawa") e SFX gerados |
