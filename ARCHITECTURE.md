# Arquitetura e decisões

Status: **TASK-03 concluída: base e provas REST/Socket.IO validadas localmente e no deploy Vercel**. Providers/router, cliente Axios, tokens e shell estão preparados. Demais decisões de domínio permanecem propostas. Decisões abaixo guiam o desenvolvimento e devem ser atualizadas quando o código trouxer evidência diferente. Fonte de obrigações: [REQUIREMENTS.md](REQUIREMENTS.md). Payloads: [CONTRACTS](docs/CONTRACTS.md).

## Estrutura e limites

```text
src/
  app/          # bootstrap, providers e sessão
  routes/       # TanStack Router e composição das páginas
  components/   # componentes compartilhados e shadcn/ui
  features/     # catalog, auth, favorites, cart, checkout, orders, profile, wallets
  contracts/    # DTOs, erros e envelopes de eventos
  lib/          # Axios, dinheiro e funções pequenas
  realtime/     # socket, subscriptions e reconciliação
  mocks/        # handlers, banco, fixtures, cenários e relógio
tests/
  e2e/
  visual/
docs/
```

| ID | Decisão e motivação | Requisitos |
| --- | --- | --- |
| DEC-01 | Vite + React + TypeScript, npm e lockfile; stack obrigatória sem biblioteca global adicional de estado. Versões resolvidas em package-lock.json; integração de prova REST/socket, E2E e deploy inicial Vercel validados na TASK-03 | REQ-001, REQ-050 |
| DEC-02 | URL guarda busca/filtros/ordenação/página; Query guarda estado remoto; estado local guarda edição/formulários/diálogos. Não duplicar carrinho em outro store | REQ-005, REQ-025, REQ-027 |
| DEC-03 | Componentes → hooks Query → serviços Axios → handlers MSW → domínio/banco simulado. Eventos e REST usam o mesmo domínio. UI não importa fixtures | REQ-025, REQ-029, REQ-030, REQ-032 |
| DEC-04 | Inicialização aguarda ativação dos mocks, depois recupera sessão e resolve guards. Token fictício opaco persistido; handlers verificam dono e expiração em toda operação privada | REQ-021, REQ-022, REQ-023 |
| DEC-05 | Banco simulado versionado em IndexedDB, com transações para pedido/estoque/carrinho/idempotência; verificador de senha derivado com salt, nunca senha em claro persistida | REQ-016, REQ-019, REQ-024, REQ-030 |
| DEC-06 | Aritmética em wei com BigInt; transporte/persistência com strings decimais ETH. Conversão estrita até 18 casas, quantidades inteiras positivas, descontos em basis points com arredondamento para baixo em wei | REQ-012 |
| DEC-07 | Carrinho de visitante tem identidade opaca. Login mescla uma vez por identidade/revisão, soma NFT+edição até estoque, informa ajustes e consome origem. Logout cria novo visitante vazio | REQ-009, REQ-010, REQ-023 |
| DEC-08 | Cotação é snapshot com versão/validade, rede, itens e totais. Compra revalida atomicamente; diferença retorna conflito e nova cotação para revisão explícita | REQ-014, REQ-015 |
| DEC-09 | Tentativa persistida antes do envio, por usuário, com chave e payload imutável. Busca por chave ou reenvio idêntico recupera pedido. Nova revisão gera nova tentativa somente após resolver a anterior | REQ-016, REQ-017 |
| DEC-10 | Mock reserva estoque ao criar pendência; confirma consumo ou libera reserva na recusa. Carrinho conserva itens até confirmação. Snapshot do recibo nunca consulta preço atual | REQ-017, REQ-019, REQ-020 |
| DEC-11 | Socket com transporte WebSocket no mock, namespace padrão e eventos textuais via `@mswjs/socket.io-binding` 0.2.0. Prova automatizada aguarda execução E2E; sem acknowledgements como dependência de negócio | REQ-032, REQ-033 |
| DEC-12 | Versão por recurso + IDs de evento; comparar versões também nas respostas REST para evitar regressão. Reconexão invalida/reconsulta recursos ativos | REQ-027, REQ-034, REQ-035, REQ-036 |
| DEC-13 | Favoritos são a mutation otimista: cancelar leitura, guardar snapshot, aplicar mudança, rollback em erro e invalidar ao concluir. Serializar ações do mesmo NFT para evitar rollback sobre ação posterior | REQ-008 |
| DEC-14 | Assets locais, tokens extraídos do Figma, estados acessíveis reutilizáveis e layouts próprios para mobile quando necessários | REQ-004, REQ-037, REQ-038, REQ-039, REQ-040 |
| DEC-15 | Cenários controlados por configuração/painel de demonstração; testes acionam handlers de controle, nunca setters/cache. Relógio do domínio e latência são controláveis | REQ-031, REQ-044 |

## Decisões visuais confirmadas pelo usuário — 06/10/2026

As decisões abaixo complementam DEC-14 e substituem a espera por informações adicionais do Figma. Estão aceitas como diretrizes. Fonte selecionada e placeholders criados na TASK-02; layouts completos e revisão no browser ainda pendentes.

| ID | Decisão | Execução / verificação | Requisitos |
| --- | --- | --- | --- |
| DEC-16 | Escolher por comparação com os PNGs uma fonte semelhante, de aparência monoespaçada, disponível para uso local. Não depender da identificação da fonte original no Figma. Registrar família, pesos e origem quando escolhidos | TASK-02; revisão em TASK-12 / TEST-14 | REQ-037, REQ-040 |
| DEC-17 | Usar assets placeholders por enquanto. Manter arquivos locais, identidades estáveis e proporções compatíveis com os componentes. Documentar substituições; reavaliar a qualidade visual antes da entrega, sem presumir que placeholders já atendem à fidelidade exigida | TASK-02, TASK-04, TASK-05; revisão em TASK-12 / TEST-14 | REQ-030, REQ-037, REQ-040 |
| DEC-18 | Criar adaptações próprias para tablet e telas mobile sem referência, seguindo a identidade dos PNGs e preservando todos os fluxos. Não aguardar novos frames do Figma | TASK-05, TASK-08, TASK-09, TASK-12 / TEST-14 | REQ-004, REQ-037, REQ-039 |
| DEC-19 | Contratos distinguem username/displayName e slot/nickname/profileName/provider da carteira. ENS e indicação são opcionais; perfil usa a carteira principal como fonte do apelido. Collector guarda esses metadados e observação no snapshot, sem exigir serviços reais de ENS ou indicação | TASK-04; formulários em TASK-06/TASK-09 | REQ-014, REQ-024, REQ-025 |
| DEC-20 | Não exibir badge RARO no card do catálogo: o PNG mobile o mostra, mas não existe requisito formal nem critério/campo no contrato que determine raridade. Perguntar na apresentação se é marcação editorial ou conceito de domínio; reconsiderar se houver regra explícita | TASK-05 / UI-SPEC; pergunta de apresentação | — |

A TASK-01 encerra a análise e a definição da abordagem. Escolher a família concreta, preparar placeholders e implementar layouts continuam trabalho das tarefas acima. Estas decisões não alteram o enunciado nem constituem evidência de conformidade visual.

## Sessão e isolamento — DEC-04

Sessão terá uma geração local que muda em logout/troca de usuário. Ao trocar: bloquear UI privada, abortar requests, desconectar socket privado, liberar listeners, remover queries privadas e dados de tentativa carregados em memória. Resultado iniciado em geração anterior é descartado mesmo se o cancelamento chegar tarde. Autorização também existe nos handlers, não apenas nos guards.

Em 401, preservar o caminho de retorno interno validado e o contexto não sensível da compra vinculado ao usuário anterior. Não persistir senha ou dados completos do formulário de pagamento. Retomar tentativa privada somente se o mesmo usuário autenticar; outro usuário recebe seus próprios recursos. Após login, revalidar cotação. Retorno externo em parâmetro de URL não é permitido.

Verificadores de senha locais são apenas uma simulação; não representam segurança de backend real. Credenciais seed publicadas no README são fictícias; o banco armazena salt/verificador, não os textos dessas senhas.

## Cache e retries — DEC-02, DEC-12, DEC-13

| Recurso | Query key conceitual | Frescor inicial / sincronização |
| --- | --- | --- |
| Catálogo | `['nfts', parâmetrosNormalizados]` | 30 s; abortar ao trocar parâmetros; evento invalida listagens afetadas |
| Detalhe | `['nft', id]` | 30 s; comparar versão REST/evento |
| Sessão | `['session', geração]` | Revalidar no bootstrap e foco; tratar 401 em qualquer request |
| Favoritos/perfil/carteiras | `[recurso, userId]` | 30 s; invalidar após mutation |
| Carrinho | `['cart', identidade]` | staleTime 0; revalidar ao abrir, mutar, reconectar e receber NFT atualizado |
| Cotação | `['quote', identidade, cartVersion, rede, cupom]` | Sem reutilização para autorizar compra; API revalida no envio |
| Pedido | `['order', userId, orderId]` | Revalidar ao abrir/reconectar; polling de 2 s somente enquanto pendente, encerrado em terminal |

GET: uma repetição automática apenas para rede/5xx, com pequeno atraso; 4xx sem retry automático. Mutations sem retry automático; compra oferece recuperação com a mesma chave. Propagar AbortSignal para Axios. Mudanças concorrentes da mesma linha de carrinho são serializadas e usam versão esperada; conflito exige reconsulta.

Invalidar não significa mostrar tela vazia: manter conteúdo existente com feedback discreto de atualização. Skeleton é para carregamento sem conteúdo utilizável. Query keys privadas nunca dependem apenas do nome do recurso.

## Compra — DEC-08, DEC-09, DEC-10

Fluxos de comportamento: [FLOW-01: Compra](docs/FLOWS.md#flow-01-compra) e [FLOW-02: Recuperação de tentativa](docs/FLOWS.md#flow-02-recuperação-de-tentativa). As decisões abaixo descrevem sua implementação.

```text
Carrinho → cotação revisada → envio com chave persistida → pending
                                                        ├→ confirmed
                                                        └→ declined
```

Timeout de rede não é recusa. A UI fica em recuperação até consultar a tentativa existente. A simulação persiste `resolveAt` e resultado programado; ao consultar após refresh/reconexão, avança pedidos vencidos de forma idempotente, sem depender de um timer perdido ao fechar a página.

Cada linha mantém identidade e lotes de quantidade com IDs. A compra captura os lotes comprados. Na confirmação, o domínio remove somente unidades ainda presentes desses lotes; adições posteriores têm outros IDs e sobrevivem. Remoção seguida de nova inclusão cria novos lotes. A baixa e a marcação de efeito aplicado ocorrem na mesma transação. Eventos e recargas não executam uma segunda baixa.

Uma chave é única por usuário e mapeia para fingerprint do payload e resultado persistido. Resolver uma chave existente precede nova validação de estoque, pois sua própria reserva não pode invalidar um reenvio. Conflitos de cotação que não criam pedido também têm resposta associada à tentativa; nova confirmação usa nova chave.

## Tempo real — DEC-11, DEC-12

Contrato em EVT-01 e EVT-02. Atualizar banco antes de emitir. Ignorar versão menor/igual já aplicada; payload REST atrasado também não substitui estado mais novo. Eventos são notificações, REST é a fonte para reconciliação e autorização. Resposta antiga que precise ser descartada gera reconsulta do recurso ativo.

Listeners pertencem a um único provedor por geração de sessão; cleanup deve funcionar também durante remount em desenvolvimento. `order.updated` é privado e validado por usuário/sessão; catálogo pode ter atualização pública. Reconexão revalida sessão primeiro e só então recursos privados.

Limitação da prova do mock: transporte WebSocket, eventos textuais e namespace padrão; comportamento de polling/upgrade não será uma evidência coberta. O binding documenta que não suporta namespaces personalizados, acknowledgements ou anexos binários. O usuário confirmou aprovação do E2E da TASK-03; o agente validou o evento no deploy público. O desafio permite a integração compatível descrita; não permite substituir socket por callbacks na UI.

## Decisões de UX, desvios e limitações

Decisões propostas: informar ajuste no merge de carrinho; bloquear envio durante tentativa pendente/desconectada; mostrar diferença de cotação antes de nova confirmação; manter erro junto do campo e feedback global acessível. Ações fora do escopo devem ser omitidas quando permitido ou explicar indisponibilidade, sem mensagem de sucesso.

Arquivo Figma ainda não inspecionado diretamente. As 15 screenshots foram analisadas em UI-SPEC: paleta raster, composição e campos visíveis registrados; fonte original indisponível, placeholders temporários e layouts sem referência tratados por DEC-16, DEC-17 e DEC-18. Semântica de alguns campos ainda pendente. Ao identificar uma, registrar requisito/UI afetado, motivo, efeito visual/acessível e evidência. Versões, custo real da persistência e compatibilidade do binding ainda dependem da prova técnica.

### Ajustes propostos após análise das screenshots — DEC-14

Login/cadastro preservam rotas dedicadas e retorno interno validado; o formulário atual é uma página em desktop/mobile, e a apresentação modal desktop da proposta visual fica pendente de revisão na TASK-12. Checkout mobile deve oferecer dados/revisão além do frame de carteira. Header privado reflete sessão apesar do botão Entrar presente na referência. Recibo deve indicar simulação em vez de alegar transação real. IDs/imagens/badges inconsistentes entre PNGs serão substituídos por uma fixture coerente. Detalhes de ENS/indicação e da ação central mobile permanecem decisões pendentes, não funcionalidades inferidas.

### Estado da base — TASK-02

Rotas definidas em código com TanStack Router (`src/app/router.ts`), mantendo componentes de página separados. Essa opção evita geração de arquivos nesta base pequena; guards e search params entram junto dos fluxos correspondentes. QueryClient usa retry apenas para falha transitória Axios; nenhuma mutation possui retry automático. Há apenas páginas de indisponibilidade nas rotas ainda não implementadas, sem dados privados ou simulação de sucesso.

DEC-16: IBM Plex Mono selecionada via Fontsource (400/500/600/700), com imports locais no build; fonte instalada na versão 5.3.0 e incluída no build; licença distribuída em public/licenses/ibm-plex-mono-OFL.txt. DEC-17: quatro SVGs abstratos criados em `public/assets/placeholders/`. Inventário e fontes oficiais de referência em `docs/ASSETS.md`.

Tokens raster aplicados em CSS; borda de input proposta mais clara (`#79583E`) para melhorar identificação de controles, mantendo borda decorativa `#3F2319`. Validar contraste real em TASK-12. A home é apenas uma composição inicial, não o catálogo implementado. Componentes Button/Input/Skeleton seguem o padrão shadcn/ui adaptado manualmente; nenhum comando CLI shadcn foi executado. O worker MSW atende uma prova Axios e uma prova Socket.IO está preparada via binding; não existem handlers de domínio ainda. Tipos, lint e build passam; o runner Playwright desta sessão continua bloqueado ao abrir porta local.

### Fundação de domínio — TASK-04

DTOs v1 implementados em `src/contracts/marketplace.ts`; handlers de catálogo/detalhe e controles básicos em `src/mocks/handlers.ts`. Fixtures só são importadas pela camada de mocks. A UI ainda não consulta o catálogo.

DEC-05: IndexedDB `kurio-demo`, store `state`, registro `database`; schema interno 1. Formato incompatível restaura as fixtures, sem migração. Cada operação usa uma transação readwrite sobre o estado inteiro: o reducer é síncrono e seu resultado só é devolvido depois do commit. Isso serializa operações também entre abas. Senhas seed são derivadas com PBKDF2/SHA-256, 100 mil iterações e salt distinto por usuário; o banco guarda salt/verificador. O bootstrap inicializa o banco antes de montar as rotas.

DEC-06/DEC-08/DEC-10: ETH transportado como texto, cálculos em wei/BigInt, desconto em basis points truncado para baixo. Cotação vale 5 minutos do relógio simulado; taxa por rede também é simulada em ETH. Pedidos pendentes reservam estoque, reenvios consultam a tentativa antes de revalidar, conflitos ficam registrados. Confirmação consome estoque e apenas os lotes capturados do carrinho; recusa libera reserva. Alterar o catálogo não altera o snapshot do recibo.

O relógio começa em `2026-01-15T12:00:00Z` e avança explicitamente pelo controle; não há scheduler/eventos de domínio nesta etapa. Esses mecanismos entram nas TASK-10/TASK-11. O núcleo não expõe endpoints privados de compra antes da implementação de sessão/carrinho/checkout. 12 testes do domínio passaram; validação IndexedDB/MSW no browser preparada, ainda pendente.

## Catálogo e detalhe — TASK-05

`src/features/catalog/search.ts` normaliza os parâmetros do Router (defaults seguros, listas únicas/ordenadas, ETH exato e faixa coerente) e serializa os filtros REST como parâmetros repetidos. O estado aplicado reside na URL; busca e preço têm rascunho local até submissão. Mudanças de filtros/ordenação/aba reiniciam a página. A busca é submetida explicitamente, sem debounce ou requisição por tecla.

`api.ts` define consultas Axios com AbortSignal. Chaves `['nfts', 'list', params]`, `['nfts', 'detail', id]` e `['nfts', 'facets']` separam os resultados. A troca de filtros mostra skeleton se não há cache correspondente; não apresenta a lista anterior como resultado do novo filtro. Mantém política global de 30 segundos e uma repetição para falhas transitórias; refetch em background informa atualização. Cancelamento e isolamento por chave impedem respostas antigas de substituir a pesquisa atual. Eventos/invalidação de mutations entram nas tarefas seguintes.

Facetas são derivadas pelo MSW do catálogo, nunca importadas das fixtures pelos componentes. Mobile/tablet usa `<dialog>` modal nativo com foco contido, Escape e retorno ao botão; desktop usa sidebar a partir de 1024 px. As mesmas opções ficam na URL. Galeria mantém seleção local; troca de NFT reinicia seleção e quantidade, que fica limitada à disponibilidade da edição atual. Compra/favorito estão desabilitados com explicação até integrar as operações.

Home compõe as seções pós-catálogo em `src/features/home/home-editorial.tsx`: dois banners encaminham para abas existentes, e quatro teasers editoriais usam placeholders sem simular páginas de artigo. `src/features/home/nft-spotlight.tsx` consulta um NFT pela API para preencher o destaque abaixo dos filtros. O footer compartilhado vive em `src/components/layout/site-footer.tsx`, com navegação para destinos existentes, links editoriais inativos quando não há rota, ícones sociais sem URLs fictícias e newsletter que explica a indisponibilidade em vez de confirmar uma inscrição falsa. Avaliações mostram apenas agregados presentes no contrato. No detalhe, o compartilhamento segue os três canais ilustrados no Figma: links de intenção para LinkedIn/Twitter e link `mailto:` para email, todos usando a URL atual do NFT. A composição pós-catálogo e o footer precisam de revisão visual na TASK-12; nenhuma fidelidade pixel a pixel foi comprovada.

### Detalhe mobile — UI-02 / TASK-05

Na rota `/nfts/:nftId`, o mobile esconde o header global e a navegação inferior do shell. O detalhe tem controles próprios de voltar/favoritar no topo e uma barra fixa inferior com quantidade, preço, compra e carrinho; o conteúdo reserva espaço para não ficar encoberto e respeita a safe area. Compra/adicionar ao carrinho continuam pendentes da TASK-07. A screenshot mostra a barra junto ao rodapé; fixidez durante rolagem foi adotada como interpretação e precisa de validação no browser.

### Sessão e favoritos — TASK-06 (em andamento)

O token opaco fica em `sessionStorage`; `GET /auth/session` recupera o perfil no bootstrap e em navegações para rotas protegidas. `features/auth` cuida de cadastro/login/logout e fornece a consulta de sessão; `features/favorites` contém a API e os componentes de favoritos e depende da consulta de sessão. Ambas as features passam pelo Axios e handlers MSW, com autorização verificada no banco IndexedDB por token e usuário — nunca por `userId` enviado pelo cliente. Perfil, carteiras, checkout e pedidos têm guard; retorno após autenticação só aceita caminho interno.

Query de favoritos é isolada por `userId`. A mutation captura o snapshot anterior, altera a lista visível imediatamente, restaura o snapshot no erro e invalida a query ao concluir. Logout cancela consultas e limpa o cache; login limpa cache antes de estabelecer a nova identidade. TEST-03/04 foi escrito, mas o runner desta sandbox não iniciou por `listen EPERM`; isolamento de respostas antigas e expiração determinística ainda aguardam controles da TASK-11.

Comportamento percebido pelo usuário: [FLOW-03 (cadastro, login, sessão e logout)](docs/FLOWS.md#flow-03-cadastro-login-sessão-e-logout) e [FLOW-04 (favoritos)](docs/FLOWS.md#flow-04-consultar-e-alternar-favoritos).

### Revisão UI-01 — filtro de preço

O filtro de preço usa uma faixa de dois controles nativos compartilhando a mesma trilha, conforme a screenshot desktop. Mostra mínimo/máximo e mantém o botão Aplicar: arrastar/usar teclado altera apenas o rascunho, aplicar envia decimais ETH à URL/API e reinicia a página. Limite superior deriva de API-03/facetas, sem copiar valores ilustrativos do PNG. Limites presentes na URL são preservados, inclusive acima do máximo atual e com até 18 casas; o domínio do slider se expande para representá-los. Há 1000 intervalos entre zero e o limite, convertidos com BigInt; não há cálculo financeiro com ponto flutuante. Os controles não cruzam e possuem nomes, valores ETH acessíveis, foco visível e áreas de interação de 44 px. Revisão no navegador ainda pendente.

### Revisão UI-01 — busca pelo header

A barra permanente acima do catálogo foi removida conforme revisão solicitada. `HeaderSearch` disponibiliza lupa no header e diálogo modal nativo com formulário, foco inicial na busca, Escape, fechamento explícito e retorno de foco. Ao abrir, carrega o termo aplicado na URL; fechar sem enviar descarta o rascunho. Submeter na home preserva filtros/ordenação e reinicia a página; fora da home, abre o catálogo com defaults e o termo informado. A busca continua passando por Router→Query→Axios→MSW, sem alterar contratos. O diálogo é uma decisão de interação para a lupa da referência, que não mostra seu estado aberto. A mesma ação está disponível em mobile; revisão visual pendente.

### Revisão UI-01 — grupos de filtros

A interface oferece apenas Coleções, Faixa de preço e Rede. Apesar do título Coleções, os itens mostrados no PNG são categorias de arte; portanto esse grupo envia `category` à API (Arte digital, Fotografia, Generativa na fixture atual). Os nomes reais de coleções, como Cosmic Shapes, continuam no detalhe/recomendações. `collection`, `creator` e `availableOnly` continuam aceitos por URL/API, mas não têm controles nesta sidebar. Remover controles não altera os parâmetros aplicados ao trocar outro filtro; Limpar filtros restaura todos ao padrão, inclusive os adicionais. Seleções múltiplas mantêm OR dentro do grupo e AND entre grupos conforme API-03.

### Revisão UI-01 — aparência e contagens dos filtros

Coleções e Rede usam botões de alternância sem borda/fundo ou checkbox visível. `aria-pressed` expressa seleção múltipla, Enter/Espaço alternam e a contagem é descrição acessível. Tokens `text-muted-foreground` (`#CFB28C`) e `text-accent` (`#E89B55`) reproduzem as cores solicitadas; semibold também diferencia a seleção visualmente. O DTO compartilhado `CatalogFacets` inclui contagens calculadas no MSW, com um NFT por categoria/rede, independentemente das edições, filtros ou página. As contagens representam o inventário completo, não o resultado de uma combinação atual. Uma opção da URL ausente do catálogo aparece com zero e pode ser desmarcada.

### Homepage mobile — TASK-05 / DEC-18

A homepage mobile usa uma composição própria: o header desktop some apenas na raiz mobile e dá lugar à busca acionável/filtros dentro da página. Um hero curto usa SVGs placeholder sobrepostos e tratamento decorativo local. A ordenação fica fora do frame mobile; tabs e filtros seguem aplicáveis por URL. Cards em duas colunas alternam deslocamento; não mostram badge RARO porque não há regra formal que classifique a raridade. Coração no card leva à autenticação quando a feature estiver ligada; nesta etapa aparece desabilitado para não aparentar sucesso. A barra inferior da home tem cinco posições; a ação central é visualmente representada e desabilitada, sem atribuir-lhe função que o Figma não documenta. Desktop mantém seu header/hero próprios. Conferir composição e overflow em 390 px, além de 414, antes de aceitar a fidelidade.


#### Badge “Raro” no protótipo — DEC-20

A screenshot mobile inclui RARO, mas o desafio não exige essa marca, e os DTOs/fixtures não definem uma classificação de raridade. Removemos o badge dos cards para não converter uma indicação visual isolada em regra de produto com critério inventado. Pergunta sugerida para a apresentação: “O selo RARO do protótipo é apenas editorial ou deveria corresponder a uma regra de raridade no domínio/API? Qual seria essa regra?” A screenshot e o registro da ausência no enunciado são evidência da dúvida, não evidência de uma regra implementada.
