# MM Engenharia: landing page v2 ("a casa que sobe enquanto você rola")

HTML + CSS + JS puro, sem build e sem bibliotecas. Suba a pasta em qualquer hospedagem.

## O que é exclusivo desta versão
- **Hero**: o próprio símbolo isométrico da marca se monta peça por peça sobre linhas de projeto; o mouse separa as camadas ("Separar camadas" no toque). Ao lado, estimativa em 5 segundos (área → meses e relatórios), ligada ao simulador.
- **"Sua semana"**: a mesma semana, sem gestão × com a MM (as ligações somem, sobra 1 reunião).
- **A obra (rolagem)**: a página trava e a rolagem constrói a casa (1º telão com a casa modelo); semana, etapa, trilho e relatório nº acompanham.
- **Simulador** (2º e último telão com a casa): área e padrão mudam a casa (1 a 3 pavimentos), o cronograma e a mensagem de WhatsApp. Play e arrastar de semanas.
- **Casa modelo, padrão alto**: térreo com vãos e madeira, pavimentos superiores em pele de vidro, lajes em balanço, deque, piscina. Acima de ~480 m² vira volume recuado com terraço, deque, pérgola e guarda-corpo de vidro.
- **Casa modelo, altíssimo padrão** (layout próprio): casa-pátio com torre de madeira, volume suspenso em balanço, pavilhão com cobertura flutuante e teto-jardim, piscina de borda infinita. Ao marcar "Altíssimo" no simulador, a casa da rolagem também muda.
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
