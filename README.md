# Kurio — Marketplace de NFTs

Marketplace desenvolvido por **Bernardo Bechtold** para o desafio frontend da Jungle Gaming. A aplicação reúne descoberta de NFTs, favoritos, carrinho, compra simulada e gestão da conta do colecionador, com composições desktop e mobile.

**[Abrir demonstração](https://jungle-gaming-code-challenge.vercel.app)** · **[Repositório](https://github.com/bernbecht/jungle-gaming-code-challenge)** · **[Decisões de produto e UX](docs/DECISOES-PARA-AVALIACAO.md)**

> **Versão para revisão — 08/10/2026.** Este README apresenta o estado de desenvolvimento local. A entrega final ainda está em preparação. O registro de publicação disponível comprova o deploy inicial e suas provas de integração; a correspondência entre a versão pública atual e todos os fluxos descritos abaixo ainda precisa do smoke final. Consulte [o registro de entrega](docs/RELEASE.md).

## Experimente em cinco minutos

Para avaliar o código atual, execute a aplicação localmente conforme o [setup](#executar-localmente). Use um navegador com os dados da demo restaurados ou uma janela anônima para começar com as fixtures iniciais.

| Conta fictícia | Senha |
| --- | --- |
| `collector-a@example.test` | `DemoNft!2026` |
| `collector-b@example.test` | `DemoNft!2026` |

As contas têm recursos distintos. Alterações são persistidas no navegador utilizado; dados do ambiente local e do deploy são independentes. Pagamentos, conexões de carteira e transações são simulados.

1. **Explore o catálogo.** Combine uma categoria com uma rede, use a busca e navegue entre páginas. Observe os parâmetros na URL e sua restauração ao atualizar ou usar o histórico.
2. **Comece uma compra como visitante.** Abra `/nfts/nft-001`, escolha edição/quantidade e clique em Comprar. A inclusão passa pela API e leva ao carrinho.
3. **Revise o carrinho.** Altere a quantidade, aplique `NFT10` e confira subtotal, desconto, taxa e total. Atualize a página para verificar persistência.
4. **Entre na conta A e finalize Ethereum.** Os itens do visitante são mesclados ao carrinho da conta. No mobile, percorra Dados → Carteira → Revisão. “Revisar compra” prepara a cotação; “Confirmar compra” envia o pedido.
5. **Confira o resultado.** A tela apresenta o pedido pendente antes do recibo confirmado. O recibo tem endereço próprio e identifica a transação como simulada.

Para aprofundar a avaliação, consulte `/favorites`, edite o perfil/avatar, teste a alteração de senha e consulte as carteiras. O salvamento do perfil e a troca de senha têm ações independentes. Os [fluxos](docs/FLOWS.md) explicam os passos e as alternativas dessas ações.

## Mapa de rotas

Os caminhos abaixo podem ser abertos diretamente no ambiente local ou na demonstração, conforme a versão publicada. Substitua `:nftId` e `:orderId` pelos identificadores reais.

| Rota | Finalidade | Acesso |
| --- | --- | --- |
| `/` | Home e catálogo; busca, filtros, ordenação e paginação na URL | Público |
| `/nfts/:nftId` | Detalhe, galeria, edição, quantidade e ações do NFT | Público; favoritar exige autenticação |
| `/cart` | Carrinho, quantidades, remoção, cupons e grupos por rede | Visitante ou conta autenticada |
| `/login` | Autenticação; aceita `returnTo` para retorno interno ao fluxo | Público |
| `/register` | Criação de conta; aceita `returnTo` para retorno interno ao fluxo | Público |
| `/checkout?network=ethereum` | Dados, carteira compatível, cotação e revisão da compra por rede | Autenticado |
| `/orders/:orderId` | Estado pendente, confirmado ou recusado; recibo após confirmação | Autenticado; pedido da própria conta |
| `/profile` | Dados pessoais, avatar e alteração de senha | Autenticado |
| `/wallets` | Cadastro e edição de carteiras principal/secundária | Autenticado |
| `/favorites` | Lista de NFTs salvos, acesso ao detalhe e remoção com rollback em falha | Autenticado; favoritos da própria conta |
| `/__proof` | Provas técnicas de integração REST e Socket.IO e reset da demonstração | Público |

No checkout, `network` aceita `ethereum`, `polygon` ou `solana`; o carrinho fornece a rede do grupo escolhido. Ao acessar uma rota protegida sem sessão, a aplicação encaminha ao login com o destino de retorno.

Exemplos para avaliação: `/nfts/nft-001` abre um NFT da fixture; `/nfts/missing` demonstra o tratamento de NFT inexistente. Para consultar um pedido, use a URL gerada após a compra na conta que o criou. Um caminho não cadastrado apresenta a página de rota não encontrada.

## O que está implementado

“Implementado” descreve o comportamento presente no código; a cobertura e a execução de cada cenário são registradas separadamente na [matriz de testes](docs/TEST-MATRIX.md).

| Área | Comportamento disponível | Verificação registrada / trabalho restante |
| --- | --- | --- |
| Catálogo e detalhe | Busca, filtros combinados, ordenação, paginação na URL, galeria, edição, quantidade e estados vazio/erro/404 | E2E e revisão responsiva anteriores aprovados; regressão visual final pendente |
| Autenticação e favoritos | Cadastro, login/logout, guards, retorno ao fluxo, sessão após refresh, página de favoritos e atualização otimista com rollback | E2E de favoritos e expiração com retorno aprovados; resposta REST privada atrasada após troca/reset ainda sem E2E dedicado |
| Carrinho | Visitante e conta, merge idempotente, quantidades, remoção, cupons e totais calculados pela API | Implementado e com testes; execução final consolidada pendente |
| Checkout e pedidos | Carteira compatível, revisão de cotação, criação idempotente, pendência, confirmação/recusa, recibo com snapshot e recuperação da tentativa após refresh | E2E confirmado/recusado/multirrede, reconciliação e recuperação após 504 aprovados; timeout HTTP real por atraso de resposta não simulado |
| Perfil e carteiras | Dados, avatar, senha e cadastro/edição de carteiras principal/secundária | E2E desktop/mobile aprovados conforme registros locais |
| Tempo real | Eventos de NFT/pedido após persistência, validação de identidade/versão, deduplicação e reconciliação REST após reconexão | TASK-10A a TASK-10E concluídas conforme registros; variantes avançadas de cenários seguem parciais |
| Controles de simulação | Reset pela interface, relógio, latência e falhas HTTP/rede de catálogo/detalhe/carrinho/favoritos; pagamento recusado e resposta ambígua | TASK-11 concluída para os casos cobertos; seleção dos 18 cenários e painel completo não disponíveis |
| Qualidade e publicação | Scripts de tipos, lint, build, Playwright e Lighthouse; deploy inicial | Auditoria completa, baselines, checkout limpo e publicação final pendentes |

As aprovações acima vêm dos registros de execução do projeto, incluindo execuções locais reportadas pelo autor. Os relatórios finais ainda precisam ser reunidos e vinculados à versão entregue.

## Decisões que merecem atenção

Ao transformar o protótipo em fluxos funcionais, algumas escolhas exigiram ajustes de composição ou comportamento. As motivações, consequências e referências de código estão no [documento para avaliação](docs/DECISOES-PARA-AVALIACAO.md).

- **Compra por rede:** um carrinho Ethereum + Polygon é finalizado em grupos independentes, com carteiras compatíveis. Comprar um grupo preserva os demais.
- **Recibo recuperável:** a confirmação fica em `/orders/:orderId`, permitindo consultar o pedido por um endereço próprio e representar seus diferentes estados.
- **Perfil e senha separados:** cada ação tem validações e resultado próprios, coerentes com os endpoints independentes implementados.
- **Clareza no mobile:** remoção com ícone e texto no carrinho; checkout em etapas com revisão explícita antes do envio.
- **Descoberta antes do login:** a home e o catálogo permanecem públicos no mobile. A pessoa pode conhecer o marketplace antes de entrar; login é solicitado quando escolhido ou necessário para uma rota protegida.
- **Iconografia do rodapé:** escudo, pessoas e sino substituem as letras W/C/D para ilustrar segurança, criadores e alertas, mantendo os textos explicativos.

Essas decisões têm benefícios esperados e custos descritos na documentação. A melhoria de usabilidade não foi medida em pesquisa com usuários. Fonte semelhante e imagens temporárias são limitações de fidelidade visual, registradas em [ASSETS](docs/ASSETS.md).

## Executar localmente

Runtime de referência: Node **26.10.0** e npm **11.19.1**. O projeto declara Node `>=22.12.0`; versões alternativas ainda não foram verificadas.

```bash
git clone https://github.com/bernbecht/jungle-gaming-code-challenge.git
cd jungle-gaming-code-challenge
nvm use
npm ci
cp .env.example .env
npm run dev
```

`nvm use` é opcional se o Node compatível já estiver instalado. Abra `http://127.0.0.1:5173`. A validação final de instalação em checkout limpo ainda está pendente.

| Variável pública | Padrão | Finalidade |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base das chamadas Axios |
| `VITE_MOCKS_ENABLED` | `true` | Inicia MSW antes de montar as rotas |
| `VITE_MOCK_SCENARIO` | `SCN-01` | Fixture padrão; único identificador de cenário aceito atualmente |

Os fluxos funcionais dependem dos mocks habilitados. A aplicação executa a simulação no navegador, sem backend privado, extensão de carteira ou gateway real. Não coloque segredos nas variáveis `VITE_*`.

## Restaurar dados e experimentar falhas

Os controles atuais usam MSW no navegador. Há um controle de reset na rota `/__proof`; o painel completo e a seleção de outros cenários ainda estão planejados. O reset descarta as alterações locais da demo, incluindo contas criadas e compras.

**Restaurar a fixture padrão:**

1. Abra `/__proof` na aplicação local ou na demonstração publicada e clique em **Resetar demonstração**.
2. A aplicação restaura o cenário `SCN-01`, limpa a sessão e as tentativas salvas, descarta o ID de visitante anterior e cria um novo ao iniciar a home; a recarga também limpa o cache em memória.
3. Entre novamente com uma das contas seed acima para repetir um fluxo autenticado.

O seletor ainda aceita apenas `SCN-01`. O reset pela interface também limpa o estado do navegador. O endpoint abaixo, quando chamado diretamente, restaura o banco e os controles do mock, mas não consegue limpar o storage nem o cache React da página que o chamou.

```js
const reset = await fetch('/api/__mock/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenarioId: 'SCN-01' }),
});
if (!reset.ok) throw new Error('Não foi possível restaurar a demo.');
sessionStorage.removeItem('kurio-session-token');
localStorage.removeItem('kurio-guest-id');
for (const key of Object.keys(localStorage)) {
  if (key.startsWith('kurio-order-attempt:')) localStorage.removeItem(key);
}
location.reload();
```

Após reset, entre novamente com as credenciais seed. Para consultar a configuração e o relógio, use `GET /api/__mock/status`.

| Experimento | Como reproduzir | O que observar |
| --- | --- | --- |
| Cupom inválido/expirado | No carrinho, aplicar `INVALID` ou `EXPIRED` | Erro sem desconto indevido; `NFT10` é o cupom válido |
| Perfil inválido | Na conta A, tentar salvar o e-mail da conta B | Erro de conflito sem persistir a alteração |
| Compra multirrede | Adicionar `nft-001` e `nft-002`; finalizar apenas Polygon | Checkout inclui apenas Polygon e Ethereum permanece no carrinho |
| Pagamento recusado | Configurar o controle abaixo antes de enviar um novo pedido | Recusa sem recibo confirmado; itens preservados |
| Catálogo lento/com erro | Configurar o controle abaixo e submeter uma busca nova, sem cache | Loading, erro após retry automático e recuperação manual |
| Favorito com falha | Configurar `/api/__mock/favorite-network` com `{failuresRemaining:1,delayMs:400}` antes de alternar um coração | Mudança imediata seguida de rollback; nova tentativa pode salvar |
| Sessão expirada | Após login, enviar `{advanceMs:86400001}` a `/api/__mock/clock` e acessar `/profile` | Login com retorno; autenticar novamente retoma o perfil |
| Resposta ambígua de compra | Configurar o pagamento abaixo, confirmar e recarregar o checkout | “Recuperar tentativa” encontra o pedido original pela mesma chave |

**Configurar o próximo pagamento como recusado:**

```js
const payment = await fetch('/api/__mock/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ outcome: 'declined', delayMs: 2000 }),
});
if (!payment.ok) throw new Error('Não foi possível configurar o pagamento.');
```

A configuração vale para novas compras até ser alterada ou resetada. Para voltar à confirmação, envie `outcome: 'confirmed'` ou restaure a demo.

**Simular resposta ambígua depois de criar o pedido:**

```js
const ambiguousPayment = await fetch('/api/__mock/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ outcome: 'confirmed', delayMs: 8000, loseResponseOnce: true }),
});
if (!ambiguousPayment.ok) throw new Error('Não foi possível configurar a resposta ambígua.');
```

Confirme uma nova compra. O mock cria o pedido e reserva estoque, mas retorna **504 `RESPONSE_UNKNOWN`**. Recarregue o checkout e acione **Recuperar tentativa** para consultar o mesmo pedido; a rota do pedido acompanha o estado pendente até a confirmação. Esse caso não simula um timeout HTTP real, e o atraso de oito segundos controla a resolução do pagamento.

**Configurar lentidão e duas falhas de catálogo:**

```js
const catalog = await fetch('/api/__mock/catalog-network', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ delayMs: 1500, failuresRemaining: 2 }),
});
if (!catalog.ok) throw new Error('Não foi possível configurar o catálogo.');
```

Depois, submeta uma busca ainda não consultada. As duas falhas permitem exercitar o erro após a repetição automática e a recuperação por “Tentar novamente”. Para restaurar, envie ambos os valores como zero ou faça reset. O controle de catálogo é transitório por aba e não persiste após refresh.

Os controles `/api/__mock/detail-network` e `/api/__mock/cart-network` também permitem atraso/falhas. `failureMode:'network'` simula falha sem resposta HTTP; `failureMode:'http'` permite configurar `statusCode`. Formatos, alcance e passos de cada caso estão em [CONTRACTS](docs/CONTRACTS.md) e [SCENARIOS](docs/SCENARIOS.md).

Outros controles, limites e cenários previstos estão em [CONTRACTS](docs/CONTRACTS.md) e [SCENARIOS](docs/SCENARIOS.md). Cenários descritos como planejados nesses documentos ainda não devem ser tratados como disponíveis.

## Verificar a aplicação

```bash
npm run typecheck
npm run lint
npm run build
npm run test:unit
npx playwright install chromium
npm run test:e2e
npm run test:report
```

Playwright está configurado para Chromium desktop **1440 × 900** e mobile **390 × 844**. Os E2E iniciam build/preview automaticamente, usam mocks e contextos isolados. O reporter HTML gera `playwright-report/`; traces são retidos em falhas. A execução final consolidada e seus artefatos ainda estão pendentes.

Relatórios, traces e `artifacts/` são ignorados pelo Git. O pacote final deve disponibilizar essas evidências ao avaliador e identificar o commit correspondente; os [critérios de entrega](docs/RELEASE.md) detalham checkout limpo, auditoria e smoke público.

| Comando adicional | Finalidade / limite atual |
| --- | --- |
| `npm run preview` | Serve o build em `http://127.0.0.1:4173` |
| `npm run test:visual` | Compara início, detalhe, carrinho e pagamento em desktop/mobile com as baselines; [execução e atualização](docs/VISUAL-TESTS.md) |
| `npm run audit:lighthouse` | Auditoria exploratória da home; requer preview ativo e Chrome disponível |

O script Lighthouse atual não executa a matriz completa exigida. A entrega final deverá incluir início/detalhe × desktop/mobile × três execuções, medianas, LCP/CLS/TBT e relatórios HTML/JSON. Procedimento e metas em [RELEASE](docs/RELEASE.md).

## Arquitetura em uma leitura

React e TypeScript compõem a interface; TanStack Router organiza rotas, parâmetros e guards. TanStack Query gerencia consultas/mutations/cache, e Axios realiza as chamadas REST interceptadas pelo MSW. O domínio simulado persiste em IndexedDB, com fixtures determinísticas, validações e transações.

Busca e filtros aplicados pertencem à URL; dados remotos pertencem ao Query; formulários e diálogos usam estado local. Valores ETH trafegam como strings e são calculados em wei com `BigInt`. O recibo usa o snapshot do pedido, e a idempotência identifica reenvios da mesma tentativa.

A interface usa Tailwind e componentes adaptados do padrão shadcn/ui. O Socket.IO utiliza WebSocket, namespace padrão e eventos textuais via `@mswjs/socket.io-binding`. Eventos são publicados após a transação IndexedDB; o cliente valida versão e identidade antes de atualizar o cache. A reconexão refaz consultas REST e revalida a cotação ativa. Persistência compartilhada entre abas não implica broadcast dos eventos entre elas. Detalhes em [ARCHITECTURE](ARCHITECTURE.md) e no [guia dos mocks](docs/MOCKS-GUIDE.md).

## Limitações e fechamento da entrega

- Os cenários têm disponibilidade e cobertura diferentes. Apenas `SCN-01` é aceito como configuração de inicialização/reset; os demais casos são provocados por ações e controles, conforme [SCENARIOS](docs/SCENARIOS.md).
- A resposta REST privada atrasada após troca/reset ainda não tem E2E dedicado. O timeout HTTP real por atraso, a alteração dedicada de preço/taxa e a emissão controlada de todas as variantes de evento antigo/duplicado não estão integralmente cobertos.
- As artes usam quatro placeholders SVG locais, e IBM Plex Mono aproxima a fonte da referência. A fidelidade visual final ainda precisa de revisão.
- Baselines visuais, revisão completa de acessibilidade em 390/768/1440, auditorias Lighthouse e artefatos finais permanecem pendentes.
- Instalação em checkout limpo, identificação do commit entregue e smoke da versão pública final ainda precisam ser registrados.
- Login social, recuperação por e-mail, newsletter e páginas auxiliares fora do escopo explicam sua indisponibilidade ou permanecem inativos. Transações e exploração de blockchain são simuladas.

O estado detalhado está em [TASKS](TASKS.md), as evidências em [TEST-MATRIX](docs/TEST-MATRIX.md) e o fechamento em [RELEASE](docs/RELEASE.md). Documentar uma pendência não significa que o requisito foi atendido.

## Documentação por interesse

| Para entender… | Leia |
| --- | --- |
| As escolhas de produto e diferenças do protótipo | [Decisões para avaliação](docs/DECISOES-PARA-AVALIACAO.md) |
| Responsabilidades, sessão, cache, dinheiro e pedidos | [Arquitetura](ARCHITECTURE.md) |
| Endpoints, payloads e eventos | [Contratos](docs/CONTRACTS.md) |
| Ações do usuário e alternativas dos fluxos | [Fluxos](docs/FLOWS.md) |
| Fixtures, falhas e controles | [Cenários](docs/SCENARIOS.md) e [guia dos mocks](docs/MOCKS-GUIDE.md) |
| Cobertura, resultados e publicação | [Matriz de testes](docs/TEST-MATRIX.md) e [entrega](docs/RELEASE.md) |
| Como executar, revisar e atualizar as capturas de regressão visual | [Testes visuais](docs/VISUAL-TESTS.md) |
| Referências visuais e substituições | [UI-SPEC](docs/UI-SPEC.md) e [assets](docs/ASSETS.md) |
| Exigências e rastreabilidade | [Enunciado](challenge-description.md) e [requisitos](REQUIREMENTS.md) |
| Planejamento e histórico de desenvolvimento | [Backlog](TASKS.md) e [roteiro](ROTEIRO.md) |
