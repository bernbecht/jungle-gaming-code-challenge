# Especificação de interface

Status: **15 screenshots analisadas em 06/10/2026; shell inicial escrito na TASK-02, ainda não validado no browser**. Referências locais abaixo. O arquivo Figma não foi inspecionado diretamente; fontes, tokens originais, camadas e interações não foram confirmados. TASK-01 concluída como análise; decisões de implementação aceitas em DEC-16, DEC-17 e DEC-18. A análise distingue observação do PNG, medição raster e proposta de implementação.

Rotas abaixo são propostas, não URLs impostas pelo desafio. Regras técnicas em [ARCHITECTURE](../ARCHITECTURE.md); testes em [TEST-MATRIX](TEST-MATRIX.md).

| ID | Tela / rota | Conteúdo e comportamento obrigatório | Estados especiais | Requisitos |
| --- | --- | --- | --- | --- |
| UI-01 | Início `/` | Destaques, catálogo, busca, filtros combináveis, ordenação, paginação e link ao detalhe; estado na URL | Skeleton, vazio, erro/retry, atualização em background | REQ-005, REQ-006, REQ-026 |
| UI-02 | Detalhe `/nfts/$nftId` | Galeria, informações, edição, quantidade, favorito e compra | 404, edição esgotada, limite, mutation/rollback | REQ-007, REQ-008 |
| UI-03 | Carrinho `/cart` | Quantidades, remoção, aplicar/remover cupom, subtotal/desconto/taxa/total da API | Vazio, skeleton do resumo, preço/estoque alterado, cupom inválido/expirado | REQ-009, REQ-010, REQ-011, REQ-013 |
| UI-04 | Pagamento `/checkout` (privado) | Dados do colecionador, carteira/rede, conexão simulada, revisão explícita e envio | Sessão expirada, conexão recusada/perdida, cotação alterada, envio/recuperação | REQ-014, REQ-015, REQ-016, REQ-022 |
| UI-05 | Pedido `/orders/$orderId` (privado) | Pending/declined/confirmed; recibo com snapshot somente em confirmed | Refresh, reconexão, 403/404, identificação clara de simulação | REQ-017, REQ-018, REQ-020 |
| UI-06 | Login `/login?returnTo=…` | Email/senha, validação, autenticação, retorno interno validado | Credenciais inválidas, API indisponível, sessão recuperando | REQ-021, REQ-022 |
| UI-07 | Cadastro `/register` | Campos do layout, validação, criação e caminho para login | Email duplicado, erros por campo/API | REQ-021, REQ-024 |
| UI-08 | Perfil `/profile` (privado) | Dados, avatar e alteração de senha | Upload inválido, senha inválida, erro de API, confirmação/persistência | REQ-024 |
| UI-09 | Carteiras `/wallets` (privado) | Cadastro/edição principal e secundária, rede e endereço | Endereço/rede inválidos, conflito, confirmação/persistência | REQ-014, REQ-024 |
| UI-10 | Shell e rota não encontrada | Navegação desktop/mobile, sessão/logout, retorno para início | Foco, drawer, rota inexistente e links auxiliares honestos | REQ-004, REQ-026, REQ-039 |

## Referências e método

Foram examinadas todas as nove telas desktop e seis mobile. Dimensões abaixo foram lidas dos arquivos; não se assume que altura do PNG seja altura de viewport. Desktop inclui páginas longas; mobile mostra um frame de 414 × 896, sem comprovar o conteúdo abaixo da dobra.

| Tela | Variante | Screenshot | Dimensão raster (px) |
| --- | --- | --- | --- |
| UI-07 | Desktop | [Cadastro](../design/screenshots/Desktop/Cadastro.png) | 1440 × 1981 |
| UI-03 | Desktop | [Carrinho de NFTs](../design/screenshots/Desktop/Carrinho%20de%20NFTs.png) | 1440 × 1754 |
| UI-09 | Desktop | [Carteiras](../design/screenshots/Desktop/Carteiras.png) | 1440 × 1080 |
| UI-05 | Desktop | [Confirmação de Pedido](../design/screenshots/Desktop/Confirmac%CC%A7a%CC%83o%20de%20Pedido.png) | 1440 × 1657 |
| UI-02 | Desktop | [Detalhes do NFT](../design/screenshots/Desktop/Detalhes%20do%20NFT.png) | 1440 × 2246 |
| UI-01 | Desktop | [Início](../design/screenshots/Desktop/Ini%CC%81cio.png) | 1440 × 3668 |
| UI-06 | Desktop | [Login](../design/screenshots/Desktop/Login.png) | 1440 × 1981 |
| UI-04 | Desktop | [Pagamento](../design/screenshots/Desktop/Pagamento.png) | 1440 × 1657 |
| UI-08 | Desktop | [Perfil do Colecionador](../design/screenshots/Desktop/Perfil%20do%20Colecionador.png) | 1440 × 1080 |
| UI-07 | Mobile | [Cadastro](../design/screenshots/Mobile/Cadastro.png) | 414 × 896 |
| UI-03 | Mobile | [Carrinho de NFTs](../design/screenshots/Mobile/Carrinho%20de%20NFTs.png) | 414 × 896 |
| UI-02 | Mobile | [Detalhes do NFT](../design/screenshots/Mobile/Detalhes%20do%20NFT.png) | 414 × 896 |
| UI-01 | Mobile | [Início](../design/screenshots/Mobile/Ini%CC%81cio.png) | 414 × 896 |
| UI-06 | Mobile | [Login](../design/screenshots/Mobile/Login.png) | 414 × 896 |
| UI-04 | Mobile | [Pagamento](../design/screenshots/Mobile/Pagamento.png) | 414 × 896 |

Não há screenshots mobile de confirmação, perfil ou carteiras, nem referências de tablet. REQ-004 e REQ-037 continuam exigindo essas adaptações. Validar também 414 px para comparação direta com os PNGs, além dos 390/768/1440 exigidos. Cantos externos arredondados nos PNGs mobile parecem moldura do frame; não aplicar recorte arredondado ao documento inteiro nem limitar a página a 896 px.

## Identidade visual e medidas

**Observado:** marca KURIO, interface escura em marrons quentes, ação em cobre/laranja, textos claros, tipografia de aparência monoespaçada em títulos e corpo. Artes de primatas ocupam grande parte da identidade. Bordas discretas e ícones lineares; desktop mais retangular, mobile com superfícies e botões muito mais arredondados.

Amostragem dos pixels opacos de Carteiras desktop e Login mobile encontrou as cores abaixo. São valores dos PNGs, não tokens oficiais exportados do Figma; a associação de cada cor a uma função é inferida visualmente. Antialiasing e gradientes produzem cores adicionais.

| Token de implementação proposto | Cor medida | Uso observado/inferido |
| --- | --- | --- |
| background | `#140D0A` | Fundo principal |
| surface | `#241612` | Painéis, sidebar e cards |
| border | `#3F2319` | Contornos de campos/superfícies |
| primary | `#D28A4C` | Botões e indicadores ativos |
| foreground | `#F5F1EB` | Texto claro |
| muted-foreground | `#CFB28C` | Texto secundário, observado no login mobile |
| accent | `#E89B55` | Destaques, observado na tela de carteiras |

**Estimativas geométricas para começar, a validar no browser:** container desktop de aproximadamente 1200 px com margens de 120 px em 1440; sidebar de conta/catálogo perto de 310 px; gutter de 24–32 px; margem mobile de 24–28 px. Inputs desktop em torno de 40 px, mobile em torno de 50 px; CTAs mobile próximos de 60 px. Texto de corpo por volta de 14–16 px, títulos de seção 18–22 px. Não tratar essas estimativas como medições do Figma.

Família/pesos originais permanecem desconhecidos. Por DEC-16, foi selecionada IBM Plex Mono via Fontsource, pesos 400/500/600/700, durante TASK-02; instalação concluída e comparação no browser ainda pendente; não aguardar informação do Figma. Não afirmar que é uma família específica. Verificar contraste real dos pares de tokens e estados no browser em TEST-14.

## Análise por tela

### UI-01 — Início

Desktop: header com logo à esquerda, navegação central (Início, Mercado, Criadores, Aprenda), busca/carrinho/Entrar à direita. Hero em duas colunas, texto e CTA Explorar à esquerda, arte grande à direita e indicadores. Catálogo com sidebar, três colunas e três linhas visíveis, abas Todos os NFTs/Novos lançamentos/Em alta, ordenação e paginação. Filtros visíveis: categorias sob o título Coleções, faixa de preço com Aplicar e Rede (Ethereum, Polygon, Solana). Abaixo: dois banners, quatro cards editoriais e footer amplo em faixas.

Mobile: busca explícita e botão de filtros no topo; hero compacto com duas artes sobrepostas, título diferente e fundo decorativo. Abas horizontais; catálogo de duas colunas com deslocamento vertical aparente entre elas. Há favorito sobre imagem e badge RARO. Barra inferior com início, favorito, ação central circular, carrinho e perfil. O significado da ação central não pode ser inferido com segurança; não atribuir compra/scan real sem definição.

Proposta: filtro em drawer no mobile e busca expansível no desktop. Não deduzir carrossel automático apenas pelos indicadores. Escolher grade de duas colunas com deslocamento decorativo controlado, preservando ordem de leitura, antes de introduzir masonry. A barra inferior exige espaço de respiro no conteúdo e safe-area. Abas, rede e ordenação precisam integrar URL/API; os contratos iniciais ainda não representam todos esses controles.

### UI-02 — Detalhe

Desktop: quatro miniaturas à esquerda, arte principal, informações à direita; preço/rating, descrição, chips de edição (1/1, 1/10, 1/50, ABERTA), quantidade, Comprar e Favoritar. Metadados: ID do token, coleção e atributos; ações de compartilhar. Abaixo, tabs de detalhes/avaliações, texto técnico, cinco recomendações e footer.

Mobile: voltar/favorito no topo, imagem grande, painel de informações sobreposto visualmente à base da imagem e bloco inferior de quantidade/preço/Comprar NFT/carrinho. Rating aparece como cápsula. Não há evidência de miniaturas, tabs ou recomendações no trecho visível; não concluir que foram removidas do fluxo completo.

Proposta: compra abre/adiciona ao fluxo de carrinho sem confirmar pedido; botão de carrinho mantém acesso explícito. Galeria permanece acessível via controles no mobile. Barra de compra pode ser sticky após validar scroll/teclado; o PNG sozinho não prova posicionamento fixo. Informações de rede/contrato são dados simulados, não comprovação de blockchain.

### UI-03 — Carrinho

Desktop: tabela de itens à esquerda, resumo à direita, cupom, taxa estimada, total e Conectar e finalizar. Quantidade é rotulada Edições no cabeçalho; cada linha tem imagem, nome/token, preço unitário, stepper, total e lixeira. Recomendações/footer abaixo.

Mobile: cards empilhados com thumbnail à esquerda e stepper à direita; resumo em painel arredondado, cupom integrado a Aplicar e CTA largo. O frame usa quatro itens diferentes do desktop. Não fixar quantidade de cards nem altura do resumo. Remoção deve estar acessível em todas as linhas, mesmo onde o PNG não exibe lixeira.

Os totais ilustrados são consistentes: desktop `2.38 + 8.34 + 16.11 = 26.83`, total `26.846` com taxa `0.016`; mobile `1.19 + 1.39 + 3.58 + 1.98 = 8.92`, total `8.936`. Esses valores são referência visual, não fixtures obrigatórias nem valores hardcoded.

### UI-04 — Pagamento

Desktop: formulário de duas colunas ocupa a esquerda; itens, cupom, totais, opções de carteira e Confirmar compra à direita. Campos visíveis relacionados na seção de formulários. Há checkbox Usar outra carteira e observação opcional.

Mobile: título Pagamento com carteira; seleção entre Reserva/Principal com endereço/rede; ação Trocar carteira; provedores WalletConnect, MetaMask e Coinbase Wallet; total e CTA no rodapé. **Dados do colecionador e revisão detalhada dos itens não aparecem neste frame.** REQ-014/REQ-015 continuam obrigatórios: propor etapas Dados → Carteira/rede → Revisão, mantendo a composição mostrada na etapa correspondente. Não esconder campos obrigatórios apenas para coincidir com a captura.

Carteira cadastrada e provedor de conexão são conceitos distintos: selecionar uma carteira existente, validar sua rede e simular conexão com o provedor; nada de extensão real. CTA precisa representar revisão/envio/pending/recuperação sem saltar para sucesso.

### UI-05 — Confirmação

Desktop: painel estreito central, ícone de agradecimento, fechar, mensagem de sucesso, faixa com transação/data/total/carteira, linhas dos itens, taxa/total e botão Ver no Etherscan. Borda cobre espessa no rodapé. Não há screenshot mobile.

Proposta: manter rota direta de pedido com painel de recibo; em mobile, empilhar os metadados e linhas sem comprimir uma tabela de quatro colunas. Só renderizar este estado em confirmed. Substituir alegação literal de transferência na blockchain por indicação inequívoca de simulação, preservando hierarquia; exploração simulada não aponta para hash real inexistente. Fechar leva a destino interno previsível, inclusive em acesso direto.

### UI-06 e UI-07 — Autenticação

Desktop: painéis sobre a home, alternância Entrar/Criar conta, fechar no canto, CTA cobre e borda inferior destacada. Email/senha no login; usuário/email/senha/confirmação no cadastro. A home de fundo tem imagens/labels diferentes da captura isolada de início, portanto não deve gerar um segundo catálogo independente.

Mobile: páginas próprias com logo KURIO no topo, título, inputs largos, CTA, separador e botões Google/Facebook; link para alternar login/cadastro ao final. Login inclui Esqueceu a senha.

Proposta: preservar rotas `/login` e `/register`; apresentação de diálogo com fundo de home/contexto no desktop e página no mobile, inclusive no acesso direto. Modal exige foco contido e retorno ao disparador. Placeholders não substituem labels acessíveis. OAuth e recuperação por email não estão exigidos como integrações: manter tratamento honesto de ação auxiliar indisponível na demo, sem fingir autenticação ou envio.

### UI-08 — Perfil

Desktop: sidebar de conta e formulário à direita. Perfil ativo com marcador cobre; dados em duas colunas, avatar com Alterar/Remover, seção de senha numa coluna e Salvar. Header mostra Entrar apesar de ser página privada: implementação deve refletir sessão real (desvio necessário), sem reproduzir esse estado inconsistente.

Mobile proposto: navegação de conta compacta, campos empilhados, avatar e ações acessíveis, grupo de senha separado. Não usar a sidebar desktop com largura fixa de 310 px em uma tela de 390 px.

### UI-09 — Carteiras

Desktop: mesma sidebar, seção principal com Adicionar, formulário em duas colunas, Salvar carteira e seção secundária com Adicionar e Igual carteira principal. Campos extrapolam address/network/label do contrato inicial. O significado de Igual carteira principal precisa de decisão: proposta é copiar dados para edição, sem associar identidades de forma implícita nem criar cadastro duplicado silenciosamente.

Mobile proposto: cards de principal/secundária e formulário empilhado; manter cadastro/edição completos. Não há evidência visual para aceitar dados obrigatórios fictícios como código de indicação ou ENS: definir regra explícita antes de implementar validação.

## Formulários e impactos nos contratos

Asteriscos são observados no PNG; regras de negócio desses campos não são dedutíveis de uma imagem. Abaixo, `*` reproduz a indicação visual, não uma nova exigência inventada.

| UI | Campos observados | Impacto a resolver |
| --- | --- | --- |
| UI-06 | Email, senha, mostrar/ocultar senha | API-02 já cobre credenciais; label acessível e retorno modal precisam ser implementados |
| UI-07 | Nome de usuário, email, senha, confirmar senha | API-01 possui `name`, mas não distingue username/displayName; definir essa separação |
| UI-08 | Nome de exibição*, nome de usuário*, email*, nome ENS* (sufixo .eth + valor), apelido da carteira*, avatar Alterar/Remover; senha atual/nova/confirmação | API-10 precisa ampliar perfil e prever remoção de avatar; confirmar senha permanece validação cliente; grupo de senha só obrigatório quando alteração solicitada |
| UI-09 | Nome de exibição*, apelido da carteira*, rede*, nome do perfil*, endereço*, ENS ou carteira secundária opcional, tipo de carteira*, código de indicação*, email*, nome ENS*; principal/secundária | API-11 precisa separar slot, nickname, tipo/provedor e metadados; definir semântica/obrigatoriedade de ENS e indicação; não inventar formato a partir do PNG |
| UI-04 | Nome de exibição*, nome de usuário*, rede*, nome do perfil*, endereço*, ENS/carteira secundária opcional, tipo*, código de indicação*, email*, nome ENS* (somente sufixo visível), Usar outra carteira, observação opcional | Collector de API-09 está incompleto; derivar dados da conta/carteira e persistir snapshot; mobile deve permitir preencher/revisar dados ausentes |

O campo ENS do checkout mostra apenas seletor `.eth`, enquanto perfil/carteiras mostram também entrada de texto. Tratar como lacuna de composição: propor entrada completa consistente e registrar ajuste. Não congelar os schemas v0 antes de fechar estas decisões em TASK-04/TASK-09.

## Componentes compartilhados propostos

- Shell desktop, header mobile por fluxo, barra inferior e navegação de conta.
- NFTCard com variantes catálogo/recomendação; NFTGallery; badges e selector de edição.
- QuantityStepper e linha de item com variantes carrinho/resumo/recibo.
- Money, CouponForm e OrderSummary reutilizados com valores vindos da API.
- FormField, PasswordField, NetworkSelect, WalletSelector e AvatarField.
- AuthDialog/AuthPage com mesmo formulário; StatusPanel para pending/declined/confirmed.
- Skeletons com proporções de cada variante, feedback de erro e avisos de atualização.
- Footer em faixas e blocos promocionais/editoriais da home; não criar páginas editoriais fora do escopo.

Reutilizar comportamento, mantendo diferenças de composição desktop/mobile. Um único layout desktop reduzido não reproduz os PNGs.

## Lacunas, inconsistências e decisões antes de codificar

1. **Assets:** só há screenshots. Foram vistos quatro motivos principais de arte (verde/óculos, lilás/chapéu, escuro/blazer e dourado/fones), repetidos em múltiplos NFTs; ainda não há arquivos individuais. Por DEC-17, usar placeholders locais temporários, sem depender de extração dos PNGs. Manter proporções e identidade por NFT; revisar substituições em TASK-12. Não usar screenshot inteiro como página.
2. **Dados ilustrativos:** Violet Nomad e Ivory Baron têm IDs de token diferentes entre carrinho e recibo; imagens associadas aos títulos mudam em algumas telas; badge de carrinho não corresponde necessariamente à soma. Definir fixture única e coerente, priorizando REQ-030 sobre copiar inconsistências.
3. **Catálogo/API:** faltam rede, abas Novos/Em alta, ordenação Listados recentemente, atributos/token/rating e possível preço anterior no modelo proposto. Mapear DTO e semântica antes dos handlers. Facetas/contagens devem refletir a fixture, não números fixos do PNG.
4. **Formulários:** separar username/displayName/profileName e decidir se referências de carteira no perfil são metadados ou relação com carteira principal. Evitar duas fontes divergentes para o mesmo dado.
5. **Estados:** não há imagens de loading, vazio, erro, foco, drawers abertos, pending/declined ou cotação alterada. Criá-los com os mesmos tokens e requisitos, sem presumir que estão dispensados.
6. **Responsividade:** 768 px e mobile de três telas precisam de projeto; telas de 414 não substituem validação a 390. Comportamento sticky, scroll, teclados e mudanças de orientação precisam ser verificados no browser.
7. **Acessibilidade:** aumentar área acionável de controles pequenos sem depender da dimensão do ícone; labels, foco, contraste e avisos devem ser aferidos em TEST-11/TEST-14. Nenhuma conformidade foi comprovada só pela inspeção dos PNGs.
8. **Escopo auxiliar:** visual inclui Google/Facebook, newsletter, avaliações, compartilhamento, links editoriais/suporte e ação central mobile sem significado claro. Manter composição e comportamento coerente sem acrescentar integrações reais nem falso sucesso.

## Diretrizes aceitas para referências ausentes — DEC-18

Estas são escolhas de projeto, não informações extraídas do Figma:

- Tablet (768 px): navegação compacta, filtros em drawer e catálogo em duas colunas; empilhar detalhe e resumo quando a largura comprometer leitura. Usar duas colunas de formulário somente quando os campos couberem sem truncamento.
- Perfil mobile: navegação de conta compacta; campos em uma coluna; avatar com Alterar/Remover; grupo de senha separado e ação Salvar acessível.
- Carteiras mobile: cards principal/secundária, edição em formulário de uma coluna e seleção de rede/provedor com labels completos.
- Confirmação mobile: painel de recibo com metadados empilhados, itens em linhas flexíveis e totais legíveis; sem tabela rígida de quatro colunas.
- Preservar erros, loading, revisão de compra, foco, teclado e conteúdo completo em todos os tamanhos. Validar em 390/768/1440, além de comparar com referências de 414 px.

TASK-05/TASK-08/TASK-09 implementam as composições; TASK-12 ajusta após uso real e TEST-14 registra evidências. Fonte e placeholders seguem DEC-16/DEC-17, com seleção/preparo durante a implementação.

## Ordem de implementação visual

Primeiro tokens/shell e variantes de campos/botões; depois NFTCard/galeria, linhas de item e resumo; em seguida formulários/seleção de carteiras e autenticação modal/página. Implementar pares desktop/mobile de cada fluxo juntos. TEST-13 cobre regressão das quatro telas exigidas; TEST-14 verifica todas as telas, inclusive rotas não capturadas no mobile.

## Regras transversais de interação

- Loading inicial: skeleton com shimmer em catálogo, detalhe e resumo; manter proporções. `prefers-reduced-motion` elimina animação, preservando o estado de loading.
- Atualização em background: manter conteúdo utilizável; indicar operação sem deslocar layout. Desabilitar apenas ações que dependem de dados válidos.
- Erro: mensagem acionável, tentativa novamente onde seguro; campo com `aria-invalid` e mensagem associada. Foco no primeiro erro após submit.
- Diálogos/drawers: foco inicial coerente, contenção de foco, Escape quando apropriado e retorno ao disparador. Elementos interativos com foco visível.
- Feedback: status acessível para favorito, carrinho e eventos; não depender só de cor. Evitar anúncios repetidos para eventos duplicados.
- Imagens relevantes com alt; decorativas sem ruído. Usar semântica de títulos, links, botões e formulários.
- Verificar teclado, zoom 200%, ausência de scroll horizontal indevido e acesso integral a conteúdo/ações nas três larguras.
- Ação fora de escopo não mostra sucesso funcional. Referência de transação e link de exploração são explicitamente simulados; não apontar hash inventado como transação real.

## Critério de aprovação visual

TEST-13 compara baselines estáveis; TEST-14 faz revisão humana contra o Figma. Screenshot aprovado apenas por coincidir com baseline não prova fidelidade ao layout. Registrar frame, viewport, screenshot e desvios restantes em TEST-MATRIX.

## Implementação inicial de tokens/assets — TASK-02

CSS em `src/styles.css`, shell em `src/components/layout/app-shell.tsx`. Quatro SVGs placeholders estão disponíveis em `public/assets/placeholders/`, conforme DEC-17. Fonte escolhida: IBM Plex Mono via Fontsource (DEC-16), instalada e incluída no build. Inventário em [ASSETS](ASSETS.md). Ainda não houve screenshot da aplicação nem validação de fidelidade/responsividade; as composições finais seguem TASK-05/TASK-09/TASK-12.

## Revisões de UI durante a TASK-05

- Item 1: faixa de preço com dois controles na mesma trilha, leitura ETH e botão Aplicar, conforme referência desktop. Validação visual pendente.
- Item 2: removida a barra permanente inserida no catálogo. Busca acessível pela lupa do header, abrindo diálogo; comportamento aberto proposto, sem frame correspondente. Disponível em desktop/mobile, preservando REQ-005/REQ-006. Validação visual pendente.
- Item 3: sidebar/drawer com apenas Coleções → Faixa de preço → Rede. Coleções usa as categorias da fixture (Arte digital, Fotografia, Generativa), seguindo a semântica dos itens da screenshot. Removidos grupos adicionais Categorias/Criadores e controle Somente disponíveis. Limpar filtros permanece como ação auxiliar quando há seleção. Validação visual pendente.
- Item 4: Ordenar por com rótulo/seleção em texto discreto, fundo transparente, sem borda e seta pequena. Mantido select nativo, foco visível ao teclado e opções existentes. Validação visual pendente.
- Item 5: sidebar dentro de card retangular com fundo `#241612` (`bg-card`), padding de 16 px e altura do próprio conteúdo, conforme referência desktop. Validação visual pendente.
