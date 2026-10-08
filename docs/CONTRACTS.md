# Contratos REST e eventos

Referência dos contratos implementados na simulação local. Os IDs API-01 a API-14 e EVT-01/EVT-02 conectam esta referência aos [requisitos](../REQUIREMENTS.md), [fluxos](FLOWS.md) e [decisões de arquitetura](../ARCHITECTURE.md). Os DTOs estão em [`marketplace.ts`](../src/contracts/marketplace.ts) e as rotas em [`handlers.ts`](../src/mocks/handlers.ts).

Para avaliar a compra, comece por API-05 a API-09 e pela seção de idempotência. Para avaliar isolamento de usuário e atualização de estado, consulte as convenções e os eventos. Os controles `__mock` permitem reproduzir falhas sem alterar a API de produto.

**Estado atual:** REST implementado nas TASK-04 a TASK-09D; eventos e reconciliação após reconexão implementados nas TASK-10A a TASK-10D; recuperação idempotente de resposta ambígua implementada na TASK-10E. Execuções E2E desktop/mobile foram confirmadas pelo usuário para esses fluxos e para a expiração de sessão (TASK-11A). Isso não equivale à cobertura de todas as variantes de SCN; consulte [SCENARIOS.md](SCENARIOS.md) e a [matriz de testes](TEST-MATRIX.md).

## Campos identificados nas screenshots — DEC-19

Modelos v1 em `src/contracts/marketplace.ts` cobrem rede, abas Novos/Em alta, ordenação recente, token, atributos e rating. Perfil distingue `username` de `displayName`; carteira distingue `slot`, `nickname`, `profileName` e `provider`. ENS e indicação são metadados opcionais (`null`), sem consulta externa. A observação do checkout pertence ao snapshot do colecionador; confirmação de senha é apenas campo de formulário. Nome/apelido da carteira no perfil deve vir da carteira principal, sem duplicar essa informação no perfil (DEC-19).

## Escopo da simulação

- API-03: `GET /api/nfts` e `GET /api/nfts/:id` implementados via MSW e IndexedDB.
- API-13: `GET /api/__mock/status`, `POST /api/__mock/reset` e `POST /api/__mock/clock` implementados. Controles adicionais de catálogo/favoritos/pagamento estão em API-13/API-14 conforme descrito abaixo. Somente SCN-01 e seed 1 são aceitos nesta etapa.
- API-01/API-02/API-04: cadastro, sessão e favoritos estão ligados aos handlers MSW; verificar a cobertura E2E antes de considerar TEST-03/TEST-04 aprovados.
- API-05/API-06/API-07: carrinho e cupons estão ligados aos handlers MSW/IndexedDB; visitante é identificado por `X-Guest-Id`, autenticado pelo bearer token. Merge consome a versão de origem uma vez e devolve avisos para estoque/cupom não transferidos.
- API-08/API-09/API-12: cotação, conexão simulada, pedido idempotente, recuperação e telas de checkout/recibo implementados na TASK-08.
- API-10 GET/PATCH, avatar e alteração de senha implementados nas TASK-09A/B/C. API-11 GET/POST/PATCH de carteiras e integração ao checkout implementados e aprovados na TASK-09D.
- Eventos de domínio são publicados após a confirmação da transação IndexedDB e consumidos com verificações de versão e identidade. Os limites de transporte e reconciliação estão descritos ao final deste documento.

## Convenções

Base `/api`; JSON, exceto upload de avatar. IDs opacos em string, datas ISO UTC, versões inteiras crescentes por recurso. ETH como string decimal não negativa, até 18 casas; quantidade inteira positiva. Respostas abaixo são corpos diretos. Listas usam `{ items, page, pageSize, total }` quando paginadas.

Autenticação: `Authorization: Bearer <token-da-simulacao>`. Visitante usa `X-Guest-Id` para seu carrinho; identidade autenticada prevalece. Handlers não aceitam `userId` do corpo como autorização. Sessão ausente/expirada retorna 401. Pedido, cotação e conexão com carteira alheia retornam 403; busca de carteira para edição e remoção de conexão fora da conta retornam 404. `expectedVersion` nas edições e `If-Match` nas remoções versionadas evitam sobrescrever estado concorrente.

Todas as redes usam valores em ETH para esta demonstração. Carteiras, pagamentos e referências de transação são simulados; os contratos não representam integração com blockchain ou prova de posse de endereço.

Schemas oficiais no código: [`src/contracts/marketplace.ts`](../src/contracts/marketplace.ts). O arquivo exporta `Money`, `Network`, `ApiError`, `Page`, `Nft`, `Edition`, `CatalogParams`, `Profile`, `Session`, `LoginInput`, `RegisterInput`, `AuthResponse`, `Favorites`, `Wallet`, `Collector`, `CartLine`, `Cart`, `Totals`, `Quote`, `OrderInput`, `Order` e os envelopes `NftUpdated`/`OrderUpdated`.

`Profile` usa `username`, `displayName`, `email`, `ensName` e `avatarUrl`; `Wallet` acrescenta `nickname`, `profileName`, `provider`, `ensName` e `referralCode`. `Collector` captura `displayName`, `username`, `email`, `profileName`, `ensName`, `referralCode` e `note`. Carteira e rede da compra são capturadas separadamente no snapshot do pedido.

`available` no snapshot é informativo da hora da compra; não se atualiza depois. O recibo exibe valores do snapshot e a transação somente quando confirmado. Lotes de carrinho, reservas e verificadores de senha são internos ao mock e não trafegam na UI.

## Endpoints

`Privado` exige sessão. Cada ID abaixo cobre o recurso e suas operações relacionadas.

| ID | Operação | Entrada → sucesso | Erros principais | Requisitos |
| --- | --- | --- | --- | --- |
| API-01 | `POST /auth/register` | `{username,displayName,email,password}` → 200 `{token,session:Session}` e início da sessão | 422 campos, 409 conta existente | REQ-021, REQ-024 |
| API-02 | `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` | Login `{email,password}` → `{token,session:Session}`; consulta → `Session {id,user:Profile,expiresAt}`; logout → `{loggedOut:true}` | 401 credenciais/sessão expirada | REQ-021, REQ-022, REQ-023 |
| API-03 | `GET /nfts`, `GET /nfts/:id`, `GET /nfts/facets` | Lista parametrizada → 200 `Page<Nft>`; detalhe → 200 `Nft`; facetas → 200 `CatalogFacets` | 422 parâmetros, 404 detalhe, 503 falha configurada da listagem | REQ-005, REQ-006, REQ-007 |
| API-04 | `GET /me/favorites`, `PUT /me/favorites/:nftId` (privado) | Consulta → `{userId,nftIds:string[]}`; PUT `{favorite:boolean}` → mesmo formato; seleção explícita idempotente | 401, 404, 503 transitório | REQ-008 |
| API-05 | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` | Consulta → Cart; cada `CartLine` informa sua `network`; Cart traz `networkTotals` e `totals` agregados por rede presente; adição `{nftId,editionId,quantity,expectedVersion}`; edição `{quantity,expectedVersion}`; remoção com `If-Match` da versão → 200 Cart | 404, 409 estoque/versão, 422 quantidade | REQ-009, REQ-010, REQ-011, REQ-013 |
| API-06 | `POST /cart/merge` (privado) | `{guestId,guestVersion}` → 200 Cart com notices; repetir origem consumida não duplica | 409 revisão divergente, 401 | REQ-010, REQ-023 |
| API-07 | `PUT /cart/coupon`, `DELETE /cart/coupon` | PUT `{code,expectedVersion}`; DELETE com `If-Match` → 200 Cart | 422 `COUPON_INVALID`/`COUPON_EXPIRED`, 409 versão | REQ-011 |
| API-08 | `POST /quotes` (privado) | `{cartVersion,network}` → 200 Quote com apenas os itens do carrinho naquela rede; valida versão global, cupom, estoque e taxa da rede selecionada. Se não houver itens na rede, retorna 422 | 409 `CART_CHANGED`/`STOCK_CONFLICT`, 422 cupom/rede/itens ausentes | REQ-012, REQ-014, REQ-015 |
| API-09 | `POST /orders`, `GET /orders/:id`, `GET /order-attempts/:key` (privado) | POST OrderInput + `Idempotency-Key` → 201 Order na criação / 200 Order em replay; GET pedido → 200 Order; tentativa → 200 `{order:Order}` ou resultado de conflito previamente registrado | 401, 403, 404 tentativa/pedido, 409 cotação/idempotência/estoque | REQ-016, REQ-017, REQ-018, REQ-019, REQ-020 |
| API-10 | `GET /profile`, `PATCH /profile`, `PUT/DELETE /profile/avatar`, `PUT /profile/password` (privado) | GET/PATCH → `Profile`; PATCH `{username,displayName,email,ensName,expectedVersion}`; avatar multipart `file,expectedVersion` → perfil; DELETE avatar com `If-Match` → perfil; senha `{currentPassword,newPassword}` → 204 | Upload aceita PNG/JPEG/WebP até 2 MiB e verifica assinatura do conteúdo. Senha atual validada; senha nova exige 8+ caracteres e deve ser diferente; troca salt/verificador sem texto claro. 422 campos/arquivo/senha, 409 versão/senha alterada concorrentemente | REQ-024 |
| API-11 | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id` (privado) | GET → `{items:Wallet[]}`; POST `{slot,profileName,address,network,provider,ensName,referralCode}` → 201 `Wallet`; PATCH os campos editáveis + `expectedVersion` → 200 `Wallet`. O slot e nickname não mudam após cadastro; cada slot é único por conta | 422 validação/campos; 409 slot, endereço duplicado na mesma rede ou versão obsoleta; 404 carteira ausente; 401 sessão | REQ-014, REQ-024 |
| API-12 | `POST /wallet-connections`, `DELETE /wallet-connections/:id` (privado) | POST `{walletId,network,provider}` → conexão com `status:'connected'`; DELETE → `{disconnected:true}`. Conexão simulada; POST retorna 200 atualmente | 403 carteira fora da conta, 404 conexão ausente/alheia, 409 `NETWORK_MISMATCH`; pedido revalida conexão | REQ-014 |
| API-13 | `GET /__mock/status`; `POST /__mock/reset`, `/__mock/clock`, `/__mock/catalog-network`, `/__mock/detail-network`, `/__mock/cart-network`, `/__mock/favorite-network` | Reset/relógio e parâmetros de latência/falha do catálogo, detalhe, carrinho e favoritos; detalhes abaixo | 422 configuração inválida | REQ-030, REQ-031, REQ-044 |
| API-14 | `POST /__mock/payment`, controle fora da API de produto | `{outcome:'confirmed'|'declined',delayMs:0..10000,loseResponseOnce?:boolean}` configura o resultado/tempo do pagamento e pode simular uma resposta ambígua depois de o pedido ser persistido | 422 configuração inválida | REQ-030, REQ-031, REQ-036 |

## Parâmetros, validações e erros

API-03: `q`, `category`, `collection`, `creator`, `network`, `minPrice`, `maxPrice`, `availableOnly`, `tab`, `sort`, `page`, `pageSize`. Filtros múltiplos de mesma dimensão usam parâmetros repetidos e combinam por OR; dimensões diferentes combinam por AND. Redes: `ethereum`, `polygon`, `solana`. Abas: `all`, `new` (criação nos últimos 7 dias do relógio simulado), `trending` (flag da fixture). Ordenação: `featured`, `recent`, `price-asc`, `price-desc`, `name`; preço de referência é o menor preço das edições disponíveis, ou menor preço da edição se todas esgotadas. Desempate por ID. Padrão página 1, tamanho 12, máximo 48.

Exemplo de seleção de duas redes: `GET /api/nfts?network=ethereum&network=polygon&sort=price-asc&page=1&pageSize=12`.

Entrada inválida na URL é normalizada pelo router; entrada inválida direta na API retorna 422. Alterar busca/filtros/ordenação reinicia página. O cliente deve enviar parâmetros normalizados equivalentes aos exibidos.

Validações implementadas: nome não vazio, email válido/único normalizado, senha com mínimo de 8 caracteres, confirmação de senha na UI, endereço simulado no formato da rede, slots `primary`/`secondary` únicos por usuário. Avatar PNG/JPEG/WebP até 2 MiB, validado por tipo declarado e assinatura, persistido como data URL no perfil no IndexedDB. Perfil e senha têm operações independentes (DEC-30). Os limites de avatar e os dois slots de carteira são decisões locais, não exigências textuais do desafio.

O envelope de erro é `{error:{code,message,fieldErrors?,details?}}`; `fieldErrors` mapeia nomes de campo para listas de mensagens. Principais códigos implementados:

| Status | Exemplos de códigos | Interpretação |
| --- | --- | --- |
| 400 | `MALFORMED_REQUEST`, `VERSION_REQUIRED` | Corpo malformado ou versão obrigatória ausente/inválida |
| 401 | `INVALID_CREDENTIALS`, `SESSION_INVALID` | Credenciais incorretas ou sessão ausente/expirada |
| 403 / 404 | `FORBIDDEN` / `NOT_FOUND` | Recurso fora da conta ou não encontrado, conforme a operação |
| 409 | `VERSION_CONFLICT`, `CART_CHANGED`, `STOCK_CONFLICT`, `QUOTE_CHANGED`, `IDEMPOTENCY_CONFLICT` | Estado mudou; corrigir ou revisar antes de uma nova tentativa |
| 409 | `ACCOUNT_EXISTS`, `WALLET_SLOT_EXISTS`, `WALLET_ADDRESS_EXISTS`, `NETWORK_MISMATCH`, `PASSWORD_CHANGED` | Conflito de cadastro, rede ou alteração concorrente de senha |
| 422 | `VALIDATION_ERROR`, `COUPON_INVALID`, `COUPON_EXPIRED`, `CURRENT_PASSWORD_INVALID`, `AVATAR_REQUIRED`, `AVATAR_TYPE_INVALID`, `AVATAR_SIZE_INVALID` | Dados que precisam de correção |
| 503 | `TEMPORARY_FAILURE` (catálogo), `TRANSIENT_FAILURE` (favoritos) | Falha transitória configurada no mock |

Falha de rede não tem status HTTP. Timeout no cliente não informa se houve commit no mock; a recuperação usa a chave de idempotência.

## Idempotência e cotação — API-08, API-09

Comportamento esperado: [FLOW-01: Compra](FLOWS.md#flow-01-compra) e [FLOW-02: Recuperação de tentativa](FLOWS.md#flow-02-recuperação-de-tentativa). Esta seção detalha o contrato técnico usado nesses fluxos.

1. Criar cotação com validade de 5 minutos no relógio simulado, com versão do carrinho, preços/estoque/cupom/taxas atuais e rede.
2. Após revisão, persistir chave e OrderInput por usuário antes de POST. Desabilitar cliques enquanto resolve a tentativa.
3. No handler, verificar sessão e registro da chave. Mesmo conteúdo retorna resultado anterior; diferente retorna 409 `IDEMPOTENCY_CONFLICT`.
4. Para chave nova, revalidar tudo atomicamente, inclusive conexão/carteira. Cotação alterada retorna 409 `QUOTE_CHANGED` com `details.quote`, sem criar pedido. Edição esgotada retorna `STOCK_CONFLICT` para correção de itens.
5. Cotação válida cria pedido `pending` e reserva estoque na mesma transação do registro de idempotência. `loseResponseOnce` pode devolver 504 `RESPONSE_UNKNOWN` depois do commit para simular uma resposta ambígua; não simula um timeout HTTP real por atraso de resposta.
6. Consultar tentativa ou reenviar payload idêntico após timeout. Se consulta retornar 404, reenvio usa a mesma chave, pois o request original ainda pode estar em andamento.
7. Confirmar baixa estoque/carrinho uma vez; recusar libera reserva e preserva carrinho. Mudanças de disponibilidade decorrentes emitem EVT-01; resultado emite EVT-02.

## Eventos

Envelope implementado: `{eventId, resourceId, version, occurredAt, data}`. Eventos privados acrescentam `userId` e `sessionId`. Versão refere-se ao recurso, não ao evento global. O cliente valida o envelope, ignora IDs já vistos e versões antigas; para pedidos, confere também usuário e sessão autenticada. O conjunto de IDs vistos mantém até 500 entradas por ciclo do consumidor.

No Socket.IO, o cliente envia `session.authenticate` com `{token}` depois de conectar. O mock valida a sessão no IndexedDB e responde `session.authenticated` com `{sessionId}`; tokens inválidos recebem `session.authenticationFailed`. Somente conexões autenticadas com o mesmo `userId` e `sessionId` recebem `order.updated`. `nft.updated` é público. Eventos são emitidos depois de a transação IndexedDB correspondente completar; IDs determinísticos por recurso/versão preservam a identidade em reemissões.

| ID | Nome e payload `data` | Ação do cliente | Requisitos |
| --- | --- | --- | --- |
| EVT-01 | `nft.updated`: `{nft:Nft}` | Comparar versão; atualizar detalhe; invalidar listagens, facetas e carrinho. A cotação não é uma query de cache; revisão após reconexão é descrita abaixo | REQ-013, REQ-015, REQ-034, REQ-035 |
| EVT-02 | `order.updated`: `{order:Order}`; privado | Comparar identidade/versão; atualizar pedido; reconsultar carrinho no confirmado; nunca executar baixa local nem regredir terminal | REQ-017, REQ-018, REQ-019, REQ-023, REQ-034, REQ-035 |

Após desconexão/reconexão, buscar REST mesmo sem evento: a reconexão do Socket.IO inicia a reconciliação e o evento do navegador `online` também a inicia como fallback, pois a rede pode voltar antes de o transporte WebSocket emitir `connect`. REST continua sendo a fonte autoritativa; o fallback não substitui os eventos em tempo real. Na tela de checkout, a cotação ativa é recriada com os dados reconciliados e, se preço, estoque, cupom, taxa ou totais mudaram, o usuário precisa revisar novamente antes de confirmar. Listeners antigos são liberados. Reemissão duplicada mantém eventId/versão; teste de evento antigo usa versão inferior e payload antigo sem reverter o banco. A reconciliação de carrinho/cotação foi confirmada em E2E desktop/mobile na TASK-10D; a variante de pedido pending resolvido durante desconexão permanece uma limitação de cobertura descrita em [SCENARIOS.md](SCENARIOS.md).

O transporte do mock cobre WebSocket, mensagens de texto e namespace padrão. Não há cobertura geral de polling, upgrade, namespaces personalizados, acknowledgements ou binário. Os eventos são publicados nas conexões da aba que executa o mock; persistência compartilhada entre abas não significa broadcast entre elas. Para a implementação, consulte [`domain-events.ts`](../src/mocks/domain-events.ts), o [consumidor](../src/features/realtime/domain-event-consumer.ts) e os [providers](../src/app/providers.tsx).

## Facetas do catálogo — API-03

`GET /api/nfts/facets` retorna `{ category: string[], collection: string[], creator: string[], network: string[], counts: { category: Record<string, number>, network: Record<string, number> }, priceRange: { min: Money, max: Money } }`: valores únicos ordenados do catálogo inteiro, independentes dos filtros atuais, para permitir combinar seleções sem esconder opções. As contagens são totais de NFTs do catálogo inteiro por categoria/rede, independentes dos filtros e da paginação; cada NFT conta uma vez, mesmo com várias edições ou esgotado. Os valores não vêm do PNG. O limite de preço parte de zero e chega ao maior preço de edição do catálogo (decimal ETH exato). É um endpoint auxiliar, sem dados privados.

## Controles de avaliação — API-13, API-14

Estes endpoints não exigem sessão e alteram a simulação local. Use-os no navegador após a inicialização do MSW. Todos os caminhos da tabela são relativos a `/api`.

| Operação | Entrada | Resultado / alcance |
| --- | --- | --- |
| `GET /__mock/status` | Sem corpo | `{schemaVersion,scenarioId,now,nftCount,userCount}` |
| `POST /__mock/reset` | `{scenarioId?:'SCN-01',seed?:1,now?:string}` | `{scenarioId:'SCN-01',reset:true}`; restaura fixtures, desfaz alterações locais e fecha conexões. `now` é uma data válida; outros cenários/seeds retornam 422. A limpeza de storage/cache do documento é feita pelo botão **Resetar demonstração** em `/__proof` |
| `POST /__mock/clock` | `{advanceMs:number}` inteiro não negativo | `{now,resolvedOrderIds}`; avança o relógio simulado e resolve pedidos cujo prazo foi atingido |
| `POST /__mock/catalog-network`, `/__mock/detail-network`, `/__mock/cart-network`, `/__mock/favorite-network` | `{delayMs?:number,failuresRemaining?:number,failureMode?:'http'|'network',statusCode?:400..599}` | Inteiros 0–10000 e 0–10; aplica ao recurso indicado. `failureMode:'http'` usa `statusCode` (400–599, padrão 503); `failureMode:'network'` falha sem resposta HTTP. Controla listagem, GET de detalhe, GET do carrinho e escritas de favorito |
| `POST /__mock/payment` | `{outcome?:'confirmed'|'declined',delayMs?:number,loseResponseOnce?:boolean}` | Retorna configuração; atraso inteiro 0–10000 ms; defaults `confirmed`, atraso padrão e `false`. `loseResponseOnce` faz o próximo pedido válido ser persistido normalmente e retornar 504, permitindo testar a recuperação pela mesma chave de idempotência; a opção é consumida uma vez. Configuração persistida no IndexedDB |

Catálogo, detalhe, carrinho e favoritos usam configuração transitória por aba/worker; refresh perde a configuração e reset zera os controles. Cada listagem captura sua configuração ao chegar, permitindo reproduzir respostas fora de ordem. O relógio simulado rege sessão, cotação/cupom e pode resolver pedidos; os controles de latência usam tempo real. `/__proof` oferece reset visual para SCN-01. Seleção visual dos demais cenários e ações avançadas não estão implementadas; os limites e caminhos disponíveis estão em [SCENARIOS.md](SCENARIOS.md).
