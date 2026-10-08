# Contratos REST e eventos

Status: **DTOs v1 e núcleo de domínio implementados na TASK-04; endpoints de catálogo, autenticação e favoritos estão em implementação na TASK-06; demais fluxos ainda planejados**. IDs estáveis; alterar schemas de forma coordenada entre handlers, serviços e testes. Origem: [requisitos](../REQUIREMENTS.md), decisões [DEC-03 a DEC-13](../ARCHITECTURE.md).

## Campos identificados nas screenshots — DEC-19

Modelos v1 em `src/contracts/marketplace.ts` cobrem rede, abas Novos/Em alta, ordenação recente, token, atributos e rating. Perfil distingue `username` de `displayName`; carteira distingue `slot`, `nickname`, `profileName` e `provider`. ENS e indicação são metadados opcionais (`null`), sem consulta externa. A observação do checkout pertence ao snapshot do colecionador; confirmação de senha é apenas campo de formulário. Nome/apelido da carteira no perfil deve vir da carteira principal, sem duplicar essa informação no perfil (DEC-19).

## Implementação da TASK-04

- API-03: `GET /api/nfts` e `GET /api/nfts/:id` implementados via MSW e IndexedDB.
- API-13: `GET /api/__mock/status`, `POST /api/__mock/reset` e `POST /api/__mock/clock` implementados. Somente SCN-01 e seed 1 são aceitos nesta etapa.
- API-01/API-02/API-04: cadastro, sessão e favoritos estão ligados aos handlers MSW; verificar a cobertura E2E antes de considerar TEST-03/TEST-04 aprovados.
- API-08/API-09: funções de cotação, reserva, idempotência e resolução existem em `src/mocks/commerce.ts`. Seus endpoints privados serão conectados nas tarefas de carrinho/checkout; não há compra exposta pela API nesta etapa.
- API-05/API-06/API-07/API-10/API-11/API-12 e eventos de domínio: contratos preparados; handlers/fluxos ainda pendentes.

## Convenções

Base `/api`; JSON, exceto upload de avatar. IDs opacos em string, datas ISO UTC, versões inteiras crescentes por recurso. ETH como string decimal não negativa, até 18 casas; quantidade inteira positiva. Respostas abaixo são corpos diretos. Listas usam `{ items, page, pageSize, total }` quando paginadas.

Autenticação proposta: `Authorization: Bearer <token-ficticio>`. Visitante usa `X-Guest-Id` para seu carrinho; identidade autenticada prevalece. Handlers não aceitam `userId` do corpo como autorização. Recursos de outro usuário retornam 403; sessão ausente/expirada retorna 401. `expectedVersion` nas edições evita sobrescrever estado concorrente.

Schemas oficiais no código: [`src/contracts/marketplace.ts`](../src/contracts/marketplace.ts). O arquivo exporta `Money`, `Network`, `ApiError`, `Page`, `Nft`, `Edition`, `CatalogParams`, `Profile`, `Session`, `LoginInput`, `RegisterInput`, `AuthResponse`, `Favorites`, `Wallet`, `Collector`, `CartLine`, `Cart`, `Totals`, `Quote`, `OrderInput`, `Order` e os envelopes `NftUpdated`/`OrderUpdated`.

`Profile` usa `username`, `displayName`, `email`, `ensName` e `avatarUrl`; `Wallet` acrescenta `nickname`, `profileName`, `provider`, `ensName` e `referralCode`. `Collector` captura `displayName`, `username`, `email`, `profileName`, `ensName`, `referralCode` e `note`. Carteira e rede da compra são capturadas separadamente no snapshot do pedido.

`available` no snapshot é informativo da hora da compra; não se atualiza depois. O recibo exibe valores do snapshot e a transação somente quando confirmado. Lotes de carrinho, reservas e verificadores de senha são internos ao mock e não trafegam na UI.

## Endpoints

`Privado` exige sessão. Cada ID abaixo cobre o recurso e suas operações relacionadas.

| ID | Operação | Entrada → sucesso | Erros principais | Requisitos |
| --- | --- | --- | --- | --- |
| API-01 | `POST /auth/register` | `{username,displayName,email,password}` → 200 `{token,session:Session}` e início da sessão | 422 campos, 409 conta existente | REQ-021, REQ-024 |
| API-02 | `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` | Login → `{token,session:Session}`; consulta → `{user:Profile}`; logout → `{loggedOut:true}` | 401 credenciais/sessão expirada | REQ-021, REQ-022, REQ-023 |
| API-03 | `GET /nfts`, `GET /nfts/:id` | Lista parametrizada → 200 página de Nft; detalhe → 200 Nft | 422 parâmetros, 404 detalhe | REQ-005, REQ-006, REQ-007 |
| API-04 | `GET /me/favorites`, `PUT /me/favorites/:nftId` (privado) | Consulta → `{userId,nftIds:string[]}`; PUT `{favorite:boolean}` → mesmo formato; seleção explícita idempotente | 401, 404, 503 transitório | REQ-008 |
| API-05 | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` | Consulta → Cart; adição `{nftId,editionId,quantity,expectedVersion}`; edição `{quantity,expectedVersion}`; remoção com `If-Match` da versão → 200 Cart | 404, 409 estoque/versão, 422 quantidade | REQ-009, REQ-010, REQ-011, REQ-013 |
| API-06 | `POST /cart/merge` (privado) | `{guestId,guestVersion}` → 200 Cart com notices; repetir origem consumida não duplica | 409 revisão divergente, 401 | REQ-010, REQ-023 |
| API-07 | `PUT /cart/coupon`, `DELETE /cart/coupon` | PUT `{code,expectedVersion}`; DELETE com `If-Match` → 200 Cart | 422 `COUPON_INVALID`/`COUPON_EXPIRED`, 409 versão | REQ-011 |
| API-08 | `POST /quotes` (privado) | `{cartVersion,network}` → 201 Quote; valida carrinho, cupom, estoque e taxas | 409 `CART_CHANGED`/`STOCK_CONFLICT`, 422 cupom/rede | REQ-012, REQ-014, REQ-015 |
| API-09 | `POST /orders`, `GET /orders/:id`, `GET /order-attempts/:key` (privado) | POST OrderInput + `Idempotency-Key` → 201 Order na criação / 200 Order em replay; GET pedido → 200 Order; tentativa → 200 `{order:Order}` ou resultado de conflito previamente registrado | 401, 403, 404 tentativa/pedido, 409 cotação/idempotência/estoque | REQ-016, REQ-017, REQ-018, REQ-019, REQ-020 |
| API-10 | `GET /profile`, `PATCH /profile`, `PUT/DELETE /profile/avatar`, `PUT /profile/password` (privado) | GET/PATCH → `Profile`; PATCH `{username,displayName,email,ensName,expectedVersion}`; avatar multipart `file,expectedVersion` → perfil; DELETE avatar com `If-Match` → perfil; senha `{currentPassword,newPassword}` → 204 | 422 campos/arquivo/senha, 409 email/versão | REQ-024 |
| API-11 | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id` (privado) | GET → `{items:Wallet[]}`; POST `{slot,nickname,profileName,address,network,provider,ensName,referralCode}` → 201 Wallet; PATCH mesmos campos + expectedVersion → 200 Wallet | 422 endereço/rede, 409 slot/endereço/versão, 403 | REQ-014, REQ-024 |
| API-12 | `POST /wallet-connections`, `DELETE /wallet-connections/:id` (privado) | POST `{walletId,network}` → 201 `{id,status:'connected',walletId,network}`; DELETE → 204 | 409 `CONNECTION_REJECTED`/`NETWORK_MISMATCH`; checkout rejeita conexão encerrada | REQ-014 |
| API-13 | Controles `/api/__mock/*`, fora da API de produto | Reset e relógio; `POST /favorite-network` define falhas one-shot de favoritos e `POST /catalog-network` controla latência/falhas do catálogo | 422 configuração inválida | REQ-030, REQ-031, REQ-044 |

## Parâmetros, validações e erros

API-03: `q`, `category`, `collection`, `creator`, `network`, `minPrice`, `maxPrice`, `availableOnly`, `tab`, `sort`, `page`, `pageSize`. Filtros múltiplos de mesma dimensão usam parâmetros repetidos; dimensões diferentes combinam por AND. Redes: `ethereum`, `polygon`, `solana`. Abas: `all`, `new` (criação nos últimos 7 dias do relógio simulado), `trending` (flag da fixture). Ordenação: `featured`, `recent`, `price-asc`, `price-desc`, `name`; preço de referência é o menor preço das edições disponíveis, ou menor preço da edição se todas esgotadas. Desempate por ID. Padrão página 1, tamanho 12, máximo 48. Preço, rede e abas foram mapeados conforme UI-SPEC; os controles de URL/interface estão implementados na TASK-05; validação E2E local pendente.

Entrada inválida na URL é normalizada pelo router; entrada inválida direta na API retorna 422. Alterar busca/filtros/ordenação reinicia página. O cliente deve enviar parâmetros normalizados equivalentes aos exibidos.

Validações propostas do projeto: nome não vazio, email válido/único normalizado, senha com mínimo de 8 caracteres, confirmação de senha na UI, endereço simulado no formato da rede, slots primary/secondary únicos por usuário. Avatar PNG/JPEG/WebP até 2 MB, persistido como blob; revogar object URLs antigos. Ajustar campos conforme Figma e registrar DEC-14; limites são decisões locais, não exigências textuais do desafio.

Erros padrão: 400 requisição malformada; 401 `SESSION_INVALID`/`SESSION_EXPIRED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`, `STOCK_CONFLICT`, `QUOTE_CHANGED`, `IDEMPOTENCY_CONFLICT`; 422 `VALIDATION_ERROR`; 503 `TRANSIENT_FAILURE`. Falha de rede não tem status HTTP. Timeout no cliente não informa se houve commit no mock.

## Idempotência e cotação — API-08, API-09

Comportamento esperado: [FLOW-01: Compra](FLOWS.md#flow-01-compra) e [FLOW-02: Recuperação de tentativa](FLOWS.md#flow-02-recuperação-de-tentativa). Esta seção detalha o contrato técnico usado nesses fluxos.

1. Criar cotação de validade proposta de 5 minutos, com versão do carrinho, preços/estoque/cupom/taxas atuais e rede.
2. Após revisão, persistir chave e OrderInput por usuário antes de POST. Desabilitar cliques enquanto resolve a tentativa.
3. No handler, verificar sessão e registro da chave. Mesmo conteúdo retorna resultado anterior; diferente retorna 409 `IDEMPOTENCY_CONFLICT`.
4. Para chave nova, revalidar tudo atomicamente, inclusive conexão/carteira. Cotação alterada retorna 409 `QUOTE_CHANGED` com `details.quote`, sem criar pedido. Edição esgotada retorna `STOCK_CONFLICT` para correção de itens.
5. Cotação válida cria pedido pending e reserva estoque na mesma transação do registro de idempotência. SCN-11 atrasa somente a resposta, depois desse commit.
6. Consultar tentativa ou reenviar payload idêntico após timeout. Se consulta retornar 404, reenvio usa a mesma chave, pois o request original ainda pode estar em andamento.
7. Confirmar baixa estoque/carrinho uma vez; recusar libera reserva e preserva carrinho. Mudanças de disponibilidade decorrentes emitem EVT-01; resultado emite EVT-02.

## Eventos

Envelope proposto: `{eventId, resourceId, version, occurredAt, data}`. Eventos privados acrescentam `userId` e `sessionId`. Versão refere-se ao recurso, não ao evento global. O cliente confere identidade e geração de sessão antes de aplicar.

| ID | Nome e payload `data` | Ação do cliente | Requisitos |
| --- | --- | --- | --- |
| EVT-01 | `nft.updated`: `{nft:Nft}` | Comparar versão; atualizar detalhe, reconsultar listagens afetadas, invalidar carrinho/cotação; anunciar mudança relevante | REQ-013, REQ-015, REQ-034, REQ-035 |
| EVT-02 | `order.updated`: `{order:Order}`; privado | Comparar identidade/versão; atualizar pedido; reconsultar carrinho no confirmado; nunca executar baixa local nem regredir terminal | REQ-017, REQ-018, REQ-019, REQ-023, REQ-034, REQ-035 |

Após desconexão/reconexão, buscar REST mesmo sem evento. Listeners antigos são liberados. Reemissão duplicada mantém eventId/versão; teste de evento antigo usa versão inferior e payload antigo sem reverter o banco. Transporte de DEC-11 validado na TASK-03; publicação dos eventos de domínio permanece na TASK-10.

### Complementos API-03/API-13 — TASK-05

`GET /api/nfts/facets` retorna `{ category: string[], collection: string[], creator: string[], network: string[], counts: { category: Record<string, number>, network: Record<string, number> }, priceRange: { min: Money, max: Money } }`: valores únicos ordenados do catálogo inteiro, independentes dos filtros atuais, para permitir combinar seleções sem esconder opções. As contagens são totais de NFTs do catálogo inteiro por categoria/rede, independentes dos filtros e da paginação; cada NFT conta uma vez, mesmo com várias edições ou esgotado. Os valores não vêm do PNG. O limite de preço parte de zero e chega ao maior preço de edição do catálogo (decimal ETH exato). É um endpoint auxiliar, sem dados privados.

`POST /api/__mock/catalog-network` aceita `{ delayMs?: number, failuresRemaining?: number }` (defaults zero; inteiros 0–10000 e 0–10). Configura latência das próximas listagens e quantas delas retornam 503. Cada requisição captura a configuração ao chegar; permite reproduzir respostas fora de ordem. Reset restaura ambos a zero. Configuração transitória por aba/worker, não persiste após refresh; cenários completos/painel seguem na TASK-11. Não afeta detalhe/facetas. Valores inválidos retornam 422.
