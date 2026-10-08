# Arquitetura e decisões

Este documento explica como a aplicação organiza estado, integração, persistência e regras de compra. Os IDs `DEC-*` identificam decisões estáveis; os requisitos vêm do [enunciado](challenge-description.md) e de [REQUIREMENTS](REQUIREMENTS.md).

**Estado em 08/10/2026:** catálogo, autenticação/favoritos, carrinho, checkout, perfil/carteiras e emissão/consumo de eventos estão implementados. O backlog registra eventos, isolamento, reconciliação e recuperação idempotente concluídos nas TASK-10A a TASK-10E, além dos controles e fluxos cobertos pela TASK-11. Variantes parciais de cenários, respostas REST privadas atrasadas e verificações finais permanecem pendentes. Execuções e publicação são registradas em [TEST-MATRIX](docs/TEST-MATRIX.md) e [RELEASE](docs/RELEASE.md).

Para entender a arquitetura rapidamente, leia o mapa de responsabilidades, a tabela de cache e a seção de tempo real. As motivações das diferenças visuais e de produto estão reunidas em [Decisões para avaliação](docs/DECISOES-PARA-AVALIACAO.md); payloads e endpoints ficam em [CONTRACTS](docs/CONTRACTS.md). O histórico de implementação pertence a [TASKS](TASKS.md).

## Estrutura e limites

```text
src/
  app/          # bootstrap, providers e sessão
  routes/       # TanStack Router e composição das páginas
  components/   # componentes compartilhados e shadcn/ui
  features/     # catalog, auth, favorites, cart, checkout, profile, wallets, realtime
  contracts/    # DTOs, erros e envelopes de eventos
  lib/          # Axios, dinheiro e funções pequenas
  mocks/        # handlers, banco, fixtures, cenários e relógio
tests/
  e2e/
  unit/
docs/
```

| Responsabilidade | Onde conferir | Por que fica nessa camada |
| --- | --- | --- |
| Bootstrap, providers, guards e rotas | [providers.tsx](src/app/providers.tsx), [router.ts](src/app/router.ts) | Iniciar mocks antes das consultas e proteger os destinos privados |
| Consultas e mutations REST | `src/features/*/api.ts` e [http.ts](src/lib/http.ts) | Centralizar transporte e contratos sem respostas fictícias na UI |
| Cache e consumo de eventos | [QueryClient](src/app/query-client.ts), [consumidor](src/features/realtime/domain-event-consumer.ts) e provider | Atualizar dados remotos e controlar o ciclo de vida do socket |
| Validação e regras simuladas | [handlers](src/mocks/handlers.ts), [commerce](src/mocks/commerce.ts), [auth](src/mocks/auth.ts), [wallets](src/mocks/wallets.ts) | Autorizar e validar operações também na camada de rede |
| Persistência e fixtures | [database](src/mocks/database.ts), [state](src/mocks/state.ts), [fixtures](src/mocks/fixtures.ts) | Manter um estado consistente e recuperável após refresh |

```text
Página/componente → TanStack Query → serviço Axios → handler MSW → domínio/IndexedDB
                                  ← resposta tipada ← transação concluída
Socket.IO → consumidor → comparação de identidade/versão → atualização/invalidação do cache
```

A URL guarda busca, filtros, ordenação e página. Query guarda dados remotos. Estado local guarda rascunhos de formulários, seleção de edição e diálogos. As fixtures são acessadas pela camada de mocks; componentes não consultam o banco diretamente.

## Decisões de arquitetura — DEC-01 a DEC-15

| ID | Decisão e motivação | Requisitos |
| --- | --- | --- |
| DEC-01 | Vite + React + TypeScript, npm e lockfile; stack obrigatória sem biblioteca global adicional de estado. Versões resolvidas em package-lock.json; integração de prova REST/socket, E2E e deploy inicial Vercel validados na TASK-03 | REQ-001, REQ-050 |
| DEC-02 | URL guarda busca/filtros/ordenação/página; Query guarda estado remoto; estado local guarda edição/formulários/diálogos. Não duplicar carrinho em outro store | REQ-005, REQ-025, REQ-027 |
| DEC-03 | Componentes → hooks Query → serviços Axios → handlers MSW → domínio/banco simulado. Eventos e REST usam o mesmo domínio. UI não importa fixtures | REQ-025, REQ-029, REQ-030, REQ-032 |
| DEC-04 | Inicialização aguarda ativação dos mocks, depois recupera sessão e resolve guards. Token fictício opaco persistido; handlers verificam dono e expiração em toda operação privada | REQ-021, REQ-022, REQ-023 |
| DEC-05 | Banco simulado versionado em IndexedDB, com transações para pedido/estoque/carrinho/idempotência; verificador de senha derivado com salt, nunca senha em claro persistida | REQ-016, REQ-019, REQ-024, REQ-030 |
| DEC-06 | Aritmética em wei com BigInt; transporte/persistência com strings decimais ETH. Conversão estrita até 18 casas, quantidades inteiras positivas, descontos em basis points com arredondamento para baixo em wei | REQ-012 |
| DEC-07 | Carrinho de visitante tem identidade opaca. Login mescla uma vez por identidade/revisão, soma NFT+edição até estoque, informa ajustes e consome origem. A identidade visitante permanece no localStorage; logout não cria um novo guestId | REQ-009, REQ-010, REQ-023 |
| DEC-08 | Cotação é snapshot com versão/validade, rede, itens e totais. Compra revalida atomicamente; diferença retorna conflito e nova cotação para revisão explícita | REQ-014, REQ-015 |
| DEC-09 | Tentativa persistida antes do envio, por usuário, com chave e payload imutável. Busca por chave ou reenvio idêntico recupera pedido. Nova revisão gera nova tentativa somente após resolver a anterior | REQ-016, REQ-017 |
| DEC-10 | Mock reserva estoque ao criar pendência; confirma consumo ou libera reserva na recusa. Carrinho conserva itens até confirmação. Snapshot do recibo nunca consulta preço atual | REQ-017, REQ-019, REQ-020 |
| DEC-11 | Socket com transporte WebSocket no mock, namespace padrão e eventos textuais via `@mswjs/socket.io-binding`. Prova inicial e E2E de eventos registrados; sem acknowledgements como dependência de negócio | REQ-032, REQ-033 |
| DEC-12 | IDs de evento e versão por recurso impedem reaplicação e regressão no consumidor. Reconciliação após reconexão implementada e com E2E confirmado; comparação com todas as respostas REST tardias ainda precisa de consolidação | REQ-027, REQ-034, REQ-035, REQ-036 |
| DEC-13 | Favoritos são a mutation otimista: cancelar leitura, guardar snapshot, aplicar mudança, rollback em erro e invalidar ao concluir. O controle em envio fica desabilitado; serialização entre diferentes controles do mesmo NFT ainda exige verificação | REQ-008 |
| DEC-14 | Assets locais, tokens aproximados a partir dos PNGs, estados acessíveis reutilizáveis e layouts próprios para mobile quando necessários. Tokens originais do arquivo Figma não foram inspecionados | REQ-004, REQ-037, REQ-038, REQ-039, REQ-040 |
| DEC-15 | Cenário padrão, reset, relógio e controles básicos de latência/pagamento disponíveis por endpoints MSW. Painel e cenários avançados ainda pendentes; testes alteram o mock pela rede | REQ-031, REQ-044 |

## Decisões de interface e produto — DEC-16 a DEC-32

As decisões abaixo complementam DEC-14. Fonte local, placeholders e composições responsivas estão implementados; isso não comprova fidelidade visual ou acessibilidade completas. A coluna de verificação aponta a tarefa e o grupo de testes correspondente, não uma aprovação automática de todo o requisito.

| ID | Decisão | Execução / verificação | Requisitos |
| --- | --- | --- | --- |
| DEC-16 | Escolher por comparação com os PNGs uma fonte semelhante, de aparência monoespaçada, disponível para uso local. Não depender da identificação da fonte original no Figma. Registrar família, pesos e origem quando escolhidos | TASK-02; revisão em TASK-12 / TEST-14 | REQ-037, REQ-040 |
| DEC-17 | Usar assets placeholders por enquanto. Manter arquivos locais, identidades estáveis e proporções compatíveis com os componentes. Documentar substituições; reavaliar a qualidade visual antes da entrega, sem presumir que placeholders já atendem à fidelidade exigida | TASK-02, TASK-04, TASK-05; revisão em TASK-12 / TEST-14 | REQ-030, REQ-037, REQ-040 |
| DEC-18 | Criar adaptações próprias para tablet e telas mobile sem referência, seguindo a identidade dos PNGs e preservando todos os fluxos. Não aguardar novos frames do Figma | TASK-05, TASK-08, TASK-09, TASK-12 / TEST-14 | REQ-004, REQ-037, REQ-039 |
| DEC-19 | Contratos distinguem username/displayName e slot/nickname/profileName/provider da carteira. ENS e indicação são opcionais; perfil usa a carteira principal como fonte do apelido. Collector guarda esses metadados e observação no snapshot, sem exigir serviços reais de ENS ou indicação | TASK-04; formulários em TASK-06/TASK-09 | REQ-014, REQ-024, REQ-025 |
| DEC-20 | Não exibir badge RARO no card do catálogo: o PNG mobile o mostra, mas não existe requisito formal nem critério/campo no contrato que determine raridade. Perguntar na apresentação se é marcação editorial ou conceito de domínio; reconsiderar se houver regra explícita | TASK-05 / UI-SPEC; pergunta de apresentação | — |
| DEC-21 | Usar também no mobile o mesmo `Button size="stepper"` e o mesmo estilo visual dos controles desktop. A escolha mantém consistência entre breakpoints, evita componente/variante mobile duplicada e reduz divergência de manutenção e teste; o layout dos cards continua responsivo | TASK-07 / UI-03; verificado por typecheck, lint e build | REQ-009, REQ-010, REQ-037, REQ-039 |
| DEC-22 | Campo de código promocional reutiliza o `Input` compartilhado com estilos base e dimensões responsivas padrão, sem aparência exclusiva por breakpoint. Consolidar o campo com os formulários existentes evita exceções visuais e mantém o sistema de design coerente | TASK-07 / UI-03; revisar em TEST-14 | REQ-037, REQ-039 |
| DEC-23 | No carrinho mobile, agrupar stepper e ação “Remover” em uma linha abaixo dos dados do NFT; usar ícone acompanhado de texto para tornar a ação clara. A imagem acompanha verticalmente os dados e a linha de ações. Desktop mantém apenas lixeira. O mockup mobile não apresenta remoção uniforme em todas as linhas; área de toque e composição exigem revisão final | TASK-07 / UI-03; validar em TEST-05 e TEST-14 | REQ-009, REQ-037, REQ-039 |
| DEC-24 | Agrupar o carrinho por rede e permitir finalizar cada grupo separadamente. Uma compra/cotação/pedido pertence a uma só rede; a cotação inclui somente os NFTs dessa rede, a carteira compatível é selecionada para ela e as demais redes ficam no carrinho. Não simular uma transação atômica entre blockchains | TASK-08 / FLOW-01; validar em TEST-06 e TEST-17 | REQ-012, REQ-014, REQ-015, REQ-018 |
| DEC-25 | Campos do checkout derivados da carteira e não editáveis permanecem `readOnly` (copiáveis e acessíveis por teclado); identificá-los com um cadeado discreto e fundo/borda distintos. Não repetir o texto “Somente leitura” em cada rótulo para evitar ruído visual | TASK-08 / UI-04; typecheck e lint passaram; revisar em TEST-14 | REQ-014, REQ-037, REQ-039 |
| DEC-26 | Nas etapas mobile Carteira e Revisão, manter o CTA principal no fluxo normal do documento, após o conteúdo. Não usar botão flutuante/fixo, para evitar sobreposição dos itens, valores ou dados da carteira | TASK-08 / UI-04; validar em TEST-06 e TEST-14 | REQ-037, REQ-039 |
| DEC-27 | O header global de desktop fica oculto em todas as rotas abaixo do breakpoint `md`; cada fluxo mobile usa sua própria composição, sem reaproveitar o header desktop | UI-SPEC / shell; coberto por verificações de home, login e checkout no E2E | REQ-004, REQ-037, REQ-039 |
| DEC-28 | Manter a confirmação e o recibo em uma rota própria (`/orders/:orderId`), não em uma modal transitória. A confirmação é assíncrona e depende da resolução do pedido; a URL permite recuperar o estado após refresh, abrir o recibo diretamente e preservar um destino inequívoco para os estados pendente, confirmado e recusado. Manter o painel centralizado do mockup dentro da rota e usar ações explícitas para sair, sem o X de modal | TASK-08; validar navegação, refresh, estados e composição visual em TEST-06, TEST-07 e TEST-14 | REQ-003, REQ-004, REQ-017, REQ-018, REQ-020 |
| DEC-29 | O perfil recebe o nome ENS completo em um único campo de texto (por exemplo, `ana.eth`). O protótipo só suporta nomes `.eth`, então não há seletor de moeda/rede ou sufixo; a demo não consulta a blockchain nem valida se o nome está registrado. O campo permanece opcional | TASK-09A; cobrir persistência em TEST-08A e revisar composição em TEST-14 | REQ-024, REQ-037 |
| DEC-30 | Salvar dados do perfil e alterar senha são ações separadas. A senha exige validação da credencial atual, confirmação e mensagens próprias; a API não oferece transação atômica que englobe perfil e senha, então um único botão poderia confirmar apenas parte das alterações quando uma das operações falhasse | TASK-09C; cobrir senha atual incorreta, confirmação, nova autenticação e rejeição da senha antiga em TEST-08C/TEST-03 | REQ-024 |
| DEC-31 | A UI oferece os slots principal e secundário; limitar a conta a esses dois slots é uma interpretação do escopo nomeado no desafio, não um limite numérico explícito. O slot/nickname é estável após cadastro; “Igual à carteira principal” apenas copia valores para edição independente. Validar endereços conforme a rede (EVM em Ethereum/Polygon, Base58 em Solana), impedir duplicação na mesma rede e refletir a versão salva no cache compartilhado do checkout | TASK-09D; validar criação, edição, concorrência, refresh e checkout em TEST-08D/TEST-06; confirmar com o avaliador se deve haver mais slots | REQ-014, REQ-024 |

As decisões interpretam o protótipo e o escopo, mas não alteram os critérios do enunciado. Arte e fonte substituídas, ENS opcional, dois slots de carteira e composição do recibo têm consequências descritas no [documento para avaliação](docs/DECISOES-PARA-AVALIACAO.md).

### DEC-32 — Página de favoritos

`/favorites` complementa os favoritos persistentes com uma lista pessoal protegida por sessão, acessível no header desktop e na barra da homepage mobile. Temporariamente, a própria página não exibe barra inferior, seguindo carrinho e perfil, e oferece voltar ao início; a revisão da navegação global mobile está no backlog. A página não está entre as nove telas obrigatórias do enunciado; foi solicitada para tornar funcional o destino sugerido pelo coração da navegação. Reutiliza `['favorites', userId]`, consultas de detalhe e cards existentes. A remoção usa snapshot otimista, rollback e erro visível na página; os controles de remoção ficam desabilitados durante o envio para evitar remoções concorrentes nessa lista. Motivação e consequências em [DEC-32](docs/DECISOES-PARA-AVALIACAO.md#12-página-de-favoritos-para-completar-a-navegação).

### DEC-30 — Salvar perfil e alterar senha como ações separadas

O botão **Salvar** grava nome de exibição, nome de usuário, e-mail e ENS pelo `PATCH /profile`. O botão **Alterar senha** envia somente a senha atual e a nova pelo `PUT /profile/password`; a confirmação é validada no cliente e não é enviada à API. As duas ações ficam em formulários independentes porque têm pré-condições e resultados diferentes: uma alteração de senha exige provar conhecimento da credencial atual, e os erros devem permanecer junto ao grupo de senha.

Um único botão para ambos os grupos encadearia duas operações independentes. Se a primeira fosse concluída e a segunda falhasse, ou vice-versa, parte das alterações seria persistida apesar da interface sugerir que o envio era uma unidade. Manter ações distintas evita esse estado de sucesso parcial e deixa explícito o efeito de cada ação. Unificar os botões só deve ser reconsiderado se o produto exigir salvamento conjunto e a API oferecer uma operação transacional que grave ambos os recursos atomicamente.

### DEC-31 — Slots de carteira únicos e cópia explícita

Cada conta tem no máximo uma carteira principal e uma secundária. O slot determina o apelido apresentado (“Principal” ou “Secundária”) e não muda durante a edição; para evitar transferir uma identidade por acidente, mover dados entre slots exige copiar os campos e salvar no outro slot. O controle “Igual à carteira principal” é somente um atalho que copia os valores atuais para campos independentes, sem compartilhar um registro. Um endereço repetido só conflita na mesma rede; o mesmo endereço EVM pode ser cadastrado em Ethereum e Polygon.

**Limite de escopo:** o enunciado lista “cadastro e edição de carteiras principal e secundária”, enquanto REQ-014 e REQ-024 pedem usar carteiras cadastradas e validar/persistir dados. Nenhum deles afirma literalmente que a conta só pode ter duas carteiras ou proíbe slots adicionais. A implementação trata principal e secundária como os únicos slots disponíveis porque são os dois tipos nomeados; essa é uma interpretação de produto para este protótipo, não uma exigência comprovada pelo desafio. Confirmar com o avaliador se “principal e secundária” significa exatamente dois registros ou se a experiência deveria aceitar uma coleção maior de carteiras.

O endereço é validado com formato compatível com a rede: EVM para Ethereum/Polygon e Base58 em faixa de tamanho de Solana. A validação detecta erros de formato, não comprova propriedade, saldo ou existência on-chain. Depois de salvar, a query de carteiras compartilhada com o checkout é atualizada/invalidada, para que os campos somente leitura usem o cadastro vigente.

## Sessão e isolamento — DEC-04

O token fictício opaco fica em `sessionStorage`. O [interceptor Axios](src/lib/http.ts) envia o bearer token; a [consulta de sessão](src/features/auth/api.ts) recupera o perfil via `GET /auth/session`. Se essa consulta recebe 401, remove o token e devolve sessão ausente. Os guards consultam a sessão e encaminham ao login com um retorno interno validado.

Os handlers autorizam recursos usando a sessão do banco, não um `userId` recebido no corpo. Perfil, carteiras, checkout e pedidos exigem sessão; favoritos também são privados. Senhas fictícias são verificadas com PBKDF2/SHA-256, salt e 100 mil iterações, sem persistência de texto claro. Esse mecanismo é uma simulação local, não um serviço de autenticação de produção.

Login cancela/limpa cache antes de estabelecer a nova identidade; logout cancela consultas, remove o token mesmo se a chamada falhar e limpa o cache. O consumidor de eventos desconecta seu socket na limpeza, marca callbacks como inativos e cancela/remove recursos privados. Pedidos não incluem usuário na query key atual: dependem da autorização da API e da limpeza do cache na troca de identidade. Essa diferença em relação ao desenho conceitual está explícita na tabela abaixo.

O backlog registra testes de logout/troca de usuário e eventos atrasados na TASK-10C. Tratamento completo de expiração/401 durante navegação e checkout, descarte de todas as respostas REST tardias e retomada pelo mesmo usuário ainda precisam das verificações previstas nas TASK-10/11. Não há hoje um interceptor global que resolva qualquer 401 de recurso privado.

## Cache e retries — DEC-02, DEC-12, DEC-13

A tabela descreve as **query keys e configurações implementadas**, conforme os serviços em `src/features/*/api.ts`. O padrão do [QueryClient](src/app/query-client.ts) é frescor de 30 segundos e reconsulta no foco da janela.

| Recurso | Query key atual | Atualização |
| --- | --- | --- |
| Catálogo | `['nfts', 'list', params]` | 30 s; parâmetros isolados; evento invalida listagens |
| Detalhe | `['nfts', 'detail', id]` | 30 s; evento mais novo atualiza o detalhe |
| Facetas | `['nfts', 'facets']` | 30 s; evento NFT invalida a consulta |
| Sessão | `['session']` | `staleTime: 0`; bootstrap, guards e foco reconsultam |
| Favoritos | `['favorites', userId]` | 30 s; mutation otimista com rollback e invalidação |
| Perfil / carteiras | `['profile', userId]` / `['wallets', userId]` | 30 s; salvamento atualiza/invalida o cache correspondente |
| Carrinho | `['cart', 'guest:<id>']` ou `['cart', 'user:<id>']` | 30 s; mutations e eventos invalidam/atualizam o recurso |
| Cotação | Sem query key própria | Mutation; snapshot em estado local do checkout; API revalida no envio |
| Pedido | `['orders', orderId]` | Polling de 750 ms somente em `pending`; evento atualiza o pedido; terminal encerra polling |

GET tem no máximo uma repetição automática, com atraso de 500 ms, para falha de rede/5xx. Erros 4xx e cancelamentos não têm retry automático. Mutations não são repetidas automaticamente. Axios tem timeout de 10 segundos, e as consultas recebem `AbortSignal` do Query.

Skeletons representam carregamento sem conteúdo utilizável; atualização em segundo plano mantém o conteúdo e informa atividade. Troca de filtros usa a query key correspondente à nova URL, sem apresentar resultados antigos como se fossem da nova busca.

[Favoritos](src/features/favorites/favorite-button.tsx) cancelam a leitura, guardam snapshot, atualizam a lista visível, restauram em erro e invalidam ao concluir. O botão fica desabilitado durante sua mutation. A serialização entre múltiplos controles do mesmo NFT ainda exige verificação específica; desabilitar uma instância não é uma fila global por NFT.

## Persistência, carrinho e dinheiro — DEC-05 a DEC-07

O [banco](src/mocks/database.ts) usa IndexedDB `kurio-demo`, store `state` e registro `database`. O schema interno é definido por `SCHEMA_VERSION` em [state.ts](src/mocks/state.ts). A versão atual deve ser consultada nesse arquivo. Dados de formato incompatível são substituídos pelas fixtures, sem migração. O formato pode evoluir durante o desenvolvimento.

Cada operação usa uma transação `readwrite` sobre o estado inteiro, inclusive leituras que possam inicializar/restaurar o banco. O reducer é síncrono, e o resultado só é devolvido após commit. Isso serializa operações no banco também entre abas; a emissão Socket.IO atual, porém, pertence aos clientes registrados no mock da aba e não constitui sincronização completa entre abas.

O visitante tem `guestId` opaco persistido no `localStorage` e enviado como `X-Guest-Id`. O bearer token prevalece quando autenticado. Login/cadastro captura a revisão do carrinho visitante e chama o merge privado; a origem consumida não é aplicada novamente. O merge respeita estoque e devolve avisos para ajustes. Logout remove a sessão, mas conserva o identificador visitante; não cria um novo `guestId`.

Dinheiro trafega como string decimal ETH, com até 18 casas. [money.ts](src/lib/money.ts) converte para wei inteiro com `BigInt`, calcula subtotal/desconto/taxa e converte novamente para texto. Desconto em basis points é truncado para baixo em wei. As taxas são simuladas em ETH para todas as redes, conforme o contrato do desafio; não representam taxas ou moedas reais dessas redes.

Avatar é validado e persistido como URL `data:` no perfil, com limite de 2 MiB. Perfil e carteira usam versão esperada para evitar gravação obsoleta. As regras e formatos públicos ficam em [CONTRACTS](docs/CONTRACTS.md); detalhes didáticos do domínio ficam em [MOCKS-GUIDE](docs/MOCKS-GUIDE.md).

## Compra e recuperação — DEC-08 a DEC-10

Uma cotação e um pedido pertencem a uma rede (DEC-24). A carteira deve ser compatível, e outras redes permanecem no carrinho. O cupom pertence ao carrinho; os totais incluem cálculo por grupo e agregação.

```text
Carrinho → conexão simulada → cotação revisada → envio idempotente → pending
                                                                   ├→ confirmed
                                                                   └→ declined
```

A cotação captura versão do carrinho, itens, preços, estoque, cupom e taxa, com validade de cinco minutos do relógio simulado. No envio, o domínio revalida os dados atomicamente. Diferença de valores exige nova revisão; indisponibilidade exige correção dos itens. A interface não autoriza uma compra apenas porque exibiu uma cotação anteriormente.

A tentativa guarda chave e payload no `localStorage`, sob `kurio-order-attempt:<userId>`, antes do envio. Esse payload contém metadados do colecionador e referências de carteira/conexão, sem senha. A mesma chave e conteúdo recuperam o resultado persistido; conteúdo diferente gera conflito. Resolver a chave existente precede revalidar estoque, para que a própria reserva não invalide o reenvio.

O mock reserva estoque em `pending`. Confirmação consome a reserva e remove somente as quantidades capturadas; recusa libera a reserva e preserva itens. Cada linha mantém lotes com identidade: inclusões posteriores sobrevivem à confirmação. Esses efeitos ocorrem na transação do domínio, nunca em callbacks de UI. Estados terminais não regridem, e o recibo usa o snapshot imutável do pedido.

Há recuperação básica pelo endpoint de tentativa e consulta de pedido. O domínio persiste o prazo/resultado da simulação, e a consulta pode resolver pedidos vencidos após refresh. As TASK-10D/E registram E2E de reconciliação e recuperação após 504 simulado e refresh. Timeout HTTP real por resposta atrasada e demais variantes parciais permanecem fora dessa cobertura. Timeout não significa pagamento recusado.

Código de referência: [CheckoutPage](src/routes/checkout-page.tsx), [API de checkout](src/features/checkout/api.ts), [commerce](src/mocks/commerce.ts) e [OrderPage](src/routes/order-page.tsx). Comportamento esperado: [FLOW-01](docs/FLOWS.md#flow-01-compra) e [FLOW-02](docs/FLOWS.md#flow-02-recuperação-de-tentativa).

## Tempo real — DEC-11, DEC-12

### Implementado

O [mock](src/mocks/handlers.ts) publica `nft.updated` e `order.updated` depois de persistir as alterações. [domain-events.ts](src/mocks/domain-events.ts) monta envelopes com ID estável por recurso/versão, timestamp e snapshot. Pedido inclui `userId` e `sessionId`.

O consumidor em [providers.tsx](src/app/providers.tsx) inicia depois do worker MSW e da leitura inicial de sessão. Usa `socket.io-client` com WebSocket e autentica por `session.authenticate`; `session.authenticated` devolve a identidade da sessão, que é distinta do token bearer. O mock só publica eventos privados para clientes autenticados na sessão ativa correspondente.

O consumidor valida a coerência do envelope/payload e mantém até 500 IDs vistos por ciclo da conexão. Eventos NFT precisam ser mais novos que as versões presentes no detalhe/listagens em cache; atualizam o detalhe e invalidam listas, facetas e carrinhos. Eventos de pedido conferem usuário, sessão, versão e estado terminal antes de atualizar o cache; confirmação invalida o carrinho daquele usuário.

Na limpeza do efeito, o socket desconecta e callbacks antigos deixam de aplicar alterações. [domain-event-consumer.ts](src/features/realtime/domain-event-consumer.ts) concentra validação, comparação e limpeza de queries privadas. As verificações são cobertas por [testes unitários](tests/unit/domain-events.spec.ts) e [E2E de eventos](tests/e2e/domain-events.spec.ts), com execuções registradas em TASKS.

### Reconciliação após reconexão — TASK-10D

O consumidor detecta reconexão e invalidam detalhes/listas/facetas, carrinhos e pedidos. Para eventos privados, a reconciliação aguarda autenticação do socket. Uma geração de reconexão comunica a atualização ao checkout, que busca nova cotação, compara os termos e pede revisão quando mudam; falha de revalidação bloqueia a confirmação até atualizar a cotação.

A comparação está em [reconciliation.ts](src/features/realtime/reconciliation.ts). O backlog registra tipos/lint/unitários/build aprovados e confirmação do usuário para o E2E de reconexão desktop/mobile. Esse caso valida carrinho/cotação; não comprova todas as variantes possíveis de perda de eventos.

Comparar eventos com cache não garante, por si só, que toda resposta REST atrasada seja impedida de sobrescrever uma versão mais nova. A recuperação após 504 simulado foi concluída na TASK-10E; as variantes parciais dos cenários e a resposta REST privada atrasada após troca/reset ainda exigem cobertura própria.

### Limites do transporte

A demonstração usa WebSocket, namespace padrão e eventos textuais via `@mswjs/socket.io-binding`. Polling/upgrade, namespaces personalizados, acknowledgements e anexos binários não fazem parte da cobertura atual. A rota `/__proof` verifica transporte; as suítes de domínio verificam os eventos de negócio. Nenhuma dessas provas, isoladamente, comprova todo o requisito de tempo real ou a versão pública final.

## Catálogo, formulários e composição visual

O [estado do catálogo](src/features/catalog/search.ts) normaliza parâmetros do Router e serializa filtros repetidos para REST. Categorias/redes combinam OR dentro do grupo e AND entre grupos; uma mudança reinicia a página. Busca e preço mantêm rascunho até submissão. Facetas/contagens vêm da API, independentemente da página e dos filtros aplicados.

Desktop usa sidebar a partir de 1024 px; abaixo disso, filtros abrem um diálogo lateral. Busca usa diálogo próprio. Os diálogos têm fechamento explícito/Escape e retorno de foco. Desktop abre autenticação sobre a página atual; mobile navega para login/cadastro, com retorno interno. Galeria, edição e quantidade usam estado local no detalhe; Comprar adiciona pela API e navega ao carrinho após sucesso.

O header desktop fica oculto abaixo de `md` em todas as rotas. A home tem composição mobile e navegação inferior próprias. Checkout mobile usa Dados → Carteira → Revisão; recibo, perfil e carteiras têm adaptações para telas sem frame mobile.

IBM Plex Mono via Fontsource (400/500/600/700) e quatro SVGs abstratos são locais. A fonte aproxima a referência, e os SVGs são placeholders. Tokens foram estimados/medidos dos PNGs; não foram exportados do arquivo editável do Figma. A borda de input foi ajustada para `#79583E`; contraste final ainda depende de revisão. Os componentes seguem o padrão shadcn/ui adaptado manualmente.

Benefícios do rodapé usam escudo, pessoas e sino no lugar de W/C/D. Newsletter e login social explicam indisponibilidade; ações fora do escopo não simulam sucesso. ENS é opcional e não consulta blockchain; raridade não é exibida sem critério de domínio. Detalhes das diferenças e seus custos estão em [Decisões para avaliação](docs/DECISOES-PARA-AVALIACAO.md).

## Como conferir e o que falta fechar

| Tema | Evidência de código/teste | Limite da evidência |
| --- | --- | --- |
| Precisão, idempotência e baixa do carrinho | [marketplace.spec.ts](tests/unit/marketplace.spec.ts) | Não substitui cenários completos na interface |
| Sessão e favorito otimista | [auth.spec.ts](tests/e2e/auth.spec.ts) | Expiração com retorno coberta; resposta privada atrasada ainda sem E2E dedicado |
| Compra confirmada/recusada/multirrede | [checkout.spec.ts](tests/e2e/checkout.spec.ts) | Reconciliação e recuperação após 504 cobertas; timeout HTTP real não simulado |
| Perfil, senha, avatar e carteiras | [profile.spec.ts](tests/e2e/profile.spec.ts), [wallets.spec.ts](tests/e2e/wallets.spec.ts) | Revisão visual/acessível abrangente ainda pendente |
| Eventos e isolamento de identidade | [domain-events.spec.ts](tests/e2e/domain-events.spec.ts) | Não comprova reconciliação REST após reconectar |

A arquitetura descrita foi conferida no código; esta revisão documental não reexecutou as suítes. Resultados e artefatos ficam em [TEST-MATRIX](docs/TEST-MATRIX.md). Painel/cenários avançados, baselines visuais, auditoria Lighthouse, checkout limpo e smoke do deploy final permanecem no fechamento de [TASKS](TASKS.md) e [RELEASE](docs/RELEASE.md).
