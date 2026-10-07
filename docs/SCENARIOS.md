# Cenários da simulação

Status: **prova de transporte REST e Socket.IO validada localmente e no deploy Vercel (TASK-03); cenários de domínio ainda planejados**. O bootstrap do worker e `GET /api/__proof` exercitam Axios→MSW. A rota `/__proof` conecta `socket.io-client` após o worker iniciar; `@mswjs/socket.io-binding` converte o evento `proof.event` no mock. O WebSocket padrão `/socket.io/` é normalizado pelo MSW para `/` antes de buscar o handler, por isso o link do mock registra a origem/raiz. A conexão simulada escuta e responde pelo wrapper `client` do binding, conforme seu exemplo de uso. Esse transporte usa WebSocket interceptado, namespace padrão e eventos textuais; não cobre namespaces personalizados, acknowledgements ou binário. Ainda não há banco, fixtures ou reset. Contratos de controle: [API-13](CONTRACTS.md). Uso nos testes: [TEST-MATRIX](TEST-MATRIX.md). REQ-029, REQ-030, REQ-031, REQ-032, REQ-044; DEC-05, DEC-15.

## Fixture padrão

Proposta: 36 NFTs, três categorias, três coleções, diversos criadores, preços distintos e edições com estoque normal/baixo/zero. IDs estáveis `nft-001` a `nft-036`, página com 12 itens. Escolher `nft-001` disponível para compra e auditoria. Imagens finais dependem dos assets do Figma.

Dois usuários seed: `collector-a@example.test` e `collector-b@example.test`, senha fictícia proposta `DemoNft!2026` para ambos. **Credenciais ainda não funcionam.** Na implementação, persistir somente verificadores/salts. A possui carteira principal e secundária; B possui carteira principal e dados privados diferentes. Carrinhos iniciais vazios, favoritos distintos, nenhum pedido. Cupom válido `NFT10` (10%, regra proposta), `EXPIRED` expirado e qualquer código desconhecido inválido.

Relógio-base proposto `2026-01-15T12:00:00Z`, seed fixo, latência normal de 150 ms e pagamento resolvido após 2 s de tempo controlado. Sessão padrão de 30 minutos. Esses valores são escolhas de teste, não requisitos do desafio.

## Controles propostos

Todos são handlers MSW chamados via Axios pelo painel de demonstração ou harness no navegador. Não criar fallback de negócio em hooks. Painel disponível no build de demonstração com rótulo claro de simulação.

- `POST /__mock/reset` com `{scenarioId,seed,now}`: fechar sessões/conexões anteriores e restaurar integralmente banco, idempotência, pedidos/reservas, carrinhos, favoritos, perfil/carteiras, relógio e fila de eventos. O harness limpa storage do navegador por contexto antes do bootstrap. O painel recarrega a aplicação após reset.
- `POST /__mock/scenario` com `{scenarioId}`: selecionar falha/comportamento sem reset implícito; informar no painel o cenário ativo.
- `POST /__mock/clock` com `{advanceMs}`: avançar relógio do domínio, resolver pedidos/expirações vencidos e emitir os eventos correspondentes.
- `POST /__mock/actions` com `{action,payload}`: ações nomeadas para atualizar NFT, expirar sessão, resolver pedido, interromper conexão ou repetir evento. Atualizações reais escrevem o banco primeiro; duplicatas/eventos antigos apenas reemitem pelo socket.
- Configuração proposta `VITE_MOCK_SCENARIO=SCN-01`, aplicada somente na criação do banco/reset, para não destruir persistência a cada refresh. Falhas one-shot são consumidas uma vez e ficam registradas na simulação.

Cada teste tem BrowserContext/storage independentes. Controles de relógio de browser e domínio devem avançar juntos quando ambos afetam o caso. Não usar sleeps arbitrários para disparar/assertar transições.

## Catálogo de cenários

| ID | Preparação / gatilho | Resultado esperado | Testes |
| --- | --- | --- | --- |
| SCN-01 | Reset padrão; pagamento confirma após avanço de relógio | Fluxo completo com dados estáveis | TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-08, TEST-11, TEST-13, TEST-14, TEST-15, TEST-18 |
| SCN-02 | Busca sem correspondência; catálogo continua preenchido | Estado vazio sem erro; limpar filtro recupera resultados | TEST-01 |
| SCN-03 | Primeira busca demora 1500 ms; segunda 100 ms | Resposta antiga não substitui busca atual/URL | TEST-01 |
| SCN-04 | Catálogo, detalhe e carrinho demoram 2000 ms | Skeletons preservam dimensões; conteúdo aparece ao resolver | TEST-12 |
| SCN-05 | Falha de conexão one-shot em GET; depois sucesso | Feedback de rede, retry controlado e recuperação | TEST-12 |
| SCN-06 | GET 503; mutation favorito 503; detalhe 404; recurso alheio 403, selecionáveis | Erros distintos, rollback, retry somente quando aplicável | TEST-02, TEST-03, TEST-04, TEST-12 |
| SCN-07 | Expirar sessão durante navegação ou revisão do checkout | 401, login com retorno; contexto só retoma para dono | TEST-03 |
| SCN-08 | Email seed repetido, perfil inválido, senha atual incorreta, avatar inválido e carteira inválida | 409/422 associados aos campos; sem persistência parcial | TEST-03, TEST-08 |
| SCN-09 | Aplicar código desconhecido ou EXPIRED | Cupom recusado sem desconto indevido; remoção funciona | TEST-05 |
| SCN-10 | NFT no carrinho; ação altera preço ou esgota edição | Banco e EVT-01 sincronizados; resumo muda e checkout exige revisão/correção | TEST-09 |
| SCN-11 | POST pedido persiste e cria pending, mas resposta demora além do timeout Axios | Recuperação pela mesma chave encontra exatamente um pedido | TEST-07 |
| SCN-12 | Resultado programado declined | Recusa terminal, sem recibo confirmado, carrinho preservado | TEST-07 |
| SCN-13 | Emitir atualização v3, repeti-la e depois emitir payload antigo v2 | Estado mantém v3; efeitos não repetidos; REST permanece v3 | TEST-10 |
| SCN-14 | Desconectar socket em pending; resolver pedido no banco; reconectar ou recarregar | REST recupera terminal sem criar compra nova | TEST-10 |
| SCN-15 | A inicia request/evento privado atrasado, sai; B autentica antes da entrega | B não vê dados de A; listeners e cache de A limpos | TEST-03, TEST-10 |
| SCN-16 | Recusar conexão de carteira; em variante, conectar e desconectar antes do envio | Checkout bloqueado e orientação de reconexão; nenhum pedido indevido | TEST-07 |
| SCN-17 | Após revisar cotação, alterar taxa de rede ou validade de cupom sem evento NFT | POST revalida e exige revisão mesmo sem evento | TEST-09 |

## Procedimento de reprodução

Selecionar/resetar cenário no painel → executar o fluxo indicado na matriz → acionar gatilho/avançar relógio quando necessário → observar UI e respostas → voltar a SCN-01 com reset. Na implementação, substituir este procedimento geral por nomes reais dos controles e incluir os comandos verificados no README. Nenhum cenário está marcado como entregue ainda.
