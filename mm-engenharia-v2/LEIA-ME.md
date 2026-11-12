# MM Engenharia: landing page v2 ("a casa que sobe enquanto você rola")

HTML + CSS + JS puro, sem build e sem bibliotecas. Suba a pasta em qualquer hospedagem.

## O que é exclusivo desta versão
- **Hero**: o próprio símbolo isométrico da marca se monta peça por peça sobre linhas de projeto; o mouse separa as camadas ("Separar camadas" no toque). Ao lado, estimativa em 5 segundos (área → meses e relatórios), ligada ao simulador.
- **"Sua semana"**: a mesma semana, sem gestão × com a MM (as ligações somem, sobra 1 reunião).
- **A obra (rolagem), em primeira pessoa**: a página trava e você vê a obra do nível dos olhos (1,65 m), na calçada em frente ao terreno, em perspectiva real. A câmera se aproxima conforme se rola; a casa nasce como projeto tracejado, sobe por etapa e acende na entrega. Tapume com a placa da MM, cones, operários, caçamba e pilha de areia somem perto da entrega. Semana, etapa, trilho e relatório nº acompanham.
- **Simulador** (casa isométrica, vista de cima): área e padrão mudam a casa (1 a 3 pavimentos), o cronograma e a mensagem de WhatsApp. Play e arrastar de semanas.
- **Casas modelo: um layout novo a cada 100 m²**, crescendo para os lados e não só para cima.
  - *Padrão alto:* térrea com garagem (100–199) → sobrado de vidro (200) → ala lateral com terraço e pérgola (300) → em L com pátio (400) → volume recuado + ala (500) → em U com pátio e piscina (600) → em U com 3º nível, coberturas verdes e gazebo (700+).
  - *Altíssimo padrão (marcar "Altíssimo" no simulador):* pavilhão com teto-jardim (100) → volume suspenso em balanço (200) → + pavilhão lateral (300) → + segundo pavilhão, em H (400) → pátio com piscina de borda infinita (500) → caixas suspensas sobre os pavilhões (600) → + pavilhão de hóspedes e monólito (700+).
  - Detalhes: porta com marquise, garagem, painéis solares, claraboia, brise de madeira, muro de pedra, gramado, cercas-vivas, espreguiçadeiras, luminárias que acendem na entrega.
  - Pin "chave entregue" na porta de entrada de cada casa.
- **Relatório no celular**: gráfico de avanço previsto × realizado por etapa, com aprovação de compra clicável (dados fictícios, rotulados).
- **Qual formato é o seu?**: escolha o momento e o plano indicado é destacado e vai na mensagem do WhatsApp.
- Extras: preloader, cursor, botões magnéticos, crachá 3D, navegação por capítulos, relógio de Campo Grande, FAQ animado.
- Acessibilidade: `prefers-reduced-motion`, foco visível, `aria-live`, conteúdo legível sem JS.

## Antes de publicar
1. `GTM_ID` e `LINKEDIN_PARTNER_ID` no início do `<script>` (só carregam após aceite de cookies, LGPD).
2. Trocar `https://mmengenharia.com/` (canonical, Open Graph, JSON-LD) pelo domínio real.
3. E-mail: rodapé usa `mjmuller.eng@gmail.com`; o mockup do tapume usa `contato@mmengenharia.com`. Definir qual fica.
4. Fontes (Inter, Space Grotesk, JetBrains Mono) vêm do Google Fonts; hospede localmente para performance máxima.
5. **Foto do Mateus**: não existe no pacote. O crachá é um substituto; uma foto real vale mais que qualquer efeito.
6. **Obras reais**: só o tapume (`placa-obra`) permanece como imagem de mockup. Troque por fotos de obras assim que houver.
7. Os números do relatório do celular são fictícios e estão rotulados como "exemplo ilustrativo".

## dataLayer
`cta_click`, `simulator_used`, `generate_lead` (como antes) + `week_toggle`, `story_start`, `story_complete`, `sim_play`, `report_scrub`, `report_approve`, `plan_selected`.
