# MM Engenharia: landing page v2 ("a casa que sobe enquanto você rola")

HTML + CSS + JS puro, sem build e sem bibliotecas. Suba a pasta em qualquer hospedagem.

## O que é exclusivo desta versão
- **Casa isométrica gerada no código**, a partir da geometria do símbolo da marca. Nasce como projeto (linhas tracejadas), sobe por etapa e acende as luzes na entrega.
- **Hero**: time-lapse de 56 semanas em 5 s; o mouse separa as camadas da casa (botão "Separar camadas" para touch).
- **"Sua semana"**: a mesma semana, sem gestão × com a MM (as ligações somem, sobra 1 reunião).
- **A obra (scroll)**: a página pina e a rolagem constrói a casa; semana, etapa, trilho e relatório nº acompanham.
- **Simulador**: área e padrão mudam a casa (1 a 3 pavimentos), o cronograma e a mensagem de WhatsApp. Play/scrub de semanas.
- **Relatório no celular**: tela ilustrativa por semana, com aprovação de compra clicável.
- **Qual formato é o seu?**: escolha o momento e o plano indicado é destacado e vai na mensagem do WhatsApp.
- Extras: preloader com o símbolo, cursor, botões magnéticos, crachá 3D do engenheiro, barra de progresso, navegação por capítulos, relógio de Campo Grande, FAQ animado.
- Acessibilidade: `prefers-reduced-motion` (casa já pronta, sem animações), foco visível, `aria-live`, sem JS o conteúdo continua legível.

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
