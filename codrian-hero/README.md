# Codrian — hero 3D (React + Vite + motion)

Seção hero/intro com "3D" feito só com CSS (`perspective`, `rotateX/Y`, `translateZ`).
Nenhum three.js. Só `transform` e `opacity` são animados.

## Rodar

```bash
npm install
npm run dev
```

| URL                | O que é                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `/`                | Hero do site: a cena de 15s ligada ao scroll (500vh, sticky)      |
| `/?record`         | Modo Reels 1080x1920, toca os 15s em loop (clique/espaço reinicia) |
| `/?record&frames`  | Cena parada, controlada por `window.__seek(seg)` (usado no export) |

## Exportar o vídeo para Reels (MP4 1080x1920, 30fps)

Precisa de `ffmpeg` no PATH e do Playwright (`npm i -D playwright && npx playwright install chromium`).

```bash
npm run dev            # num terminal
npm run record         # noutro -> out/codrian-reels-1080x1920.mp4
```

O export é quadro a quadro (determinístico), então não perde frame como uma gravação de tela.
Leva ~2–4 min. Para gravar a tela manualmente, abra `/?record` numa janela exatamente 1080x1920
(DevTools → dispositivo customizado).

## Roteiro (15s)

| Tempo   | O que acontece                                                                 |
| ------- | ------------------------------------------------------------------------------ |
| 0–2s    | Gancho: celular escuro flutuando, linha de luz atravessa e acende a tela, câmera empurra |
| 2–6s    | As camadas do site se separam em profundidade (hero, cards com foto, WhatsApp) com etiquetas |
| 6–10s   | Câmera gira para o outro lado, camadas abrem em leque; "Rápido. Bonito. Vendendo." |
| 10–13s  | Camadas voltam para a tela, botão pulsa, chega notificação de pedido no WhatsApp |
| 13–15s  | Celular recua; marca `codrian`, "Sites que vendem." e CTA                      |

## Onde mexer

- `src/hero/content.js`: todos os textos, nome da marca, site de exemplo. **Fotos**: coloque
  arquivos em `public/fotos/` e preencha `photo: "/fotos/cappuccino.jpg"` nos cards.
  Os placeholders atuais são desenhados em CSS.
- `src/hero/Scene.jsx`: câmera, rotação, legendas (marcos em segundos via `useTL`).
- `src/hero/Phone.jsx`: aparelho e camadas (`depth` = quanto cada camada sai em Z).
- `src/hero/hero.css`: cores (`--accent`), tipografia e layout.
- Usar em outra página: `import CodrianHero from "./hero/CodrianHero.jsx"`.

## Notas técnicas

- A cena é desenhada num palco fixo (1080x1920 no celular / 1920x1080 no desktop) e escalada
  para caber na tela, então o vídeo e o site usam o mesmo layout.
- Elementos com `transform-style: preserve-3d` nunca recebem `opacity` ou `overflow: hidden`
  (isso achataria o 3D); a opacidade só é aplicada nas "folhas".
- Respeita `prefers-reduced-motion`: mostra um quadro estático e não prende o scroll.
- As legendas no modo 9:16 ficam no topo (área segura do Reels); a parte de baixo
  fica livre para a interface do Instagram.
