# Contratos REST e eventos

Status: **especificação proposta v0, ainda não implementada**. IDs estáveis; alterar schemas de forma coordenada entre handlers, serviços e testes. Origem: [requisitos](../REQUIREMENTS.md), decisões [DEC-03 a DEC-13](../ARCHITECTURE.md). Campos adicionais exigidos pelo Figma serão incorporados após TASK-01.

## Pendências identificadas nas screenshots

Análise visual concluída em [UI-SPEC](UI-SPEC.md), seção Formulários e impactos nos contratos. Os schemas v0 abaixo ainda **não cobrem todos os campos observados**: username/displayName, metadados de carteira/ENS/indicação, observação do colecionador e remoção de avatar. Catálogo também precisa mapear rede, abas Novos/Em alta, ordenação recente, token/atributos/rating. TASK-04 deve revisar modelos antes dos handlers; TASK-09 deve fechar validações sem inferir regras só dos asteriscos. Os modelos abaixo continuam propostas, não contratos congelados.

## Convenções

Base `/api`; JSON, exceto upload de avatar. IDs opacos em string, datas ISO UTC, versões inteiras crescentes por recurso. ETH como string decimal não negativa, até 18 casas; quantidade inteira positiva. Respostas abaixo são corpos diretos. Listas usam `{ items, page, pageSize, total }` quando paginadas.

Autenticação proposta: `Authorization: Bearer <token-ficticio>`. Visitante usa `X-Guest-Id` para seu carrinho; identidade autenticada prevalece. Handlers não aceitam `userId` do corpo como autorização. Recursos de outro usuário retornam 403; sessão ausente/expirada retorna 401. `expectedVersion` nas edições evita sobrescrever estado concorrente.

```ts
type Money = string; // ETH decimal; cálculos em wei (DEC-06)
type ApiError = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    details?: Record<string, unknown>;
  };
};
type Session = {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  expiresAt: string;
};
type Edition = { id: string; label: string; unitPrice: Money; available: number };
type Nft = {
  id: string; version: number; name: string; description: string;
  creator: string; collection: string; category: string;
  images: { url: string; alt: string }[]; featured: boolean; editions: Edition[];
};
type CartLine = {
  id: string; nftId: string; editionId: string; quantity: number;
  name: string; imageUrl: string; unitPrice: Money; available: number;
  availability: 'available' | 'insufficient' | 'unavailable';
};
type Totals = { subtotal: Money; discount: Money; networkFee: Money; total: Money };
type Cart = {
  id: string; version: number; items: CartLine[]; couponCode: string | null;
  totals: Totals; notices: { code: string; message: string }[];
};
type Quote = {
  id: string; version: number; cartId: string; cartVersion: number;
  network: string; couponCode: string | null; expiresAt: string;
  items: CartLine[]; totals: Totals;
};
type Wallet = {
  id: string; version: number; slot: 'primary' | 'secondary';
  label: string; address: string; network: string;
};
type Collector = { name: string; email: string }; // completar com campos do Figma
type OrderInput = {
  quoteId: string; quoteVersion: number; walletId: string;
  network: string; connectionId: string; collector: Collector;
};
type Order = {
  id: string; userId: string; version: number;
  status: 'pending' | 'confirmed' | 'declined';
  createdAt: string; updatedAt: string; declineReason: string | null;
  snapshot: {
    items: CartLine[]; totals: Totals; collector: Collector;
    walletAddress: string; network: string; couponCode: string | null;
  };
  transaction: { reference: string; simulated: true; explorerUrl: string | null } | null;
};
```

`available` no snapshot é informativo da hora da compra; não se atualiza depois. O recibo exibe valores do snapshot e a transação somente quando confirmado. Lotes de carrinho, reservas e verificadores de senha são internos ao mock e não trafegam na UI.

## Endpoints

`Privado` exige sessão. Cada ID abaixo cobre o recurso e suas operações relacionadas.

| ID | Operação | Entrada → sucesso | Erros principais | Requisitos |
| --- | --- | --- | --- | --- |
| API-01 | `POST /accounts` | `{name,email,password}` → 201 `{user:{id,name,email}}`; seguir para login | 422 campos, 409 email existente | REQ-021, REQ-024 |
| API-02 | `POST /session`, `GET /session`, `DELETE /session` | Login `{email,password}` → 200 `{token,session:Session}`; consulta → 200 Session; logout → 204 | 401 credenciais/sessão expirada | REQ-021, REQ-022, REQ-023 |
| API-03 | `GET /nfts`, `GET /nfts/:id` | Lista parametrizada → 200 página de Nft; detalhe → 200 Nft | 422 parâmetros, 404 detalhe | REQ-005, REQ-006, REQ-007 |
| API-04 | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` (privado) | Consulta → 200 `{nftIds:string[]}`; PUT sem corpo → 200 mesmo formato; DELETE → 200 mesmo formato; operações idempotentes | 401, 404, 503 transitório | REQ-008 |
| API-05 | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` | Consulta → Cart; adição `{nftId,editionId,quantity,expectedVersion}`; edição `{quantity,expectedVersion}`; remoção com `If-Match` da versão → 200 Cart | 404, 409 estoque/versão, 422 quantidade | REQ-009, REQ-010, REQ-011, REQ-013 |
| API-06 | `POST /cart/merge` (privado) | `{guestId,guestVersion}` → 200 Cart com notices; repetir origem consumida não duplica | 409 revisão divergente, 401 | REQ-010, REQ-023 |
| API-07 | `PUT /cart/coupon`, `DELETE /cart/coupon` | PUT `{code,expectedVersion}`; DELETE com `If-Match` → 200 Cart | 422 `COUPON_INVALID`/`COUPON_EXPIRED`, 409 versão | REQ-011 |
| API-08 | `POST /quotes` (privado) | `{cartVersion,network}` → 201 Quote; valida carrinho, cupom, estoque e taxas | 409 `CART_CHANGED`/`STOCK_CONFLICT`, 422 cupom/rede | REQ-012, REQ-014, REQ-015 |
| API-09 | `POST /orders`, `GET /orders/:id`, `GET /order-attempts/:key` (privado) | POST OrderInput + `Idempotency-Key` → 201 Order na criação / 200 Order em replay; GET pedido → 200 Order; tentativa → 200 `{order:Order}` ou resultado de conflito previamente registrado | 401, 403, 404 tentativa/pedido, 409 cotação/idempotência/estoque | REQ-016, REQ-017, REQ-018, REQ-019, REQ-020 |
| API-10 | `GET /profile`, `PATCH /profile`, `PUT /profile/avatar`, `PUT /profile/password` (privado) | GET/PATCH → `{id,version,name,email,avatarUrl}`; PATCH `{name,email,expectedVersion}`; avatar multipart `file,expectedVersion` → perfil; senha `{currentPassword,newPassword}` → 204 | 422 campos/arquivo/senha, 409 email/versão | REQ-024 |
| API-11 | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id` (privado) | GET → `{items:Wallet[]}`; POST `{slot,label,address,network}` → 201 Wallet; PATCH mesmos campos + expectedVersion → 200 Wallet | 422 endereço/rede, 409 slot/endereço/versão, 403 | REQ-014, REQ-024 |
| API-12 | `POST /wallet-connections`, `DELETE /wallet-connections/:id` (privado) | POST `{walletId,network}` → 201 `{id,status:'connected',walletId,network}`; DELETE → 204 | 409 `CONNECTION_REJECTED`/`NETWORK_MISMATCH`; checkout rejeita conexão encerrada | REQ-014 |
| API-13 | Controles `/__mock/*`, fora da API de produto | Reset, cenário, relógio e emissão descritos em SCENARIOS; disponíveis somente quando mocks habilitados | 422 configuração inválida | REQ-030, REQ-031, REQ-044 |

## Parâmetros, validações e erros

API-03: `q`, `category`, `collection`, `creator`, `minPrice`, `maxPrice`, `availableOnly`, `sort`, `page`, `pageSize`. Filtros múltiplos de mesma dimensão usam parâmetros repetidos; dimensões diferentes combinam por AND. Ordenação proposta: `featured`, `price-asc`, `price-desc`, `name`; preço de referência é o menor preço das edições disponíveis, ou menor preço da edição se todas esgotadas. Desempate por ID. Padrão página 1, tamanho 12, máximo 48. Mapear controles efetivamente presentes no Figma em TASK-01.

Entrada inválida na URL é normalizada pelo router; entrada inválida direta na API retorna 422. Alterar busca/filtros/ordenação reinicia página. O cliente deve enviar parâmetros normalizados equivalentes aos exibidos.

Validações propostas do projeto: nome não vazio, email válido/único normalizado, senha com mínimo de 8 caracteres, confirmação de senha na UI, endereço simulado no formato da rede, slots primary/secondary únicos por usuário. Avatar PNG/JPEG/WebP até 2 MB, persistido como blob; revogar object URLs antigos. Ajustar campos conforme Figma e registrar DEC-14; limites são decisões locais, não exigências textuais do desafio.

Erros padrão: 400 requisição malformada; 401 `SESSION_INVALID`/`SESSION_EXPIRED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`, `STOCK_CONFLICT`, `QUOTE_CHANGED`, `IDEMPOTENCY_CONFLICT`; 422 `VALIDATION_ERROR`; 503 `TRANSIENT_FAILURE`. Falha de rede não tem status HTTP. Timeout no cliente não informa se houve commit no mock.

## Idempotência e cotação — API-08, API-09

1. Criar cotação de validade proposta de 5 minutos, com versão do carrinho, preços/estoque/cupom/taxas atuais e rede.
2. Após revisão, persistir chave e OrderInput por usuário antes de POST. Desabilitar cliques enquanto resolve a tentativa.
3. No handler, verificar sessão e registro da chave. Mesmo conteúdo retorna resultado anterior; diferente retorna 409 `IDEMPOTENCY_CONFLICT`.
4. Para chave nova, revalidar tudo atomicamente, inclusive conexão/carteira. Cotação alterada retorna 409 `QUOTE_CHANGED` com `details.quote` e `details.changes`, sem criar pedido. Edição esgotada retorna `STOCK_CONFLICT` para correção de itens.
5. Cotação válida cria pedido pending e reserva estoque na mesma transação do registro de idempotência. SCN-11 atrasa somente a resposta, depois desse commit.
6. Consultar tentativa ou reenviar payload idêntico após timeout. Se consulta retornar 404, reenvio usa a mesma chave, pois o request original ainda pode estar em andamento.
7. Confirmar baixa estoque/carrinho uma vez; recusar libera reserva e preserva carrinho. Mudanças de disponibilidade decorrentes emitem EVT-01; resultado emite EVT-02.

## Eventos

Envelope proposto: `{eventId, resourceId, version, occurredAt, data}`. Eventos privados acrescentam `userId` e `sessionId`. Versão refere-se ao recurso, não ao evento global. O cliente confere identidade e geração de sessão antes de aplicar.

| ID | Nome e payload `data` | Ação do cliente | Requisitos |
| --- | --- | --- | --- |
| EVT-01 | `nft.updated`: `{nft:Nft}` | Comparar versão; atualizar detalhe, reconsultar listagens afetadas, invalidar carrinho/cotação; anunciar mudança relevante | REQ-013, REQ-015, REQ-034, REQ-035 |
| EVT-02 | `order.updated`: `{order:Order}`; privado | Comparar identidade/versão; atualizar pedido; reconsultar carrinho no confirmado; nunca executar baixa local nem regredir terminal | REQ-017, REQ-018, REQ-019, REQ-023, REQ-034, REQ-035 |

Após desconexão/reconexão, buscar REST mesmo sem evento. Listeners antigos são liberados. Reemissão duplicada mantém eventId/versão; teste de evento antigo usa versão inferior e payload antigo sem reverter o banco. Transporte proposto em DEC-11 deve ser validado na prova técnica.
