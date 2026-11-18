# Power Apps – Relatório de Agência

Canvas app com 3 telas: **Dados → Fotos → Assinatura**.

| Tela | Conteúdo |
|---|---|
| `scrDados` | Agência (2–36, sem a 28) e responsável pelo relatório, buscado no Office 365 Users |
| `scrFotos` | Lista de fotos montada a partir de `FotosDefinicao` (App.Formulas), com indicação das obrigatórias |
| `scrAssinatura` | Nome de quem assina + Pen input para a assinatura + Finalizar |

## Como montar
1. Crie um Canvas app em branco (formato **Telefone**/Tablet).
2. **Dados > Adicionar dados > Office 365 Users**.
3. Ative em Configurações: *Fórmulas nomeadas* (se ainda não estiver ativo).
4. Cole `Formulas` e `OnStart` de `App.pa.yaml` nas propriedades do objeto **App**.
5. Crie as telas `scrDados`, `scrFotos`, `scrAssinatura`. Para cada uma, copie os itens de `Children`
   e cole na árvore (Ctrl+V na tela) **ou** use *Exibir código* > colar.
6. Rode o `OnStart` (botão "..." no App > Executar OnStart).

### Se a colagem do YAML der erro de versão
As versões das controles (`Label@2.5.1`, `PenInput@2.0.1`, `AddMedia@2.2.1` etc.) não puderam ser
confirmadas na documentação. Se o Studio recusar, insira a controle manualmente, clique com o direito >
*Exibir código*, veja a versão correta e corrija o YAML. As **fórmulas** valem de qualquer forma:
dá para criar as controles na mão e só colar as propriedades.

## Definir as fotos
Edite apenas a tabela `FotosDefinicao` em App.Formulas (Ordem, Titulo, Obrigatoria). A galeria e a
validação se ajustam sozinhas.

## Pendente: onde salvar
O botão **Finalizar** só valida e limpa. Falta decidir o destino:
- **SharePoint list**: o `Patch` do Power Apps não grava em colunas de imagem nem anexos de forma simples
  → use um fluxo do Power Automate (exemplo comentado no `OnSelect`) para salvar fotos/assinatura em
  uma biblioteca e/ou gerar PDF.
- **Dataverse**: aceita `Patch` direto em colunas Imagem/Arquivo, mas exige licença Premium.
