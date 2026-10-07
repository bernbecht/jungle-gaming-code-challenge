# Matriz de testes e evidências

Status: **smoke do shell, E2E REST/Socket.IO e fundação MSW/IndexedDB aprovados pelo usuário; 12 testes unitários do núcleo aprovados pelo agente**. Os E2E dos fluxos de negócio na interface ainda serão implementados. IDs são grupos de verificação, não necessariamente um único `test()`. Os primeiros 12 correspondem diretamente aos 12 grupos da seção 9 do [desafio](../challenge-description.md).

Requisitos: [REQUIREMENTS](../REQUIREMENTS.md). Preparação: [SCENARIOS](SCENARIOS.md). Contratos: [CONTRACTS](CONTRACTS.md). Execução: TASK-13 a TASK-15 em [TASKS](../TASKS.md).

## Cobertura funcional

| ID | Cenários | Procedimento e assertions mínimas | Contratos / UI | Requisitos |
| --- | --- | --- | --- | --- |
| TEST-01 | SCN-01, SCN-02, SCN-03 | Buscar, combinar filtros, ordenar, paginar, voltar/avançar e refresh; URL/API/resultados equivalentes; filtro reinicia página; resposta atrasada não substitui atual; vazio recuperável | API-03, UI-01 | REQ-002, REQ-005, REQ-006, REQ-027, REQ-031, REQ-042 |
| TEST-02 | SCN-01, SCN-06 | Abrir detalhe diretamente, trocar galeria/edição, limitar quantidade; testar esgotado e ID inexistente sem quebrar navegação | API-03, UI-02 | REQ-007, REQ-026, REQ-042 |
| TEST-03 | SCN-01, SCN-06, SCN-07, SCN-08, SCN-15 | Cadastro/conflito, login, guards, refresh, expiração na navegação/checkout, retorno, logout e troca A→B; pedidos/favoritos/cache/respostas antigas de A nunca aparecem para B; acesso alheio negado na API | API-01, API-02, API-09, UI-06, UI-07 | REQ-002, REQ-021, REQ-022, REQ-023, REQ-024, REQ-027, REQ-031, REQ-042 |
| TEST-04 | SCN-01, SCN-06 | Favoritar/desfavoritar; verificar efeito imediato, persistência no refresh e rollback com erro; nova tentativa funciona | API-04, UI-02 | REQ-008, REQ-042 |
| TEST-05 | SCN-01, SCN-09 | Adicionar/editar/remover, estoque e inteiros; aplicar/remover cupons; conferir totais exatos; refresh e login preservam visitante; repetir login/merge não duplica | API-05, API-06, API-07, UI-03 | REQ-009, REQ-010, REQ-011, REQ-012, REQ-030, REQ-031, REQ-042 |
| TEST-06 | SCN-01 | Catálogo→detalhe→carrinho→login→carteira/rede→revisão→pending→confirmed; antes da confirmação não há recibo de sucesso; recibo usa snapshot e transação simulada | API-08, API-09, API-12, UI-01, UI-02, UI-03, UI-04, UI-05 | REQ-002, REQ-003, REQ-014, REQ-018, REQ-020, REQ-042 |
| TEST-07 | SCN-11, SCN-12, SCN-16 | Pagamento/conexão recusados e desconexão preservam itens; duplo clique/timeout recuperam mesmo ID; mesma chave/outro corpo dá conflito; refresh em pending; adicionar itens após envio e conferir baixa exata; alterar catálogo depois e conferir recibo imutável | API-09, API-12, UI-04, UI-05 | REQ-014, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-027, REQ-031, REQ-042 |
| TEST-08 | SCN-01, SCN-08 | Editar perfil/avatar/senha e carteiras principal/secundária; validar campos e erros da API; refresh persiste; senha antiga deixa de autenticar e nova funciona; carteira alterada aparece no checkout | API-10, API-11, UI-08, UI-09 | REQ-002, REQ-003, REQ-024, REQ-030, REQ-031, REQ-042 |
| TEST-09 | SCN-10, SCN-17 | NFT no carrinho: emitir preço/estoque via socket, conferir catálogo/detalhe/resumo/aviso; enviar cotação antiga falha; nova revisão obrigatória; repetir com taxa/cupom alterado sem evento | API-08, API-09, EVT-01, UI-03, UI-04 | REQ-013, REQ-015, REQ-031, REQ-032, REQ-034, REQ-042 |
| TEST-10 | SCN-13, SCN-14, SCN-15 | Evento v3, duplicata e v2; estado não regride; GET antigo também não sobrescreve; desconectar pending e recuperar por REST/refresh; terminal e baixa não repetidos; evento de sessão anterior descartado | API-09, EVT-01, EVT-02, UI-05 | REQ-017, REQ-019, REQ-023, REQ-027, REQ-032, REQ-034, REQ-035, REQ-036, REQ-042 |
| TEST-11 | SCN-01 | Percorrer fluxo com teclado; foco visível e ordem lógica; abrir/fechar diálogo/drawer com retorno de foco; submit inválido associa erros e foca campo; feedback de mutation/evento acessível | UI-04, UI-06, UI-07, UI-10 | REQ-039, REQ-042 |
| TEST-12 | SCN-04, SCN-05, SCN-06 | Skeletons em catálogo/detalhe/resumo, sem salto relevante; reduzir movimento; erro de rede e 503, retry e recuperação; conteúdo estável em atualização de background | API-03, API-05, UI-01, UI-02, UI-03 | REQ-006, REQ-026, REQ-028, REQ-031, REQ-038, REQ-042 |

## Verificações complementares

| ID | Tipo | Procedimento e evidência | Requisitos |
| --- | --- | --- | --- |
| TEST-13 | Visual Playwright | SCN-01; início/detalhe/carrinho/checkout em 390 e 1440 px; snapshots com dados, relógio e fontes estáveis; baselines versionadas e revisadas contra Figma | REQ-037, REQ-043 |
| TEST-14 | Revisão visual/acessibilidade manual | Todas as nove telas em 390/768/1440; frames, composição, imagens/fontes locais, contraste/alt, teclado, reduced motion, zoom 200%, overflow e links auxiliares. Registrar screenshots e ajustes | REQ-003, REQ-004, REQ-026, REQ-037, REQ-038, REQ-039, REQ-040 |
| TEST-15 | Lighthouse | SCN-01 no build otimizado; início e nft-001 × desktop/mobile × três medições; entregar HTML/JSON, medianas de categorias, LCP/CLS/TBT, ambiente/versões e causas de desvios | REQ-045, REQ-046 |
| TEST-16 | Estrutural/reprodutibilidade | Checkout limpo, instalação lockfile, tipos/lint/build; conferir stack efetiva, contratos, ownership nos mocks, cleanup, senhas sem claro, reset completo, E2E executável e isolado, HTML/traces, scripts e docs reais | REQ-001, REQ-024, REQ-025, REQ-028, REQ-029, REQ-030, REQ-032, REQ-033, REQ-036, REQ-040, REQ-041, REQ-044, REQ-047, REQ-049, REQ-050 |
| TEST-17 | Unidade/domínio complementar | Casos de ETH com 18 casas, soma/desconto/taxa sem perda; fingerprint/idempotência, transições terminais e remoção apenas dos lotes comprados. Complementa, não substitui E2E | REQ-012, REQ-016 |
| TEST-18 | Smoke público | Registrar commit/URL; em contexto limpo abrir rotas diretamente e refresh, autenticar, comprar, emitir atualização pelo mock, recuperar pedido; conferir assets/worker e ausência de dependência privada | REQ-033, REQ-048 |

## Política de execução

- Chromium com projetos desktop 1440 px e mobile 390 px nos grupos TEST-01 a TEST-12. Tablet 768 px entra na revisão TEST-14. Alturas propostas 900/844/1024 respectivamente; registrar valores finais na configuração.
- Cada teste cria contexto isolado e reseta cenário. Não compartilhar usuários mutáveis/storage entre testes concorrentes.
- Testes de produto usam requests Axios da aplicação e handlers MSW; tempo real atravessa socket.io-client. Controles SCN apenas configuram o domínio/mock.
- Controlar relógio, latência e emissão, evitando sleeps arbitrários. Assertions observam UI e resultados; não usar alteração direta de cache como preparação.
- Screenshots aguardam fontes/imagens e desativam animações para estabilidade; shimmer e reduced motion têm verificação própria em TEST-12.
- Relatório HTML a cada execução; trace retido nas falhas. Registrar resultado bruto antes de retry, evitando mascarar instabilidade.
- Falhas financeiras ou de sessão impedem declarar o fluxo atendido. Baselines não devem ser atualizadas automaticamente para silenciar diferenças.

## Registro de evidências

Preencher uma linha por grupo/projeto executado. `Não executado` é diferente de `Falhou` e de `Passou`. Se teste comprova apenas parte de um requisito, manter a parte restante pendente.

| Teste / projeto | Commit | Resultado | Relatório/trace/screenshot | Observações |
| --- | --- | --- | --- | --- |
| TEST-16 (tipos/lint/build) | Árvore de trabalho | Passou parcialmente | Comandos registrados abaixo | Não comprova fluxos nem checkout limpo |
| Smoke shell (desktop/mobile) | Terminal local do usuário | Passou, conforme confirmação do usuário em 07/10/2026 | `npm run test:e2e`; ambiente local do usuário | Runner da sandbox tentou executar mas webServer foi bloqueado por EPERM; sem trace local acessível |
| Prova REST e Socket.IO via MSW | Árvore de trabalho | Passou manualmente no navegador, conforme confirmação do usuário em 07/10/2026 | `/__proof`; confirmação do usuário, sem relatório/trace anexado | REST aprovado anteriormente; após corrigir o lado do binding, o usuário confirmou que o reteste Socket.IO passou. O matcher validado isoladamente: MSW normaliza `/socket.io/` para `/`. Deploy ainda pendente (TEST-18). |
| E2E da prova REST e Socket.IO via MSW (desktop/mobile) | Commit `81534f9` | Passou, conforme confirmação do usuário em 07/10/2026 | `npm run test:e2e`; terminal local do usuário | Relatório/trace não acessível nesta sessão. Deploy ainda pendente (TEST-18). |
| TEST-18 — smoke do deploy inicial (TASK-03) | `4047da3` / `dpl_HLZFEAJ95RT29n9ipfAHJHzKaMnj` | Passou em 07/10/2026, observado pelo agente | https://jungle-gaming-code-challenge.vercel.app/__proof; Chrome e janela anônima | Home, acesso direto/refresh da rota, REST e Socket.IO aprovados sem login na Vercel. Provas confirmam worker e interceptação. Fluxos de negócio e smoke final permanecem pendentes na TASK-15. |
| Demais grupos | — | Não executado | — | A implementar |
| TEST-17 — núcleo financeiro/idempotência (parcial) | Árvore de trabalho TASK-04 | 12 testes unitários passaram, executados pelo agente | `npm run test:unit`; `tests/unit/marketplace.spec.ts` | Precisão wei, filtros/paginação, fixtures, fingerprint, cotação alterada, reserva, recusa, snapshot e remoção de lotes. Não comprova checkout na interface. Typecheck, lint e build também passaram. |
| Fundação MSW/IndexedDB — catálogo, refresh e reset | Árvore de trabalho TASK-04 | Passou, conforme confirmação do usuário em 07/10/2026 | `npm run test:e2e`; `tests/e2e/mock-foundation.spec.ts`; terminal local do usuário | Suíte desktop/mobile, incluindo shell e provas REST/Socket.IO. Relatório/trace não anexado. Tentativa do agente bloqueada antes dos testes por `listen EPERM` em `127.0.0.1:4173`. Não comprova fluxos de catálogo/compra na interface. |

## Evidência de referência visual (não é execução de teste)

Em 06/10/2026 foram inspecionados os 15 PNGs originais em UI-SPEC. Dimensões desktop: 1440 px de largura; mobile: 414 × 896. TEST-13/TEST-14 devem incluir comparação adicional em 414 px, mantendo as larguras obrigatórias. Ainda não existem screenshots da aplicação para comparar; não registrar esta análise como teste aprovado.

## TEST-16 — verificação parcial da TASK-02

Base escrita; **aceite ainda pendente**. Passaram: sintaxe TS/TSX de 20 arquivos usando TypeScript 5.9.3 do cache, resolução dos imports locais `@/`, parsing JSON/SVG, `node --check` de ESLint/script Lighthouse e `git diff --check`. Essas verificações não resolvem tipos de dependências nem executam a aplicação.

Após instalação pelo usuário, npm ls, typecheck completo, lint e build passaram; lockfile presente. Vite 7.3.7 promovido a dependência direta com a mesma resolução/integridade; npm ci --dry-run offline passou. Licença da fonte incluída em dist. Playwright iniciou no terminal do usuário e o smoke desktop/mobile passou, conforme confirmação em 07/10/2026. O runner da sandbox continua bloqueado com listen EPERM em 127.0.0.1:4173; não há relatório local acessível. `tests/e2e/shell.spec.ts` está preparado para Chromium desktop/mobile; não cobre API/socket nem substitui os 12 grupos exigidos. TEST-18/deploy continuam pendentes.

## Evidência TASK-05 — 07/10/2026

- 14 testes unitários passaram na árvore de trabalho: 12 anteriores e dois de normalização/serialização de URL (`tests/unit/catalog-search.spec.ts`). Typecheck, lint e build passaram.
- `tests/e2e/catalog.spec.ts` prepara TEST-01 (busca/filtros/ordenação/paginação/histórico), TEST-02 (detalhe/galeria/limites/404) e parte de TEST-12 (shimmer lento, resposta antiga, falha 503 e retry), em desktop/mobile, com reset por teste e controle MSW de rede.
- E2E **não executado**: servidor preview bloqueado antes das assertions por `listen EPERM` em `127.0.0.1:4173`. Aprovação da TASK-04 não valida estes novos testes. Execução local e revisão visual 390/768/1440 pendentes; sem screenshots/baselines desta etapa.
