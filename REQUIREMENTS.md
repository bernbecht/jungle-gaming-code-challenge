# Requisitos da entrega

Fonte normativa: [challenge-description.md](challenge-description.md). Este documento organiza o enunciado sem substituí-lo. Em caso de divergência, corrigir a documentação derivada conforme o desafio.

## Convenções e rastreabilidade

- `REQ-*`: requisitos deste documento; `TASK-*`: [tarefas](TASKS.md); `DEC-*`: [decisões](ARCHITECTURE.md).
- `API-*` e `EVT-*`: [contratos](docs/CONTRACTS.md); `UI-*`: [interface](docs/UI-SPEC.md).
- `SCN-*`: [cenários](docs/SCENARIOS.md); `TEST-*`: [verificações](docs/TEST-MATRIX.md); `REL-*`: [entrega](docs/RELEASE.md).
- IDs são permanentes. Não renumerar itens existentes; novos itens recebem novos IDs. IDs nas tabelas definem os itens, referências em outras tabelas apontam para esses itens.
- **E** = eliminatório explicitamente citado na seção 11; **O** = obrigatório; **M** = meta com justificativa permitida se não atingida.
- Todos os requisitos estão **pendentes de implementação/verificação**. Documentar ou planejar um item não comprova atendimento. Evidências e resultados ficam na matriz de testes e no registro de entrega.
- Regras de projeto que não vieram do enunciado são identificadas como decisões em ARCHITECTURE; não são novos critérios da avaliação.

## Stack e escopo

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-001 | E | §2, §11 | Usar efetivamente React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse | TASK-02, TASK-03, TASK-14 | TEST-16 |
| REQ-002 | E | §1, §3, §11 | Fluxos de descoberta, compra e conta funcionais, integrados a APIs, autenticação, carteiras e pagamentos simulados | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | TEST-01, TEST-03, TEST-06, TEST-08 |
| REQ-003 | O | §1, §3 | Implementar as nove telas: início, detalhe, carrinho, pagamento, confirmação, login, cadastro, perfil e carteiras | TASK-05, TASK-05A, TASK-06, TASK-07, TASK-08, TASK-09 | TEST-06, TEST-08, TEST-14 |
| REQ-004 | O | §1, §3 | Seguir frames desktop/mobile; adaptar perfil, carteiras e confirmação para mobile; ações auxiliares coerentes sem falso sucesso | TASK-01, TASK-05A, TASK-12 | TEST-14 |

## Catálogo e carrinho

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-005 | O | §3 | Busca, filtros combinados, ordenação e paginação na URL, persistentes em refresh/histórico; filtros reiniciam página | TASK-05 | TEST-01 |
| REQ-006 | O | §3, §4 | API respeita parâmetros; tratar vazio, falhas e respostas fora de ordem | TASK-04, TASK-05 | TEST-01, TEST-12 |
| REQ-007 | O | §3 | Detalhe com galeria, informações, edição, quantidade, acesso direto, NFT inexistente, edição indisponível e limites | TASK-05 | TEST-02 |
| REQ-008 | O | §3, §4 | Favoritos autenticados persistentes; interação otimista com rollback em pelo menos uma operação | TASK-06 | TEST-04 |
| REQ-009 | O | §3 | Adicionar, alterar e remover itens por NFT/edição, com quantidades inteiras e estoque respeitado | TASK-07 | TEST-05 |
| REQ-010 | O | §3 | Carrinho persistente em refresh e itens de visitante preservados ao autenticar | TASK-07 | TEST-05 |
| REQ-011 | O | §3 | Aplicar/remover cupom; tratar inválido/expirado; subtotal, desconto, taxa e total coerentes com API | TASK-07 | TEST-05 |
| REQ-012 | O | §3 | ETH como strings decimais, precisão nos cálculos/apresentação e cotação da API como referência | TASK-04, TASK-07, TASK-08 | TEST-05, TEST-17 |
| REQ-013 | O | §3, §7 | Mudanças de preço/estoque no carrinho geram feedback e atualização do resumo | TASK-10 | TEST-09 |

## Compra e pedidos

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-014 | O | §3 | Validar campos do layout, selecionar carteira cadastrada/rede, simular conexão/recusa/desconexão e permitir revisão | TASK-08, TASK-09 | TEST-06, TEST-07 |
| REQ-015 | O | §3, §7 | Revalidar preço, disponibilidade, cupom e taxas; mudanças exigem nova confirmação | TASK-08, TASK-10 | TEST-09 |
| REQ-016 | O | §3, §5 | Criação idempotente: cliques/reenvios recuperam mesmo pedido; mesma chave com conteúdo diferente gera conflito | TASK-04, TASK-08 | TEST-07, TEST-17 |
| REQ-017 | O | §3, §7 | Pedidos pendentes, confirmados e recusados; recuperação após refresh/reconexão; estados terminais não regridem | TASK-08, TASK-10 | TEST-07, TEST-10 |
| REQ-018 | E | §3, §11 | Mostrar confirmação somente após pedido confirmado na simulação | TASK-08 | TEST-06, TEST-07 |
| REQ-019 | O | §3 | Falhas preservam itens; confirmação remove apenas itens/quantidades comprados e não reaplica efeitos | TASK-08, TASK-10 | TEST-07, TEST-10 |
| REQ-020 | O | §3 | Recibo imutável com snapshot, transação simulada, itens, taxas e total; exploração identificada como simulada | TASK-08 | TEST-06, TEST-07 |

## Conta, sessão e integração

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-021 | O | §3 | Cadastro, login, logout e sessão via API; checkout, perfil, carteiras, favoritos e pedidos autenticados | TASK-06 | TEST-03 |
| REQ-022 | O | §3 | Recuperar sessão após refresh; expiração na navegação/checkout preserva contexto para retomada | TASK-06, TASK-11 | TEST-03 |
| REQ-023 | E | §3, §4, §7, §11 | Isolar dados por usuário; logout/troca limpam caches/subscriptions e impedem respostas/eventos antigos de expor dados | TASK-06, TASK-10 | TEST-03, TEST-10 |
| REQ-024 | O | §3 | Validar cadastro, perfil, avatar, senha e carteiras com erros da API e persistência; credenciais fictícias sem senhas em claro | TASK-06, TASK-09 | TEST-03, TEST-08, TEST-16 |
| REQ-025 | O | §4, §5 | Contratos tipados; Router em rotas/search/guards; Query em consultas/mutations/cache; Axios em REST | TASK-02, TASK-04 | TEST-16 |
| REQ-026 | O | §4 | Loading, vazio, erro, sucesso e atualização em segundo plano; rotas inexistentes e acesso direto | TASK-05, TASK-12 | TEST-02, TEST-12, TEST-14 |
| REQ-027 | O | §4 | Invalidar cache coerentemente, descartar/cancelar respostas obsoletas, isolar parâmetros e recuperar sem duplicação | TASK-05, TASK-06, TASK-10 | TEST-01, TEST-03, TEST-07, TEST-10 |
| REQ-028 | O | §4, §5 | Documentar REST mínimo, eventos, cache/retry/sincronização; representar validação, 401, 403, 404, conflitos e falhas transitórias | TASK-04, TASK-15 | TEST-12, TEST-16 |

## Mocks e eventos

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-029 | O | §6 | Mocks na rede, sem dados fictícios/caminhos de negócio alternativos em componentes, hooks ou Axios | TASK-03, TASK-04 | TEST-16 |
| REQ-030 | O | §6 | Estado consistente entre recursos, persistência, reset integral, fixtures com filtros/paginação e pelo menos dois usuários | TASK-04, TASK-11 | TEST-05, TEST-08, TEST-16 |
| REQ-031 | O | §6 | Cenários reproduzíveis de sucesso/vazio, lentidão/desordem, rede/4xx/5xx, sessão/permissão, validação, cupons, preço/estoque, timeout e pagamento | TASK-11 | TEST-01, TEST-03, TEST-05, TEST-07, TEST-08, TEST-09, TEST-12 |
| REQ-032 | E | §6, §11 | MSW intercepta integração compatível com Socket.IO exercitando socket.io-client; sem eventos injetados diretamente na UI/cache | TASK-03, TASK-10 | TEST-09, TEST-10, TEST-16 |
| REQ-033 | O | §6, §12 | Mocks ativados por configuração, presentes no build público; REST e eventos refletem mesmo estado; documentar transporte/limitações | TASK-03, TASK-10, TASK-15 | TEST-16, TEST-18 |
| REQ-034 | O | §7 | nft.updated atualiza preço/estoque em catálogo/detalhe/carrinho; order.updated atualiza pedido e resultado | TASK-10 | TEST-09, TEST-10 |
| REQ-035 | O | §7 | Eventos com ID estável, recurso e versão; duplicatas/antigos não regridem estado nem repetem efeitos | TASK-10 | TEST-10 |
| REQ-036 | O | §7 | Reconexão reconcilia recursos ativos por REST; liberar listeners/subscriptions no ciclo de vida | TASK-10 | TEST-10, TEST-16 |

## Interface e evidências

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-037 | O | §8 | Fidelidade visual ao Figma, shadcn adaptado, responsividade em 390/768/1440 px | TASK-01, TASK-05A, TASK-12 | TEST-13, TEST-14 |
| REQ-038 | O | §8 | Skeletons com shimmer em catálogo/detalhe/resumo, dimensões estáveis e reduced motion | TASK-12 | TEST-12, TEST-14 |
| REQ-039 | O | §8 | Teclado, foco visível/controlado, semântica, labels/erros associados, alt, contraste, feedback acessível, zoom sem perda/overflow | TASK-12 | TEST-11, TEST-14 |
| REQ-040 | O | §8 | Imagens/fontes locais, assets do Figma quando disponíveis; registrar substituições e ajustes de acessibilidade | TASK-01, TASK-12 | TEST-14, TEST-16 |
| REQ-041 | E | §9, §11 | Entregar testes E2E executáveis | TASK-03, TASK-13 | TEST-16 |
| REQ-042 | O | §9 | Cobrir os 12 grupos E2E do desafio; fluxos principais em Chromium desktop/mobile | TASK-13 | TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-11, TEST-12 |
| REQ-043 | O | §9 | Regressão visual de início/detalhe/carrinho/pagamento, baselines versionadas e dados estáveis | TASK-13 | TEST-13 |
| REQ-044 | O | §9 | Testes isolados; relógio/latência/eventos controlados; assertions de UI/resultados via MSW/socket; HTML report e traces de falhas | TASK-11, TASK-13 | TEST-16 |
| REQ-045 | O | §10 | Lighthouse no build otimizado: início/detalhe × mobile/desktop × 3; medianas, HTML/JSON, configuração, versões/ambiente e LCP/CLS/TBT | TASK-14 | TEST-15 |
| REQ-046 | M | §10 | Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90; justificar desvios e causas sem simplificar a aplicação na auditoria | TASK-14 | TEST-15 |

## Entrega

| ID | Classe | Origem | Exigência verificável | Implementação | Verificação |
| --- | --- | --- | --- | --- | --- |
| REQ-047 | O | §12 | Código, lockfile, assets, mocks, fixtures, testes e configurações de auditoria entregues | TASK-15 | TEST-16 |
| REQ-048 | O | §12 | Repositório e URL pública, mesma versão, disponíveis na avaliação, mocks/socket e refresh/acesso direto funcionais | TASK-03, TASK-15 | TEST-18 |
| REQ-049 | O | §12 | README com setup, env, credenciais, seleção/reset/cenários e comandos; ARCHITECTURE com sessão/carrinho/cache/reconciliação/UX/limitações/desvios | TASK-15 | TEST-16 |
| REQ-050 | O | §12 | Comandos dev/build/preview/tipos/lint/Playwright/Lighthouse e execução de checkout limpo sem serviços privados | TASK-02, TASK-15 | TEST-16 |

## Fora do escopo

Blockchain real, extensões de carteira e gateways reais; páginas editoriais, suporte, atividade, ofertas e downloads (§1 e §3). Não criar implementações fictícias que aparentem sucesso dessas ações. Build tool, estrutura de pastas e bibliotecas complementares são escolhas de implementação.
