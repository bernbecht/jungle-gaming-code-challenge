# Decisões de produto e experiência de uso — nota ao avaliador

**Autor:** Bernardo Bechtold · **Data:** 08/10/2026

Durante o desenvolvimento, usei o protótipo como referência visual e o enunciado como referência de comportamento. Ao transformar as telas em uma aplicação funcional, encontrei situações que exigiam decisões sobre clareza, consistência, recuperação de erros e regras do domínio. Este documento explica as principais escolhas, suas motivações e as evidências disponíveis no repositório.

Minha intenção foi demonstrar a capacidade de avaliar a experiência completa: o que acontece antes e depois de um clique, como a interface comunica seu estado e como o usuário retoma uma operação. As diferenças descritas abaixo têm consequências visuais e funcionais; apresento essas consequências para que possam ser consideradas na avaliação.

## Como interpretar as evidências

A análise considera o código da árvore de trabalho nesta data, inclusive alterações ainda não commitadas. As referências visuais são as [screenshots locais](../design/screenshots/) e a análise em [UI-SPEC](UI-SPEC.md); o arquivo editável do Figma não foi inspecionado nesta revisão. As motivações explícitas vêm de [ARCHITECTURE](../ARCHITECTURE.md) e [TASKS](../TASKS.md). Quando um benefício é uma interpretação da implementação, ele é apresentado como intenção ou efeito esperado.

Há três tipos de escolha: diferenças deliberadas em relação ao desenho; adaptações que ajudam a cumprir o enunciado; e substituições temporárias que limitam a fidelidade. A existência de código e testes comprova a implementação e a cobertura prevista, mas não comprova, por si só, uma melhoria medida de usabilidade. Não foram realizadas pesquisas com usuários ou medições comparativas para este documento.

## 1. Carrinho e compra organizados por rede

**Referência e mudança.** O carrinho do protótipo apresenta um resumo único. No pagamento mobile, a referência mostra carteiras Ethereum e Polygon na mesma seleção. Implementei grupos por rede no carrinho, com uma ação de finalização para cada grupo. O checkout recebe essa rede e apresenta carteiras compatíveis; a cotação e o pedido incluem apenas os itens daquele grupo.

**Motivação registrada — DEC-24.** Uma compra pertence a uma só rede na simulação. A escolha evita representar uma transação atômica entre blockchains e impede combinações incompatíveis entre os NFTs e a carteira utilizada.

**Experiência e consequência.** O usuário entende qual conjunto está comprando e pode concluir um grupo sem perder os outros. Um carrinho com várias redes exige mais de uma finalização, e as taxas são calculadas por rede. Esta é uma regra adicional de produto, não uma exigência explícita do desafio. Ela também muda a seleção de rede: a rede é determinada pelos itens, em vez de ser um seletor independente.

**Evidências:** DEC-24 em [ARCHITECTURE](../ARCHITECTURE.md); `itemGroups` em [CartPage](../src/routes/cart-page.tsx); seleção e filtragem de carteiras em [CheckoutPage](../src/routes/checkout-page.tsx); `createQuote` e `submitOrder` em [commerce](../src/mocks/commerce.ts). O teste `mixed-network cart finalizes one network and preserves the other group` em [checkout.spec.ts](../tests/e2e/checkout.spec.ts) e o teste de cotação/liquidação multirrede em [marketplace.spec.ts](../tests/unit/marketplace.spec.ts) verificam esse comportamento.

## 2. Confirmação em uma rota recuperável

**Referência e mudança.** A screenshot desktop de confirmação apresenta um painel com um X de fechamento. Mantive o painel centralizado, mas o coloquei em `/orders/:orderId`, com ações explícitas de navegação. Edição e quantidade aparecem junto da identificação do NFT, em vez de uma coluna separada chamada “Edições”.

**Motivação registrada — DEC-28.** O pagamento é assíncrono. Uma URL identificável permite consultar o mesmo pedido após refresh ou acesso direto e representar pendência, confirmação e recusa no mesmo destino.

**Experiência e consequência.** O recibo deixa de depender de uma janela transitória. A apresentação diverge da referência com X, mas preserva a hierarquia do painel e oferece um endereço estável para a operação. A recuperação de todos os cenários avançados de timeout e reconexão ainda depende das tarefas previstas para isso.

**Evidências:** DEC-28 e UI-05 em [ARCHITECTURE](../ARCHITECTURE.md) e [UI-SPEC](UI-SPEC.md); rota em [router.ts](../src/app/router.ts); ramos `pending`, `declined` e recibo em [OrderPage](../src/routes/order-page.tsx). [checkout.spec.ts](../tests/e2e/checkout.spec.ts) verifica a navegação para o pedido e os resultados de confirmação e recusa.

## 3. Checkout mobile com dados, carteira e revisão

**Referência e mudança.** O frame mobile de pagamento mostra a escolha da carteira/provedor, o total e a confirmação. Acrescentei as etapas Dados → Carteira → Revisão, com retorno entre etapas e revisão dos itens antes do envio. “Revisar compra” prepara conexão/cotação; “Confirmar compra” envia o pedido.

**Motivação registrada.** UI-04 identifica que dados do colecionador e revisão detalhada não aparecem no frame. O enunciado exige validação dos campos e revisão antes da compra. As etapas completam o fluxo necessário em uma tela pequena.

**Experiência e consequência.** A intenção é reduzir a quantidade de informações simultâneas e distinguir preparação de envio. Existem passos adicionais em relação à captura. Pela DEC-26, o CTA das etapas Carteira e Revisão fica após o conteúdo, no fluxo do documento, para evitar sobreposição de dados e valores. Isso pode exigir rolagem até a ação.

**Evidências:** UI-04 em [UI-SPEC](UI-SPEC.md), DEC-26 em [ARCHITECTURE](../ARCHITECTURE.md) e TASK-08 em [TASKS](../TASKS.md); `CheckoutStep`, `reviewPanel` e botões em [CheckoutPage](../src/routes/checkout-page.tsx). [checkout.spec.ts](../tests/e2e/checkout.spec.ts) verifica as etapas, a posição `static` dos CTAs mobile e ausência de overflow nos tamanhos exercitados.

## 4. Remoção explícita e controles consistentes no carrinho mobile

**Referência e mudança.** O frame mobile não apresenta uma ação de remoção uniforme em todos os cards; há um ícone de lixeira sobre a região dos controles em um deles. Na aplicação, cada item tem uma ação com ícone e texto “Remover”, junto ao controle de quantidade, abaixo dos dados. O desktop conserva a lixeira compacta.

**Motivação registrada — DEC-21, DEC-22 e DEC-23.** A remoção precisa ser clara e estar disponível em todas as linhas. O stepper reutiliza a mesma variante de botão entre tamanhos de tela, e o cupom utiliza o `Input` compartilhado, para manter consistência e reduzir exceções de manutenção.

**Experiência e consequência.** O texto torna a ação menos dependente da interpretação do ícone. A posição e o estilo dos controles diferem do desenho mobile. A reutilização dos componentes sustenta consistência técnica, mas não substitui uma revisão das áreas de toque: não há comprovação de que todos os controles já tenham dimensões ideais.

**Evidências:** DEC-21 a DEC-23 em [ARCHITECTURE](../ARCHITECTURE.md), UI-03 em [UI-SPEC](UI-SPEC.md); botões `size="stepper"`, labels e remoção em [CartPage](../src/routes/cart-page.tsx). [cart.spec.ts](../tests/e2e/cart.spec.ts) verifica quantidade, remoção e presença do texto no mobile.

## 5. Dados da carteira preenchidos e somente para leitura

**Referência e mudança.** Campos do checkout como endereço, nome do perfil e tipo da carteira são derivados da carteira selecionada. Eles permanecem `readOnly`, com cadeado discreto e aparência distinta, sem repetir “Somente leitura” em todos os rótulos.

**Motivação registrada — DEC-25.** Preservar a possibilidade de selecionar/copiar valores e acessar campos por teclado, comunicando que a edição pertence ao cadastro da carteira.

**Experiência e consequência.** A intenção é evitar preenchimento redundante e divergências entre o formulário de compra e a carteira utilizada. Esses campos não são editados livremente no checkout; é preciso mudar a carteira ou seu cadastro.

**Evidências:** DEC-25 em [ARCHITECTURE](../ARCHITECTURE.md); `Field` e `formFields` em [CheckoutPage](../src/routes/checkout-page.tsx); cadeado em [FormField](../src/components/ui/form-field.tsx) e estilos `readOnly` em [Input](../src/components/ui/input.tsx). A implementação está presente; esta revisão não executou uma auditoria específica de cópia ou navegação por teclado desses campos.

## 6. ENS opcional em um campo completo

**Referência e mudança.** O perfil desktop marca “Nome ENS” com asterisco e apresenta um seletor `.eth` separado. A implementação usa um campo único, como `ana.eth`, e permite deixá-lo vazio. Se preenchido, o mock valida o formato terminado em `.eth`.

**Decisão registrada — DEC-19 e DEC-29.** ENS é opcional na demo, e não há consulta à blockchain para verificar registro ou propriedade. O campo informa isso ao usuário.

**Efeito esperado e consequência.** Um campo completo simplifica a entrada e permite usar o perfil sem um nome ENS. Esse benefício é uma interpretação da escolha, não um resultado medido. A opcionalidade diverge do asterisco do protótipo e merece atenção diante da exigência de validar os campos do layout; a justificativa não elimina essa diferença. O campo também fica restrito ao formato `.eth` nesta simulação.

**Evidências:** DEC-19/DEC-29 em [ARCHITECTURE](../ARCHITECTURE.md), formulários em [UI-SPEC](UI-SPEC.md); `EnsNameField` em [ProfilePage](../src/routes/profile-page.tsx); `updateProfile` em [auth.ts](../src/mocks/auth.ts). [profile.spec.ts](../tests/e2e/profile.spec.ts) verifica gravação e persistência de ENS após refresh.

## 7. Informações visuais sustentadas pelos dados

**Referência e mudança.** Removi o selo “RARO” dos cards mobile. As contagens dos filtros e os indicadores do carrinho usam dados da aplicação, em vez dos números ilustrativos das screenshots. No header desktop, uma sessão autenticada mostra o usuário e “Sair”, inclusive no perfil, cujo frame ainda mostra “Entrar”.

**Motivação registrada — DEC-20 e UI-08.** Não existe critério nem campo de domínio que sustente a classificação de raridade. O estado da sessão e as contagens devem corresponder ao funcionamento da aplicação.

**Experiência e consequência.** A interface evita atribuir uma classificação sem fundamento e comunica dados coerentes com a navegação. A remoção do selo altera a composição visual; se houver um critério editorial ou de domínio definido pelo avaliador, a decisão pode ser revista. Contagens e identidade diferentes das screenshots são esperadas com fixtures funcionais.

**Evidências:** DEC-20 em [ARCHITECTURE](../ARCHITECTURE.md), UI-01/UI-08 em [UI-SPEC](UI-SPEC.md); [cards](../src/features/catalog/components.tsx), [filtros](../src/features/catalog/filters.tsx), `catalogFacets` em [catalog.ts](../src/mocks/catalog.ts) e [AppShell](../src/components/layout/app-shell.tsx). [marketplace.spec.ts](../tests/unit/marketplace.spec.ts) verifica contagens de facetas; [cart.spec.ts](../tests/e2e/cart.spec.ts) verifica o contador mobile.

## 8. Ações e mensagens honestas sobre a simulação

**Referência e mudança.** A confirmação do protótipo afirma registro da transferência na Ethereum e oferece “Ver no Etherscan”. A aplicação informa que o pedido e a referência são simulados e mantém esse botão desabilitado. Recuperação de senha e login social explicam sua indisponibilidade. A ação central mobile permanece desabilitada porque seu significado não foi definido.

**Motivação registrada.** Blockchain e pagamentos reais estão fora do escopo. O enunciado também exige comportamento coerente para ações auxiliares, sem aparentar sucesso funcional quando indisponíveis.

**Experiência e consequência.** O usuário recebe uma explicação sobre o que ocorreu e sobre o que a demo permite fazer. Há diferenças de texto e ações desabilitadas em relação ao desenho. Esta escolha ajuda a cumprir o enunciado; não representa uma dispensa de implementar os fluxos obrigatórios.

**Evidências:** UI-01/UI-05/UI-06 em [UI-SPEC](UI-SPEC.md); aviso e botão em [OrderPage](../src/routes/order-page.tsx), mensagens em [AuthForm](../src/features/auth/auth-form.tsx) e ação central em [AppShell](../src/components/layout/app-shell.tsx). [checkout.spec.ts](../tests/e2e/checkout.spec.ts) e [auth.spec.ts](../tests/e2e/auth.spec.ts) contêm assertions para esses comportamentos.

## 9. Salvar perfil e alterar senha como ações separadas

**Referência e mudança.** O frame desktop do perfil reúne os dados pessoais e os campos de senha sob um único botão “Salvar”. Na aplicação, “Salvar” envia os dados do perfil, enquanto “Alterar senha” pertence a um formulário independente, com validações e mensagens próprias.

**Motivação registrada — DEC-30.** As operações têm pré-condições diferentes: atualizar o perfil exige validar seus dados; trocar a senha exige conferir a credencial atual e confirmar a nova senha. Os contratos implementados usam `PATCH /profile` e `PUT /profile/password`, sem uma operação transacional que grave ambos atomicamente. Encadear esses requests sob um único botão poderia salvar um grupo e falhar no outro, exigindo comunicar um resultado parcial.

**Experiência e consequência.** A separação deixa explícito o efeito de cada ação e permite alterar dados pessoais sem preencher o grupo de senha. Erros de senha permanecem junto desse formulário. Em contrapartida, quem deseja modificar os dois grupos precisa executar duas ações, e a tela ganha um botão além daquele previsto no protótipo.

Essa limitação transacional pertence à API simulada que defini para o projeto; não é uma restrição imposta pelo enunciado. Seria possível projetar um endpoint conjunto ou tratar explicitamente o sucesso parcial. A escolha registrada prioriza ações independentes e resultados compreensíveis. Um salvamento conjunto pode ser reconsiderado se houver essa necessidade de produto e um contrato que sustente seu comportamento.

**Evidências:** DEC-30 em [ARCHITECTURE](../ARCHITECTURE.md); formulários `profile-form` e de senha, `saveMutation`, `passwordMutation` e botão associado por `form="profile-form"` em [ProfilePage](../src/routes/profile-page.tsx); serviços em [api.ts](../src/features/profile/api.ts). O teste `password change validates current and matching passwords, then invalidates the old password` em [profile.spec.ts](../tests/e2e/profile.spec.ts) cobre senha atual incorreta, confirmação divergente e autenticação com a nova senha. [marketplace.spec.ts](../tests/unit/marketplace.spec.ts) cobre rejeição de credenciais incorretas e versão obsoleta. Esses testes dão suporte ao fluxo de senha; não são uma comparação de usabilidade entre um e dois botões e não foram reexecutados neste levantamento.

## 10. Iconografia descritiva nos benefícios do rodapé

**Referência e mudança.** Na [screenshot desktop da home](../design/screenshots/Desktop/Início.png), os três blocos de benefícios do rodapé usam as letras maiúsculas “W”, “C” e “D” dentro de círculos. Substituí essas letras por ícones associados ao conteúdo: escudo com confirmação para “Segurança da carteira”, pessoas para “Criadores em destaque” e sino para “Alertas de lançamentos”.

**Motivação.** Optei por uma iconografia que exemplifica o significado de cada bloco, para facilitar a associação visual entre o símbolo e a mensagem sem exigir que o usuário interprete as letras. Essa intenção foi explicitada pelo autor durante a revisão deste documento.

**Experiência e consequência.** A expectativa é favorecer o reconhecimento dos temas ao percorrer o rodapé. Os títulos e descrições continuam presentes, e os ícones usam `aria-hidden="true"` por serem complementares ao texto. A escolha altera os símbolos do protótipo; seu benefício de compreensão não foi medido em testes com usuários. Os ícones ilustram os temas e não representam comprovação de segurança ou funcionalidades adicionais da demo.

**Evidências:** lista `benefits` e renderização dos componentes `ShieldCheck`, `UsersRound` e `Bell` em [SiteFooter](../src/components/layout/site-footer.tsx), comparadas com a referência local. O teste em [home-editorial.spec.ts](../tests/e2e/home-editorial.spec.ts) exercita o rodapé e a newsletter, mas não verifica a compreensão dessa iconografia.

## 12. Página de favoritos para completar a navegação

**Referência e mudança — DEC-32.** O enunciado exige favoritos autenticados persistentes e consulta, inclusão e remoção por API, mas não inclui uma página de favoritos entre as nove telas obrigatórias. A barra mobile já mostrava um coração dedicado à navegação, que permanecia desabilitado. Criamos `/favorites` por solicitação do usuário para completar esse fluxo e permitir reencontrar os NFTs salvos sem percorrer o catálogo.

**Motivação e comportamento.** Os corações nos cards e no detalhe salvam um NFT; o coração da navegação abre a coleção pessoal. A página usa os mesmos cards, cores e componentes da aplicação, com duas colunas no mobile, três no tablet e quatro no desktop. O acesso fica disponível no header desktop e na barra inferior da homepage mobile. Por decisão temporária do usuário, favoritos segue carrinho e perfil: sem barra inferior na própria página e com controle de voltar ao início. A revisão da navegação global mobile ficou registrada como follow-up em TASKS. Sem sessão, o login preserva `/favorites` como destino de retorno.

**Experiência e consequência.** A pessoa pode abrir o detalhe ou remover um favorito pela lista. No mobile, “Explorar catálogo” aparece abaixo dos NFTs salvos, seguindo a ordem de leitura solicitada pelo usuário; no desktop, permanece junto ao título. Na lista vazia, “Descobrir NFTs” oferece o acesso ao catálogo. A remoção atualiza a lista imediatamente, restaura o item e mostra erro visível se a API falhar. Há estados de carregamento, erro com nova tentativa e lista vazia com acesso ao catálogo. A consulta privada usa o cache existente por usuário; os detalhes dos NFTs reutilizam as consultas públicas, sem alterar os contratos REST. Esta tela é uma extensão de experiência solicitada, não um novo requisito atribuído ao desafio nem uma reprodução de um frame específico.

**Evidências:** [FavoritesPage](../src/routes/favorites-page.tsx), rota protegida em [router](../src/app/router.ts) e navegação em [AppShell](../src/components/layout/app-shell.tsx). [favorites.spec.ts](../tests/e2e/favorites.spec.ts) cobre retorno após login, refresh, detalhe, remoção com rollback e nova tentativa, inclusão a partir do detalhe e isolamento entre contas nos projetos desktop/mobile. Resultados da execução ficam registrados na [matriz de testes](TEST-MATRIX.md).

## Adaptações e limitações que também devem ser consideradas

- **Responsividade sem frames completos — DEC-18.** O enunciado exige versões mobile de perfil, carteiras e confirmação, mesmo sem referência. Perfil, gestão de carteiras e recibo têm composições responsivas; a gestão de carteiras foi aprovada em E2E desktop/mobile na TASK-09D.
- **Autenticação com continuidade.** No desktop, os acionadores abrem diálogo sobre a página atual; no mobile, usam uma rota com retorno interno. Isso preserva o contexto e segue as referências disponíveis. [auth.spec.ts](../tests/e2e/auth.spec.ts) cobre abertura, fechamento, retorno de foco e navegação mobile. É uma adaptação de fluxo, não uma ruptura geral com o protótipo.
- **Fonte e imagens — DEC-16/DEC-17.** IBM Plex Mono local aproxima a aparência monoespaçada, e quatro SVGs abstratos substituem temporariamente as artes. Origem e licença estão em [ASSETS](ASSETS.md). Essas escolhas facilitam execução local e desenvolvimento, mas não comprovam equivalência visual e não devem ser defendidas como uma melhoria de UX já demonstrada.
- **Bordas e acessibilidade.** A arquitetura registra a borda de input `#79583E` para melhorar a identificação dos controles; o token está em [styles.css](../src/styles.css). Contraste final, fidelidade visual, zoom e áreas de toque ainda precisam da revisão prevista. A existência do ajuste não comprova conformidade completa.

## O que estas decisões demonstram e como avaliá-las

Os exemplos mostram decisões sobre regras de produto, coerência entre interface e dados, recuperação de operações e manutenção de componentes. Minha contribuição está em identificar uma ambiguidade, assumir uma escolha explícita, implementá-la nas camadas necessárias e deixar evidências para revisão.

Para verificar rapidamente, recomendo montar um carrinho Ethereum + Polygon e concluir somente Polygon; percorrer as três etapas do pagamento em mobile; conferir a remoção textual no carrinho; e abrir um pedido confirmado pelo seu endereço. No perfil, é possível verificar o campo ENS completo e sua descrição de opcionalidade.

A [matriz de testes](TEST-MATRIX.md) registra aprovações locais reportadas pelo usuário para checkout confirmado/recusado/multirrede e perfil/avatar, com limitações de evidência anexada. Este levantamento não reexecutou essas suítes. Cenários avançados de tempo real, timeout e reconexão, baselines visuais e auditoria Lighthouse permanecem pendentes conforme os registros do projeto.

Uma justificativa documentada torna a decisão avaliável, mas não altera os critérios do desafio. Peço que estas escolhas sejam consideradas pelo problema que procuram resolver, pelo comportamento implementado e pelos custos que introduzem, junto da fidelidade visual e dos requisitos ainda em aberto.

## 11. Carteiras principais e secundárias com slots independentes

**Referência e mudança — DEC-31.** A tela de carteiras não tem uma especificação completa de campos nem frames mobile. A implementação apresenta seções para carteira principal e secundária, com formulário responsivo para nome do perfil, rede, endereço, provedor, ENS opcional e código de indicação opcional.

**Decisão de domínio.** Cada slot é único por conta. Seu apelido é derivado do slot e permanece estável após criação. O controle “Igual à carteira principal” copia os valores atuais para o formulário da secundária, que continua sendo um registro independente. Os endereços Ethereum/Polygon usam formato EVM; Solana usa Base58 e comprimento compatível. Isso apenas valida forma, sem verificar propriedade ou estado on-chain.

**Limite que deve ser discutido na avaliação.** O enunciado solicita cadastro e edição de carteiras principal e secundária, mas não declara literalmente um máximo de duas. REQ-014 fala em selecionar uma carteira cadastrada; REQ-024 pede validação e persistência, sem especificar quantidade. O protótipo oferece somente os dois slots nomeados, portanto hoje cada conta pode registrar até duas carteiras. Essa escolha interpreta o escopo visível e não deve ser apresentada como uma restrição explícita do requisito. Pergunta sugerida ao avaliador: “Ao pedir carteira principal e secundária, o desafio espera exatamente dois slots ou a possibilidade de cadastrar mais carteiras além desses papéis?”

**Efeito e limitações.** Edição usa versão otimista; cadastro e edição retornam erros de validação, conflito de slot/endereço e versão obsoleta. As carteiras salvas compartilham cache com o checkout, que passa a preencher endereço e metadados a partir do registro atualizado. A regra de formato não comprova que a carteira existe ou pertence ao usuário.

**Evidências:** DEC-31 em [ARCHITECTURE](../ARCHITECTURE.md); contrato API-11 em [CONTRACTS](CONTRACTS.md); implementação em [WalletsPage](../src/routes/wallets-page.tsx), [API de carteiras](../src/features/wallets/api.ts) e [mock de domínio](../src/mocks/wallets.ts). [wallets.spec.ts](../tests/e2e/wallets.spec.ts) foi aprovado pelo usuário em Chromium desktop e mobile.
