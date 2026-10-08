# Cenários da simulação

Guia para reproduzir comportamentos e avaliar a aplicação com dados conhecidos. Os IDs SCN-01 a SCN-18 identificam casos de avaliação; **somente SCN-01 é aceito como configuração de inicialização/reset**. Os demais casos podem ser provocados pela interface, pelos controles disponíveis ou, quando indicado, dependem de controles planejados.

Consulte os formatos de requisição em [CONTRACTS.md](CONTRACTS.md), os resultados registrados em [TEST-MATRIX.md](TEST-MATRIX.md) e o progresso em [TASKS.md](../TASKS.md). “Reproduzível” abaixo significa que existe um caminho na implementação atual; não significa que todo o cenário passou em E2E ou foi validado no deploy público.

## Dados de partida

As [fixtures](../src/mocks/fixtures.ts) criam 36 NFTs, três categorias, três coleções, três redes e quatro criadores. Os IDs vão de `nft-001` a `nft-036`; a página padrão contém 12 itens. Há edições com estoque normal, baixo e zero. Quatro placeholders SVG locais são reutilizados conforme DEC-17.

| Dado | Valor / uso |
| --- | --- |
| Conta A | `collector-a@example.test`; carteiras principal Ethereum e secundária Polygon; favorito inicial `nft-001` |
| Conta B | `collector-b@example.test`; carteira principal Ethereum; favorito inicial `nft-002` |
| Senha das duas contas | `DemoNft!2026` — fictícia; o banco persiste salts/verificadores, sem senha em texto claro |
| Compra Ethereum | `nft-001`, edição `1/10`, disponível após reset |
| Compra Polygon | `nft-002`, edição `1/10`; usar carteira secundária de A |
| Cupons | `NFT10`: 10%; `EXPIRED`: expirado; código desconhecido: inválido |
| Estado inicial | Carrinhos vazios, nenhum pedido e nenhuma sessão ativa |
| Relógio-base / seed | `2026-01-15T12:00:00Z` / `1` |
| Pagamento padrão | Confirmado após 2 segundos reais; configurável pelo controle de pagamento |

Esses valores são escolhas de teste, não exigências do desafio. O banco IndexedDB pertence à origem do navegador: desenvolvimento local e deploy possuem estados independentes. Refresh preserva o banco compatível; reset restaura as fixtures e desfaz alterações da demonstração.

## Como preparar uma avaliação

1. Abra a aplicação com mocks habilitados e aguarde a inicialização. A rota `/__proof` permite conferir REST e Socket.IO separadamente.
2. Em `/__proof`, clique em **Resetar demonstração**. O controle restaura SCN-01, apaga sessão e tentativas salvas, descarta o ID de visitante anterior e cria um novo quando a home iniciar; a recarga limpa caches em memória.
3. Entre com a conta indicada, execute o caso e observe o resultado na interface. Para outro caso independente, repita o reset.

O botão é o caminho recomendado para preparar uma avaliação manual. `POST /api/__mock/reset` isoladamente restaura o banco/worker, mas não pode limpar o storage nem o cache React do documento que fez a chamada.

Os controles são interceptados pelo MSW no navegador; chamadas externas com `curl` não exercitam esse mock. Não é necessário editar fixtures ou cache da aplicação para os casos reproduzíveis abaixo.

## Controles disponíveis

Os [handlers](../src/mocks/handlers.ts) oferecem estes controles sem sessão. `/__proof` já permite resetar a demonstração; ainda não há painel visual para selecionar os 18 cenários nem para configurar todas as ações.

| Controle | Entrada e efeito |
| --- | --- |
| `GET /api/__mock/status` | Mostra cenário, versão do schema, relógio e quantidades de NFTs/usuários |
| `POST /api/__mock/reset` | `{scenarioId?:'SCN-01',seed?:1,now?:string}`; restaura banco, controles e fecha sockets da aba |
| `POST /api/__mock/clock` | `{advanceMs:number}` inteiro não negativo; avança o relógio do domínio e resolve pedidos vencidos, publicando os eventos correspondentes |
| `POST /api/__mock/catalog-network`, `/detail-network`, `/cart-network`, `/favorite-network` | `{delayMs?:number,failuresRemaining?:number,failureMode?:'http'|'network',statusCode?:400..599}`; atraso 0–10000 ms e até 10 falhas na próxima operação daquele recurso; `network` simula ausência de resposta HTTP |
| `POST /api/__mock/payment` | `{outcome?:'confirmed'|'declined',delayMs?:number,loseResponseOnce?:boolean}`; configura novos pedidos, atraso 0–10000 ms e resposta ambígua uma vez |

Catálogo, detalhe, carrinho e favoritos usam controles transitórios por aba/worker, perdidos no refresh. A configuração de pagamento persiste no IndexedDB. Reset restaura os defaults. O relógio simulado rege cotação, cupom e resolução por avanço; atraso de rede/pagamento também pode usar tempo real. Avançar o relógio do domínio não avança os timers do navegador.

`loseResponseOnce:true` não produz um timeout real: após criar o pedido e reservar estoque, o handler retorna **504 `RESPONSE_UNKNOWN`**, sem entregar o objeto do pedido. A próxima consulta da tentativa pode recuperá-lo pela mesma chave. O sinalizador é consumido na criação de um pedido novo; replay não cria outro pedido. Esse fluxo foi implementado na TASK-10E e confirmado em E2E desktop/mobile. Uma resposta HTTP apenas atrasada além do timeout real do cliente não é simulada.

### Exemplo: pagamento recusado — SCN-12

Após o reset, configure no console antes de confirmar a compra:

```js
const payment = await fetch('/api/__mock/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ outcome: 'declined', delayMs: 0 }),
});
if (!payment.ok) throw new Error(await payment.text());
```

Entre com A, compre uma unidade de `nft-001`, conecte a carteira Ethereum, revise e confirme. Espere a recusa, sem recibo confirmado, e confira que o item permanece no carrinho. Para a variante de resposta ambígua de SCN-11, use `{outcome:'confirmed',delayMs:8000,loseResponseOnce:true}`: após o 504, recarregue e use **Recuperar tentativa**. A mesma chave deve levar ao pedido existente.

## Catálogo de casos

**Reproduzível:** caminho disponível na interface/controles. **Parcial:** parte disponível, com gatilhos ou variantes ainda pendentes. **Planejado:** preparação completa depende de implementação adicional. As colunas de teste indicam rastreabilidade, não aprovação.

| ID | Disponibilidade e preparação | Resultado esperado | Testes |
| --- | --- | --- | --- |
| SCN-01 | **Reproduzível.** Reset; A compra `nft-001` com carteira Ethereum e pagamento padrão | Pedido confirmado, recibo com snapshot e remoção dos itens comprados | TEST-01 a TEST-06, TEST-08, TEST-11, TEST-13 a TEST-15, TEST-18 |
| SCN-02 | **Reproduzível.** Buscar um termo sem correspondência | Estado vazio sem erro; limpar busca recupera resultados | TEST-01 |
| SCN-03 | **Reproduzível por controle/harness.** Configurar primeira listagem com 1500 ms e segunda com 100 ms; disparar buscas diferentes sem aguardar a primeira | Resposta antiga não substitui busca atual/URL | TEST-01 |
| SCN-04 | **Reproduzível.** Configurar `delayMs:2000` em catálogo, detalhe ou carrinho antes de abrir a rota | Skeleton visível durante carga e conteúdo após a resposta; verificar preservação de dimensões | TEST-12 |
| SCN-05 | **Reproduzível.** Configurar `failureMode:'network'` e falhas suficientes para cobrir a tentativa e retry automático em catálogo, detalhe ou carrinho | Erro sem resposta HTTP, mensagem de falha e recuperação por retry explícito | TEST-12 |
| SCN-06 | **Parcial.** Configurar 503 em catálogo/favoritos; abrir detalhe inexistente. Recurso privado alheio requer requisição autenticada no harness | Erros distintos, rollback de favorito e retry quando aplicável | TEST-02, TEST-03, TEST-04, TEST-12 |
| SCN-07 | **Reproduzível.** Faça login, avance `/api/__mock/clock` em `86400001` ms e acesse `/profile`; a API retorna 401, o token é removido e a rota de login preserva `returnTo`. Entre novamente para retomar o perfil | Sessão expirada não autoriza a rota; autenticação nova retoma o destino protegido | TEST-03 |
| SCN-08 | **Reproduzível.** Cadastrar email seed; editar perfil com dados inválidos; informar senha atual incorreta; enviar avatar/carteira inválidos | 409/422 e erros dos campos; operação inválida não salva dados. Perfil e senha são operações separadas | TEST-03, TEST-08 |
| SCN-09 | **Reproduzível.** Carrinho com item; aplicar código desconhecido ou `EXPIRED`, depois `NFT10` e remover | Cupom inválido recusado; desconto válido e remoção refletidos nos totais | TEST-05 |
| SCN-10 | **Parcial.** Reservas e resolução de pedidos já emitem disponibilidade via EVT-01; ação dedicada para alterar preço/esgotar edição ainda planejada | Banco/evento coerentes; resumo e validação da compra refletem disponibilidade. Revisão de todas as variantes ainda pendente | TEST-09 |
| SCN-11 | **Parcial.** `loseResponseOnce:true` faz o POST retornar 504 `RESPONSE_UNKNOWN` depois de persistir o pedido; a tela pode recuperar a tentativa pela mesma chave, inclusive após refresh. Não simula um timeout HTTP real por atraso de resposta | Recuperar pela mesma chave encontra um único pedido, sem duplicar pedido ou baixa de estoque | TEST-07 |
| SCN-12 | **Reproduzível.** Configurar `outcome:'declined'` antes de confirmar | Recusa terminal, sem recibo confirmado, carrinho preservado | TEST-07 |
| SCN-13 | **Parcial.** Validação/deduplicação do consumidor coberta em unidade; controle público de emissão v3/duplicata/v2 ainda planejado | Estado mantém versão mais nova; efeitos não repetidos; REST não é revertido por reemissão | TEST-10 |
| SCN-14 | **Parcial.** Reconexão REST implementada e teste de carrinho/cotação confirmado na TASK-10D; variante de pedido pending resolvido durante desconexão requer verificação própria | REST recupera estado atual sem criar nova compra | TEST-10 |
| SCN-15 | **Parcial.** Logout/troca A→B e descarte de eventos antigos implementados na TASK-10C; controle de resposta privada atrasada ainda planejado | B não vê dados de A; cache/listeners anteriores limpos | TEST-03, TEST-10 |
| SCN-16 | **Parcial.** Desconectar carteira pela interface antes de confirmar; recusa programada de conexão ainda planejada | Checkout bloqueado até conexão válida; nenhum pedido indevido | TEST-07 |
| SCN-17 | **Parcial.** Cotação expira pelo relógio; alteração de cupom participa do teste de reconciliação. Controle dedicado de mudança de taxa ainda planejado | POST revalida mesmo sem evento NFT e exige revisão dos termos alterados | TEST-09 |
| SCN-18 | **Reproduzível.** A adiciona `nft-001` e `nft-002`; finaliza somente Polygon com carteira secundária | Cotação/recibo apenas Polygon; confirmação preserva Ethereum no carrinho | TEST-06, TEST-17 |

## Evidência e limites

Os testes em [catalog.spec.ts](../tests/e2e/catalog.spec.ts), [auth.spec.ts](../tests/e2e/auth.spec.ts), [cart.spec.ts](../tests/e2e/cart.spec.ts), [checkout.spec.ts](../tests/e2e/checkout.spec.ts), [profile.spec.ts](../tests/e2e/profile.spec.ts) e [wallets.spec.ts](../tests/e2e/wallets.spec.ts) contêm preparações e assertions dos fluxos. A publicação de eventos após persistência é exercitada em [domain-events.spec.ts](../tests/e2e/domain-events.spec.ts); validação de versões, identidade e duplicatas também aparece nos [testes unitários](../tests/unit/domain-events.spec.ts).

TASKS registra confirmações do usuário para eventos/isolamento nas TASK-10A/B/C, reconciliação na TASK-10D, recuperação idempotente na TASK-10E e fluxos desktop/mobile dos grupos afetados pela TASK-11. Essas confirmações não substituem relatórios HTML/traces anexados nem comprovam as variantes marcadas como parciais. A prova REST/Socket.IO no deploy inicial comprova o transporte; a avaliação pública dos fluxos atuais pertence ao smoke final da TASK-15.

Ainda não existem os endpoints `/api/__mock/scenario` e `/api/__mock/actions`, nem um painel para selecionar os 18 cenários ou controlar todas as ações. O reset visual disponível restaura somente SCN-01; `VITE_MOCK_SCENARIO` também aceita somente SCN-01. Alguns cenários permanecem parciais porque dependem de gatilhos ausentes, como alteração arbitrária de preço/taxa, reemissão manual de eventos ou atraso artificial da resposta além do timeout do cliente.

O transporte usa WebSocket, namespace padrão e mensagens textuais. A persistência é compartilhada por origem, mas os eventos do mock são publicados para conexões da própria aba; não há broadcast geral entre abas. Testes usam contextos isolados para evitar interferência entre dados mutáveis.
