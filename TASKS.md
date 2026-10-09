# Backlog de execução

Cronograma: [ROTEIRO.md](ROTEIRO.md). Requisitos: [REQUIREMENTS.md](REQUIREMENTS.md). As dependências abaixo representam ordem técnica; não pressupõem trabalho por múltiplos agentes.

Itens sem execução permanecem em **A fazer**. Estados permitidos: A fazer → Em andamento → Em verificação → Concluído; Bloqueado deve incluir motivo. Adiada indica trabalho postergado por decisão do usuário, com condição de retomada registrada. Uma tarefa só é concluída com critérios de aceite e evidências dos testes indicados, sem marcar requisitos atendidos apenas por existir código.

## Situação atual — 08/10/2026

- [x] Roteiro de desenvolvimento criado em [ROTEIRO](ROTEIRO.md).
- [x] Documentação inicial criada: requisitos, tarefas, arquitetura, contratos propostos, interface, cenários, matriz de testes, entrega e README.
- [x] IDs e links locais da documentação validados.
- [x] Todas as 15 screenshots analisadas; inventário, dimensões, cores e diferenças desktop/mobile registrados em [UI-SPEC](docs/UI-SPEC.md).
- [x] Lacunas de contratos e inconsistências nas referências documentadas.
- [x] Resolver a abordagem das pendências visuais: fonte semelhante, placeholders temporários e layouts próprios (DEC-16, DEC-17, DEC-18).
- [x] Iniciar implementação da aplicação pela TASK-02 (arquivos da base preparados).
- [x] Instalar dependências, gerar lockfile e validar tipos/lint/build.
- [x] Smoke Playwright inicial do shell desktop/mobile executado pelo usuário e aprovado.

**Resumo:** TASK-01 a TASK-05A, TASK-07/08, TASK-09A/B/C/D, TASK-10A/B/C/D/E e TASK-11 concluídas; TASK-06 em andamento (resposta privada antiga após troca/reset ainda sem E2E dedicado); TASK-12 e suas subtarefas adiadas até nova análise; TASK-13 em andamento (regressão visual implementada); TASK-14/15 a fazer. A prova REST/Socket.IO está publicada e validada na Vercel. A entrega final pertence à TASK-15.

## Tarefas

**Decisão — 08/10/2026:** por solicitação do usuário, a **TASK-12 e todas as subtarefas TASK-12A a TASK-12F ficam adiadas até uma nova análise, sem prazo de retomada**. Antes de iniciar a implementação, revisar o relatório e a situação atual da aplicação para definir escopo, prioridades e ordem de execução. O relatório, as 51 screenshots e as medições estão preservados para versionamento em [docs/evidence/task12-browser-review/RELATORIO.md](docs/evidence/task12-browser-review/RELATORIO.md), conforme solicitação do usuário. Os achados permanecem como pendências e não representam critérios concluídos ou aceite integral da TASK-12. Retomar a execução da TASK-12 somente após essa análise e a confirmação do usuário sobre o trabalho a realizar. O relatório retrata a versão observada durante a revisão; alterações posteriores exigem nova validação.

| ID | Dia / bloco do roteiro | Trabalho e critérios de aceite | Dependências | Requisitos | Testes | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-01 | 1 / 1 | Analisar referências; preencher frames, tokens e assets em UI-SPEC; documentar pendências sem inventar medidas | — | REQ-004, REQ-037, REQ-040 | TEST-14 (posterior, na TASK-12) | Concluído |
| TASK-02 | 1 / 1 | Inicializar Vite/React/TS e stack; providers/router; scripts, lockfile e env; shell com shadcn/Tailwind; escolher fonte local semelhante (DEC-16) e preparar placeholders (DEC-17) | — | REQ-001, REQ-025, REQ-050 | TEST-16 parcial + smoke shell | Concluído |
| TASK-03 | 1 / 1 | Provar Axios→MSW e MSW→Socket.IO→cliente no build; smoke Playwright; primeiro deploy com rota interna | TASK-02 | REQ-001, REQ-029, REQ-032, REQ-033, REQ-041, REQ-048 | TEST-16, TEST-18 | Concluído |
| TASK-04 | 1 / 2 | Implementar contratos, dinheiro exato, banco versionado, fixtures com placeholders locais (DEC-17), reset e núcleo de cotação/pedidos | TASK-03 | REQ-006, REQ-012, REQ-016, REQ-025, REQ-028, REQ-029, REQ-030 | TEST-16, TEST-17 | Concluída |
| TASK-05 | 1 / 3 | Base da home (hero/catálogo) e detalhe; URL validada, filtros combinados, API parametrizada, cancelamento, galeria e estados | TASK-01, TASK-04 | REQ-002, REQ-003, REQ-005, REQ-006, REQ-007, REQ-026, REQ-027 | TEST-01, TEST-02, TEST-12 | Concluída |
| TASK-05A | 1 / 3 (complemento visual) | Finalizar a composição da home conforme o PNG desktop: destaque sob os filtros, banners abaixo do catálogo, cards editoriais, transições/espaçamentos e footer; adaptar a composição mobile/tablet sem inventar conteúdo ausente | TASK-01; base de home da TASK-05 | REQ-003, REQ-004, REQ-037, REQ-040 | TEST-19; comparação com UI-01 em TEST-14 (TASK-12) | Concluída |
| TASK-06 | 1 / 4 | Cadastro/login/logout/guards, retorno interno, recuperação de sessão, isolamento e favorito otimista com rollback (FLOW-03, FLOW-04) | TASK-04, TASK-05 | REQ-002, REQ-003, REQ-008, REQ-021, REQ-022, REQ-023, REQ-024, REQ-027 | TEST-03, TEST-04 | Em andamento |
| TASK-07 | 1 / 4 | Carrinho persistente, merge idempotente de visitante, estoque, cupom e totais retornados pela API | TASK-06 | REQ-002, REQ-003, REQ-009, REQ-010, REQ-011, REQ-012 | TEST-05, TEST-17 | Concluída |
| TASK-08 | 4 / 5 | Checkout com carteiras seed; conexão/rede, revisão, cotação revalidada, pedido idempotente e recibo; refresh recupera tentativa | TASK-07 | REQ-002, REQ-003, REQ-012, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020 | TEST-06, TEST-07, TEST-17 | Concluída |
| TASK-09 (épico) | 2 / 7 | Completar gestão de perfil, avatar, senha e carteiras; concluir quando todas as subtarefas passarem no TEST-08 | TASK-08 | REQ-002, REQ-003, REQ-014, REQ-024 | TEST-08 | Concluída |
| TASK-09A | 2 / 7 | Implementar consulta/edição dos dados do perfil; validar campos e versão, persistir alterações e exibir erros da API | TASK-08 | REQ-002, REQ-003, REQ-024 | TEST-08A | Concluída |
| TASK-09B | 2 / 7 | Implementar envio, validação e remoção do avatar; validar arquivo/tamanho, persistir a escolha e mostrar erros sem salvar parcialmente | TASK-09A | REQ-003, REQ-024 | TEST-08B | Concluída |
| TASK-09C | 2 / 7 | Implementar alteração de senha com senha atual/nova; atualizar verificador com salt, sem persistir texto em claro; confirmar que senha antiga falha e nova autentica | TASK-09A | REQ-024 | TEST-08C, TEST-03 | Concluída |
| TASK-09D | 2 / 7 | Implementar cadastro e edição das carteiras principal/secundária; validar endereço/rede/slot, persistir e refletir alterações no checkout | TASK-08 | REQ-014, REQ-024 | TEST-08D, TEST-06 | Concluída |
| TASK-10 (épico) | 2 / 8 | Implementar eventos de domínio versionados, isolamento de sessão, reconciliação REST após reconexão e recuperação idempotente de pedidos | TASK-08 | REQ-013, REQ-015, REQ-017, REQ-019, REQ-023, REQ-027, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036 | TEST-09, TEST-10 | Concluído |
| TASK-10A | 2 / 8 | Publicar EVT-01/EVT-02 somente após persistir mudanças de NFT e pedido, com identidade, versão e dados coerentes | TASK-08 | REQ-013, REQ-017, REQ-032 | TEST-09 | Concluída |
| TASK-10B | 2 / 8 | Consumir eventos no cliente com deduplicação, comparação de versão, proteção contra regressão de estado e invalidação das queries afetadas | TASK-10A | REQ-013, REQ-015, REQ-034, REQ-035 | TEST-09 | Concluída |
| TASK-10C | 2 / 8 | Limpar listeners, conexões e estado privado ao fazer logout ou trocar de usuário, impedindo que respostas/eventos da sessão anterior contaminem a nova | TASK-06, TASK-10B | REQ-023, REQ-027, REQ-034 | TEST-10 | Concluída |
| TASK-10D | 2 / 8 | Ao reconectar Socket.IO, reconciliar por REST os recursos afetados; atualizar cotação e exigir nova revisão se preço, estoque ou taxa mudou | TASK-10B | REQ-015, REQ-032, REQ-033, REQ-034, REQ-035 | TEST-09, TEST-10 | Concluída |
| TASK-10E | 2 / 8 | Recuperar pedidos após timeout, refresh ou resposta perdida usando a mesma chave de idempotência, sem duplicar pedido, baixa de estoque ou limpeza do carrinho | TASK-10C, TASK-10D | REQ-017, REQ-019, REQ-023, REQ-036 | TEST-10 | Concluída |
| TASK-11 | 2 / 8 | Completar controles determinísticos para os cenários cobertos; reset reproduzível e registro da disponibilidade/limites dos casos de SCENARIOS | TASK-09, TASK-10 | REQ-022, REQ-030, REQ-031, REQ-044 | TEST-03, TEST-07, TEST-08, TEST-12, TEST-16 | Concluída |
| TASK-11A | 2 / 8 | Controlar e verificar expiração de sessão com o relógio simulado; preservar returnTo e permitir autenticação e retomada após 401 | TASK-06, TASK-10 | REQ-022, REQ-031, REQ-044 | TEST-03 | Concluída |
| TASK-11B | 2 / 8 | Completar controles determinísticos de latência, erro de rede e respostas 4xx/5xx para os recursos cobertos por TEST-07/08/12 | TASK-11A | REQ-030, REQ-031, REQ-044 | TEST-07, TEST-08, TEST-12 | Concluída |
| TASK-11C | 2 / 8 | Tornar o reset/preparação de SCN-01 reproduzível, limpando de forma coerente o estado do navegador e da simulação; documentar a ausência de seleção dos demais cenários | TASK-11A, TASK-11B | REQ-030, REQ-031, REQ-044 | TEST-16 | Concluída |
| TASK-11D | 2 / 8 | Fechar cobertura dos cenários publicados, documentar limites reais e validar execuções E2E desktop/mobile dos grupos afetados | TASK-11A, TASK-11B, TASK-11C | REQ-031, REQ-044 | TEST-03, TEST-07, TEST-08, TEST-12, TEST-16 | Concluída |
| TASK-12 (épico) | 2 / 9 | Concluir revisão visual, responsiva e de acessibilidade de todas as telas; aceite quando TASK-12A a TASK-12F estiverem concluídas com evidências | TASK-05A, TASK-09, TASK-10 | REQ-004, REQ-026, REQ-037, REQ-038, REQ-039, REQ-040 | TEST-11, TEST-12, TEST-13, TEST-14 | Adiada — aguarda nova análise |
| TASK-12A | 2 / 9 | Revisar fidelidade visual das nove telas contra os PNGs disponíveis, incluindo a home completa da TASK-05A; ajustar composição, tokens, tipografia e imagens locais e documentar substituições DEC-16/DEC-17 | TASK-05A, TASK-09, TASK-10 | REQ-004, REQ-037, REQ-040 | TEST-14 | Adiada — aguarda nova análise |
| TASK-12B | 2 / 9 | Ajustar todas as telas em 390/768/1440, adaptações DEC-18 e favoritos; resolver o follow-up de navegação global mobile, barras fixas/safe-area e zoom 200%, sem conteúdo coberto ou overflow indevido | TASK-12A | REQ-004, REQ-037, REQ-039 | TEST-14 | Adiada — aguarda nova análise |
| TASK-12C | 2 / 9 | Revisar loading/vazio/erro/sucesso e atualização em background; assegurar skeletons com shimmer e dimensões estáveis em catálogo/detalhe/resumo, respeitar reduced motion e verificar retry/recuperação | TASK-12B; controles da TASK-11B/C | REQ-026, REQ-038 | TEST-12, TEST-14 | Adiada — aguarda nova análise |
| TASK-12D | 2 / 9 | Revisar teclado, ordem e visibilidade de foco, contenção/retorno em diálogo e drawer, semântica, labels/erros associados, alt, contraste e feedback acessível de mutations/eventos | TASK-12B, TASK-12C | REQ-039 | TEST-11, TEST-14 | Adiada — aguarda nova análise |
| TASK-12E | 2 / 9 | Revisar ações auxiliares e destinos do shell, autenticação, detalhe, conteúdo editorial e footer; garantir ação coerente ou aviso acessível de indisponibilidade, sem falso sucesso | TASK-12B, TASK-12D | REQ-004, REQ-026, REQ-039 | TEST-11, TEST-14 | Adiada — aguarda nova análise |
| TASK-12F | 2 / 9 | Consolidar aceite visual/responsivo/acessível: capturas das nove telas e favoritos em 390/768/1440, snapshots estáveis de início/detalhe/carrinho/checkout em 390/1440 e evidências/desvios em UI-SPEC/TEST-MATRIX | TASK-12A, TASK-12B, TASK-12C, TASK-12D, TASK-12E | REQ-004, REQ-026, REQ-037, REQ-038, REQ-039, REQ-040 | TEST-11, TEST-12, TEST-13, TEST-14 | Adiada — aguarda nova análise |
| TASK-13 | 1 / 6 e 2 / 10 | Criar testes junto dos fluxos; consolidar 12 grupos, desktop/mobile, baselines revisadas, HTML e traces | TASK-03; conclusão após TASK-11, TASK-12 | REQ-041, REQ-042, REQ-043, REQ-044 | TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-11, TEST-12, TEST-13, TEST-16 | Em andamento |
| TASK-14 | 2 / 11 | Auditar cedo; concluir 12 medições no build final, medianas/métricas, HTML/JSON e análise de desvios | TASK-12 | REQ-001, REQ-045, REQ-046 | TEST-15 | A fazer |
| TASK-15 | 2 / 12 | Atualizar docs para implementação real, checkout limpo, entregar artefatos, deploy final e smoke público | TASK-13, TASK-14 | REQ-028, REQ-033, REQ-047, REQ-048, REQ-049, REQ-050 | TEST-16, TEST-18 | A fazer |

## Marcos

- **Fundação:** TASK-03 demonstra integração no ambiente público antes de expandir a aplicação.
- **Fim do dia 1:** TASK-08 e primeira execução de TEST-06 em desktop/mobile; comprar e recuperar após refresh.
- **Entrega:** TASK-15 e todos os gates de RELEASE executados. Falhas obrigatórias continuam registradas como pendências.

## Registro de execução

Ao trabalhar em uma tarefa, registrar aqui: ID, status, commit/arquivo, verificação realizada, resultado e próximo passo. Registro inicial abaixo.

### TASK-01 — 06/10/2026

Analisadas as 15 screenshots (9 desktop, 6 mobile), dimensões verificadas e paleta raster amostrada. Evidência documental em [UI-SPEC](docs/UI-SPEC.md). Inspeção identificou variantes mobile, formulários além dos contratos v0 e inconsistências nos dados ilustrativos. A abordagem de fonte/assets e adaptações sem referência foi resolvida pelas decisões do usuário DEC-16, DEC-17 e DEC-18. A execução foi distribuída nas tarefas de implementação; semântica de campos, controles ambíguos e comparação com aplicação permanecem nessas tarefas. TEST-14 não foi executado: ainda não há UI implementada.

Checklist da TASK-01:

- [x] Inventariar e analisar as nove screenshots desktop e seis mobile.
- [x] Registrar links e dimensões dos arquivos.
- [x] Amostrar cores e distinguir valores medidos de estimativas.
- [x] Mapear composição, componentes reutilizáveis e campos visíveis.
- [x] Identificar telas/estados sem referência e discrepâncias entre PNGs.
- [x] Definir abordagem de fonte: escolher semelhante local em TASK-02; revisar em TASK-12 (DEC-16).
- [x] Definir alternativa de assets: placeholders temporários locais em TASK-02/TASK-04/TASK-05; revisar em TASK-12 (DEC-17).
- [x] Registrar diretrizes próprias para tablet e mobile ausente em UI-SPEC; implementar em TASK-05/TASK-08/TASK-09 e revisar em TASK-12 (DEC-18).

Semântica dos campos e revisão dos DTOs identificadas nesta análise serão resolvidas em TASK-04/TASK-09; controles auxiliares e ajustes de acessibilidade serão tratados em TASK-12. Comparação da aplicação com as referências e execução de TEST-14 pertencem à TASK-12; não são necessárias para comprovar que a análise documental foi realizada, nem estão concluídas por ela.

## Regra de atualização do progresso

Ao encerrar cada etapa, atualizar o status da tarefa e marcar os critérios realmente concluídos. Registrar arquivos/evidências, verificações executadas, pendências e próximo passo. Trabalho parcial fica explícito no checklist; não marcar a tarefa inteira como concluída antes do aceite. Resultados de testes ficam em [TEST-MATRIX](docs/TEST-MATRIX.md), sem confundir revisão documental com teste da aplicação.

### Encerramento da TASK-01 — 06/10/2026

Análise documental concluída com base nos PNGs disponíveis e nas decisões explícitas do usuário. A fonte semelhante e os placeholders foram preparados na TASK-02; composições tablet/mobile serão implementadas nas tarefas de telas. O aceite desta tarefa é documental; TEST-14 permanece não executado e será realizado sobre a aplicação na TASK-12. Próximo passo à época: TASK-02.

### TASK-02 — base concluída

Arquivos: `package.json`, configurações Vite/TypeScript/ESLint/Tailwind/shadcn, `src/app`, `src/routes`, `src/components`, `src/lib`, placeholders em `public/assets/placeholders`, configuração Playwright e script inicial de Lighthouse. Não houve commit automático.

- [x] Escrever manifest, configuração de runtime/env, scripts e aliases.
- [x] Preparar providers Query/Router, rotas das nove telas, 404 e fallback de erro.
- [x] Preparar instância Axios e política inicial de retry (sem dados fictícios no cliente).
- [x] Escrever tokens e shell responsivo com Button/Input/Skeleton adaptados do padrão shadcn/ui.
- [x] Escolher IBM Plex Mono (pesos 400/500/600/700) via Fontsource, para servir localmente após instalação; comparação no browser ainda pendente.
- [x] Criar quatro placeholders SVG locais, estáveis e sem dependência de serviço externo.
- [x] Preparar smoke do shell em Chromium desktop/mobile e script exploratório Lighthouse; ainda não executados.
- [x] Verificar sintaxe de 20 arquivos TS/TSX, imports locais, JSON, XML dos SVGs, sintaxe JS/MJS e `git diff --check`.
- [x] Instalar dependências e gerar `package-lock.json` (instalação realizada pelo usuário).
- [x] Executar typecheck, lint e build; todos passaram.
- [x] Declarar Vite 7.3.7 diretamente e sincronizar lockfile com resolução já instalada; `npm ci --dry-run --offline --ignore-scripts --no-audit --no-fund` passou.
- [x] Incluir licença IBM Plex Mono no build em `public/licenses/ibm-plex-mono-OFL.txt`.
- [x] Smoke Playwright do shell em Chromium desktop/mobile aprovado pelo usuário no terminal local.
- [ ] Comparação visual de fonte/shell com os PNGs fica para TASK-12.

Bloqueio inicial de instalação resolvido pelo usuário. `npm ls --depth=0`, `npm run typecheck`, `npm run lint` e `npm run build` passaram. Build gera JS/CSS, fontes locais e licença. O dry-run de npm ci verifica sincronização do lockfile, mas não substitui instalação real em checkout limpo (TASK-15).

O runner desta sessão não conseguiu iniciar o preview por `listen EPERM 127.0.0.1:4173`. O usuário executou o smoke Playwright em seu terminal local e confirmou que passou em Chromium desktop/mobile. Registro como aprovado pelo usuário; o resultado observado pela execução local do agente continua bloqueado pela sandbox. Nenhum fluxo de negócio REST/socket foi exercitado pelo smoke.

TASK-02 concluída. A prova de integração e o deploy inicial foram concluídos na TASK-03, conforme registro abaixo.


### Smoke shell — confirmação do usuário

O usuário informou em 07/10/2026 que `npm run test:e2e` passou após instalar Chromium em seu terminal local. Resultado da execução local do agente não disponível: preview bloqueado por EPERM da sandbox. Suíte é apenas o smoke do shell; não comprova integração REST/socket nem os E2E dos 12 grupos.

### TASK-03 — concluída em 07/10/2026

- [x] Gerar worker MSW e inicializá-lo antes de montar o Router quando `VITE_MOCKS_ENABLED=true`.
- [x] Criar `GET /api/__proof` atendido por MSW e chamado pela instância Axios.
- [x] Integrar `socket.io-client` à prova usando o `@mswjs/socket.io-binding`; o mock envia `proof.event` através do WebSocket interceptado. O cliente é importado dinamicamente após a inicialização do worker para respeitar a ordem de patch do WebSocket.
- [x] Preparar teste Playwright REST e Socket.IO em desktop/mobile em `tests/e2e/integration-proof.spec.ts`.
- [x] Executar `npm run test:e2e`: o usuário confirmou em 07/10/2026 que a suíte passou. REST e Socket.IO também foram confirmados no navegador local.
- [x] Publicar na Vercel e validar acesso direto/refresh de `/__proof`, REST e evento Socket.IO, inclusive em janela anônima. URL: https://jungle-gaming-code-challenge.vercel.app. Commit publicado: `4047da3`; deployment: `dpl_HLZFEAJ95RT29n9ipfAHJHzKaMnj`. Evidência: TEST-18 em TEST-MATRIX e REL-04 em RELEASE.

Tipo, lint e build passaram depois da integração. O matcher do MSW foi validado isoladamente: o handler Socket.IO na raiz corresponde à URL padrão `/socket.io/`. O primeiro log do usuário confirmou handshake e envio de `proof.request`, mas não resposta; a causa era escutar o lado servidor do binding. O listener foi corrigido para usar o lado cliente, e o usuário confirmou o reteste bem-sucedido no navegador e a aprovação de `npm run test:e2e` em 07/10/2026. O agente confirmou REST e Socket.IO no deploy público, com acesso direto e refresh funcionando. A prova não cobre os eventos de domínio `nft.updated`/`order.updated`, que são tarefas seguintes. TASK-03 está **Concluída**; a entrega final dos fluxos de negócio permanece na TASK-15.

### TASK-04 — concluída

- [x] DTOs v1 compartilhados em `src/contracts/marketplace.ts`, incluindo campos das screenshots (DEC-19).
- [x] Conversão ETH/wei e totais exatos com BigInt, sem números de ponto flutuante para valores monetários (REQ-012; TEST-17).
- [x] Fixtures determinísticas: 36 NFTs, três redes/categorias/coleções, dois usuários com recursos privados diferentes, carteiras, cupons e placeholders locais (REQ-030; DEC-17).
- [x] Banco IndexedDB com schema 1; reset de formato incompatível e transações atômicas. Verificadores PBKDF2 com salt, sem persistir senhas em claro (DEC-05).
- [x] API-03 de listagem/detalhe: filtros combinados, rede/abas, ordenação/paginação, vazio, 404 e parâmetros inválidos 422 (REQ-006).
- [x] API-13: status, reset integral e relógio. SCN-01/seed 1 implementados; controles determinísticos adicionais e limites dos cenários foram tratados na TASK-11.
- [x] Núcleo de cotação/pedidos: revalidação, reserva, fingerprint/chave por usuário, recuperação de resultado, confirmado/recusado terminal e snapshot imutável. Baixa captura lotes para preservar adições posteriores (REQ-016; DEC-08 a DEC-10).
- [x] 12 testes unitários passaram via `npm run test:unit`; typecheck, lint e build passaram. Testes não abrem browser.
- [x] Executar `npm run test:e2e`: o usuário confirmou em 07/10/2026 que a suíte passou localmente, incluindo os novos testes de catálogo, persistência e reset em desktop/mobile (`tests/e2e/mock-foundation.spec.ts`) e as provas anteriores. Evidência registrada em TEST-MATRIX; relatório/trace não anexado.

API privada de carrinho/cotação/pedidos e telas serão conectadas nas TASK-06 a TASK-08; eventos de domínio na TASK-10. Esta entrega é a base dessas funcionalidades, não a implementação dos seus fluxos de interface. TASK-04 está **Concluída**. A tentativa do agente foi bloqueada antes dos testes por `listen EPERM` em `127.0.0.1:4173`; a aprovação E2E corresponde à execução local confirmada pelo usuário.

### TASK-05 — concluída

- [x] UI-01: catálogo Axios→MSW, busca submetida, filtros combinados, abas, ordenação e paginação na URL; alterações reiniciam a página (REQ-005).
- [x] Parâmetros inválidos usam defaults seguros; histórico/refresh restauram os controles. Facetas vêm da API, sem importar fixtures na interface.
- [x] Consultas TanStack Query com chave por parâmetros/ID e AbortSignal; loading com shimmer, vazio, erro/retry e atualização em background (REQ-006, REQ-026, REQ-027).
- [x] Filtros em sidebar desktop e dialog nativo mobile/tablet, com Escape, contenção de foco e retorno ao disparador.
- [x] UI-02: acesso direto, 404, galeria, informações, edições esgotadas e quantidade limitada ao estoque (REQ-007).
- [x] Cards/recomendações compartilhados, banners da home e blocos explicativos; placeholders locais conforme DEC-17.
- [x] 14 testes unitários, typecheck, lint e build passaram na execução do agente.
- [x] E2E TEST-01/TEST-02 e parte de TEST-12 preparados em `tests/e2e/catalog.spec.ts`, incluindo latência, resposta obsoleta e erro/retry pela rede MSW.
- [x] `npm run test:e2e` passou após os ajustes; confirmação do usuário nesta conversa. As execuções anteriores tiveram 13/22 e 19/22 testes passando, antes das últimas correções.
- [x] Revisar início/detalhe em 390/768/1440 px; o usuário confirmou que as resoluções passaram. Baselines e aceite visual final do projeto permanecem na TASK-12/TASK-13.

### TASK-05A — finalização visual da homepage

- [x] Comparar a home com o PNG desktop de UI-01; incluir o destaque de NFT abaixo dos filtros, dois banners, quatro cards editoriais e footer em faixas.
- [x] Ajustar os componentes para seguir a hierarquia, imagens/placeholders, cores e espaçamento da referência, mantendo links coerentes e sem simular conteúdo/editoriais indisponíveis.
- [x] Implementar a composição responsiva em uma coluna no mobile, duas colunas intermediárias e a grade desktop; não há PNG do conteúdo abaixo do catálogo em mobile/tablet (DEC-18).
- [x] Revisar a nova composição no browser nos viewports previstos; o usuário confirmou os testes e a revisão das resoluções. O aceite visual geral e as baselines permanecem na TASK-12/TEST-14 e TASK-13.

Na entrega da TASK-05A, compra e favorito ainda estavam indisponíveis; favoritos foram conectados à API na TASK-06 e compra/carrinho permanecem na TASK-07. Eventos de atualização continuam na TASK-10. Não há publicação nem commit desta etapa.

### TASK-06 — autenticação e favoritos (em andamento)

- [x] Expor cadastro, login, sessão, logout e favoritos por endpoints MSW; senha nunca é salva em claro e as operações privadas validam token/sessão no banco.
- [x] Formulários de cadastro/login com validação, mensagens de API e retorno interno validado; proteger perfil, carteiras, checkout e pedidos.
- [x] Recuperar sessão após refresh com token opaco em `sessionStorage`; limpar/cancelar cache ao sair e limpar cache ao autenticar outra identidade.
- [x] Conectar favorito do catálogo e detalhe; atualizar otimisticamente e reverter em erro; separar a consulta pelo `userId` autenticado.
- [x] Preparar `tests/e2e/auth.spec.ts` para cadastro/conflito, guard/retorno/refresh, rollback e isolamento entre usuários.
- [x] Executar TEST-03/TEST-04 em Chromium desktop/mobile; o usuário confirmou que os E2E passaram em 08/10/2026. A tentativa do agente nesta sandbox continua bloqueada antes da inicialização por `listen EPERM` em `127.0.0.1:4173`.
- [x] Cobrir expiração de sessão, 401, retorno interno e retomada após novo login por meio da TASK-11A; E2E confirmado em Chromium desktop/mobile pelo usuário.
- [ ] Adicionar E2E para uma resposta REST privada antiga que chegue após troca de usuário/reset; a proteção de eventos atrasados está coberta, mas esta variante REST continua sem controle/assertion dedicado (SCN-15).

Typecheck, lint e build passaram; o usuário confirmou os E2E anteriores de autenticação/favoritos em desktop/mobile. A modal desktop segue `Sign In Modal.png` e as medidas confirmadas pelo usuário: 500 × 600 px, abas 20 px/medium, subtítulo 13 px/regular, inputs 40 px, CTA 45 px, link de recuperação 14 px e borda inferior 10 px. Inclui mostrar senha e ações Google/Facebook; recuperação e OAuth exibem avisos de indisponibilidade, sem simular sucesso. `/login` e `/register` seguem acessíveis diretamente, e mobile mantém navegação de página. E2Es cobrem a modal e seus controles, mas a reexecução pelo agente ficou bloqueada anteriormente por `listen EPERM` em `127.0.0.1:4173`; validar localmente antes de encerrar a TASK-06. Perfil e carteiras continuam com páginas protegidas de indisponibilidade e serão implementados na TASK-09.

Revisão UI-01 solicitada: item 1 (slider de faixa de preço) implementado, com dois controles, leitura ETH e Aplicar; aguardando verificação visual/E2E local. Itens 2–5 (busca, grupos da sidebar, ordenação sutil e fundo do card) serão tratados separadamente conforme orientação do usuário.

Revisão UI-01, item 2: barra de busca permanente removida do catálogo. Ícone de lupa no header abre diálogo de busca; submissão mantém filtros/ordenação, reinicia página e atualiza URL/API. Escape/fechar retornam foco à lupa. Typecheck, lint e build passaram; E2E adaptados, execução/validação visual pendentes. Itens 3–5 continuam para alterações separadas.

Revisão UI-01, item 3: grupos visíveis limitados a Coleções (categorias de arte), Faixa de preço e Rede, na ordem da referência, em sidebar e drawer. Removidos grupos adicionais e Somente disponíveis da UI. Contratos de filtros adicionais preservados; TEST-01 adaptado para combinar duas categorias com rede/busca. Validação E2E/visual pendente. Itens 4–5 serão tratados separadamente.

Revisão UI-01, item 4: Ordenar por estilizado como texto discreto, sem borda/fundo, com seta pequena e foco visível ao teclado. Select nativo e comportamento URL/API preservados. Validação visual pendente; item 5 segue para a próxima alteração.

Revisão UI-01, item 5: sidebar desktop com card retangular usando `bg-card` (`#241612`), padding de 16 px e altura ajustada ao conteúdo. Os cinco itens solicitados estão implementados; à época, revisão visual e execução E2E local permaneciam pendentes. A suíte E2E atual e a verificação responsiva da TASK-05 foram aprovadas posteriormente. A comparação final/baselines seguem na TASK-12/TASK-13.

Revisão adicional UI-01: Coleções/Rede com texto clicável e contagens à direita; removidos checkboxes visíveis. Cores exatas de estado, teclado e seleção múltipla via `aria-pressed`; contagens calculadas pela API. 15 testes unitários, typecheck, lint e build passaram. TEST-01 adaptado para botões; execução E2E e revisão visual continuam pendentes.

Revisão UI-01 — paginação: substituídos Anterior/Página X de Y/Próxima por números alinhados à direita e setas, com destaque cobre na página atual. Total dinâmico, clique direto, URL e histórico preservados. TEST-01 adaptado para acesso direto às páginas e estado das setas. Removidas variáveis sem uso deixadas após retirada do botão Limpar dos filtros. Validação E2E/visual pendente.

Ajuste adicional UI-01: opções de lançamento são links de rota; a seleção usa texto e barra inferior em `#D28A4C`, sem fundo de botão. Mantêm parâmetros atuais, resetam página e sinalizam link ativo com `aria-current`. Typecheck/lint/build passaram; E2E pendente.

Refinamento mobile da UI-01 iniciado: shell adaptado para esconder o header desktop apenas na homepage mobile; busca larga e filtro, hero compacto com artes sobrepostas, tabs sem ordenação, cards em grade escalonada com ações honestas, e barra inferior com cinco posições. Favoritos encaminham para login; ação central está desabilitada porque o Figma não define seu comportamento. E2E existente atualizado para localizar o novo controle de filtros; não executado. Lint/build passaram antes das últimas anotações documentais; revisão no browser do usuário necessária para calibrar o PNG.

DEC-20: badge RARO removido dos cards do catálogo. O PNG mobile mostra o selo, mas o enunciado não exige essa classificação e nenhum dado/critério do contrato define raridade. Pergunta de apresentação e evidência delimitada documentadas em UI-SPEC. Se o avaliador confirmar critério de domínio, reavaliar a exibição. Implementação em TASK-05.

Revisão UI-02 mobile: detalhe reorganizado com voltar/favoritar no topo, header global e navegação inferior removidos nesta rota, e barra fixa de quantidade/preço/comprar/carrinho com safe-area e espaço para o conteúdo. Ações seguem desabilitadas até as integrações das TASK-06/TASK-07. Especificação atualizada em UI-SPEC e ARCHITECTURE. Lint, typecheck e build passaram; conferi a composição no Chrome emulado a 375 px. Comparação nos viewports 390/414 e interação durante rolagem permanecem para TASK-12; E2E não executado.

Revisão UI-02 — rating: desktop agora mostra cinco estrelas sólidas, com a camada base em `#CFB28C` (`text-muted-foreground`) e preenchimento cobre proporcional à nota; ao lado, “N avaliações de colecionadores”, conforme PNG. Mobile preserva a cápsula com uma estrela, nota e contagem. A variante desktop expõe nota/contagem num único rótulo acessível. Removido também o parâmetro `updating` que havia ficado sem uso. Lint, typecheck e build passaram; E2E não executado.

Ajuste dos steppers do detalhe: os controles de quantidade desktop e mobile usam `size="stepper"` da variante do Button. A geometria responde ao breakpoint (`h-7 w-5` no mobile, `md:h-11 md:w-7` no desktop); o tamanho dos sinais é ajustado separadamente.

Revisão UI-02 — compartilhar: botão de copiar link substituído pela composição do PNG desktop, com o texto “Compartilhar este NFT:” e links iconográficos acessíveis para LinkedIn, email e Twitter. Os links compartilham a URL atual sem simular confirmação de publicação. Validação visual e lint/build pendentes.

Revisão UI-02 — tabs: removido o aspecto de botões; abas usam texto plano, selecionada em cobre com sublinhado, contagem de avaliações no rótulo e navegação por setas/Home/End. Estado ligado aos respectivos painéis acessíveis. Lint/build pendentes.

Revisão UI-02 — galeria: miniaturas ocupam 100 × 100 px quadrados. A imagem selecionada agora fica na segunda coluna de uma grade dedicada e usa largura total + `aspect-square`, garantindo proporção 1:1 em vez de depender do cálculo flex. Lint/build pendentes.

Refino da imagem principal: cantos arredondados e recorte de overflow aplicados também no desktop, com o mesmo raio amplo usado no mobile.

Revisão UI-01 — header desktop: removido o border-bottom global; links Início/Mercado usam estado ativo de aba (texto cobre, borda inferior com respiro) conforme home/detalhe/catálogo.

Revisão UI-01 — navegação desktop: adicionados Criadores (leva ao catálogo, pois páginas editoriais de criadores estão fora do escopo) e Aprenda (leva à seção explicativa existente); ícone do carrinho do header trocado de sacola para carrinho.

### TASK-07 — carrinho (concluída)

- [x] Expor API-05/06/07 para visitante e usuário autenticado: consulta, adição, quantidade, remoção, cupom e merge.
- [x] Persistir identidade de visitante em `localStorage` e carrinho no IndexedDB; manter carrinhos separados por usuário.
- [x] Limitar quantidades ao estoque e usar versão esperada para rejeitar atualizações concorrentes; calcular totais e desconto no mock com precisão wei.
- [x] Fazer merge idempotente ao autenticar/cadastrar; reportar itens limitados por estoque e conflitos de cupom.
- [x] Substituir `/cart` indisponível por tela responsiva com estados vazio/loading/erro, quantidades, remoção, cupom e resumo da API.
- [x] Habilitar adicionar NFT/edição/quantidade pelo detalhe e mostrar contagem no carrinho do header.
- [x] Preparar cobertura unitária para estoque, versão, cupom e merge; preparar E2E `tests/e2e/cart.spec.ts` para visitante, refresh, cupom e autenticação.
- [x] Executar TEST-05 em Chromium desktop/mobile; corrigir os problemas apontados nos E2E e confirmar a aprovação da suíte.

Execução desta etapa: typecheck, lint, build e 17 testes unitários passaram. O agente não conseguiu iniciar o preview E2E por `listen EPERM` em `127.0.0.1:4173`; o usuário executou os E2E em Chromium desktop/mobile e confirmou que passaram.

Refino visual após comparar UI-03: breadcrumb e navegação Mercado ativa; colunas NFTs/Preço/Edições/Total, token ID, linhas compactas e steppers preenchidos; resumo alinhado e sem card destacado, com rótulos do mockup, CTA/link agrupados; recomendações com cinco cards e paginação antes do footer. Revisão visual final permanece na TASK-12.

Adaptação mobile de UI-03: header geral substituído por voltar/título; cartões com imagem 100 × 100, edição, preço e steppers; resumo, cupom e CTA fixos no rodapé com safe area; recomendações e footer ocultos nesta rota mobile. Typecheck, lint e build passaram; E2E desktop/mobile confirmados pelo usuário.

DEC-23 / revisão mobile do carrinho: ação Remover saiu do canto superior do cartão e foi agrupada ao stepper numa linha abaixo dos dados do NFT, com ícone e rótulo para melhorar localização e clareza. Após revisão, a imagem passou a acompanhar verticalmente as linhas de detalhes e ações para não ficar isolada no topo. Desktop mantém a lixeira compacta. O mockup mobile não especifica esse controle; verificar toque, disposição e remoção em TEST-05/TEST-14.

### TASK-08 — checkout e pedido (concluída)

- [x] Conectar checkout à sessão, ao carrinho de conta e às carteiras seed; exibir dados do colecionador, edição, quantidades e totais.
- [x] Implementar adaptação mobile em etapas Dados → Carteira/rede → Revisão e resumo responsivo no desktop.
- [x] Expor cotação, conexão/desconexão simulada, envio idempotente e leitura/recuperação de tentativa pelos handlers MSW.
- [x] Exigir cotação atual e conexão válida antes do pedido; tratar cotação alterada com revisão explícita.
- [x] Separar os rótulos das etapas: “Revisar compra” inicia conexão/cotação; “Confirmar compra” envia somente após revisão.
- [x] Agrupar carrinho e totais por rede; permitir pedidos separados por grupo e preservar os outros grupos após uma confirmação (DEC-24).
- [x] Derivar a rede do grupo de NFTs no checkout e selecionar uma carteira compatível; orientar cadastro quando não houver carteira naquela rede.
- [x] Documentar a regra em DEC-24, FLOW-01/FLOW-06, API-05/API-08, UI-SPEC e TEST-06/SCN-18.
- [x] Implementar estados pendente, confirmado e recusado; recibo só após confirmação e sempre identificado como simulação.
- [x] Persistir chave e conteúdo da tentativa no navegador antes do envio; recuperar pedido pela mesma chave ou reenviar o mesmo conteúdo sem duplicar.
- [x] Preparar testes E2E de compra confirmada e recusa com carrinho preservado em [checkout.spec.ts](tests/e2e/checkout.spec.ts).
- [x] Executar TEST-06/parte de TEST-07 em Chromium desktop/mobile; execução confirmada pelo usuário.
- [x] Executar a cobertura multirrede (SCN-18) em Chromium desktop/mobile junto com a suíte de checkout; execução confirmada pelo usuário.

`npm run typecheck`, `npm run lint`, `npm run build` e os 18 testes unitários passaram nesta árvore. O usuário confirmou a execução da suíte de checkout em Chromium desktop/mobile e da cobertura multirrede; TASK-08 encerrada. TEST-07 recebeu cobertura de resposta ambígua e recuperação após refresh na TASK-10E. Um timeout HTTP real por resposta atrasada e outras variantes continuam limitados conforme SCN-11.

### TASK-09 — gestão de perfil e carteiras (épico)

Quebrada em quatro entregas verificáveis para manter escopo e evidências menores: TASK-09A (dados do perfil), TASK-09B (avatar), TASK-09C (senha) e TASK-09D (carteiras). O épico só será concluído após todas passarem na cobertura correspondente do TEST-08.

### TASK-09A — dados do perfil

- [x] Implementar leitura e edição de nome de exibição, nome de usuário, e-mail e ENS opcional em `/profile`.
- [x] Persistir via `GET/PATCH /api/profile`, com validação, unicidade de e-mail/usuário e controle `expectedVersion`.
- [x] Atualizar a sessão/cache e o nome exibido no header depois de salvar; manter feedback de sucesso, erros por campo e conflito de versão.
- [x] Adaptar formulário e navegação de conta para mobile sem overflow horizontal.
- [x] Cobrir validação, conflito, normalização e versionamento com teste unitário de domínio.
- [x] Executar `npx playwright test tests/e2e/profile.spec.ts` em Chromium desktop/mobile; usuário confirmou que todos os testes passaram em 08/10/2026.

Os campos de ENS são opcionais conforme DEC-29 e não fazem consulta externa. Apelido da carteira deriva da carteira principal. A gestão de carteiras foi concluída na TASK-09D; avatar e alteração de senha foram implementados nas TASK-09B/C. Typecheck, lint, build, testes unitários e E2E desktop/mobile passaram. A tarefa cobre somente os dados básicos do perfil; o épico TASK-09 está concluído.

### TASK-09B — Avatar do perfil

- [x] Implementar `PUT/DELETE /api/profile/avatar` com versão otimista e retorno do perfil atualizado.
- [x] Aceitar PNG, JPG/JPEG e WebP até 2 MiB; validar tipo declarado e assinatura do conteúdo antes de persistir.
- [x] Exibir avatar, ações Alterar/Remover e erros sem substituir a imagem salva quando o upload falha.
- [x] Persistir a imagem no mock local e manter o estado após recarga; bloquear edições concorrentes durante a mutação.
- [x] Adicionar teste unitário de versão e rejeição de gravação obsoleta.
- [x] Executar E2E desktop/mobile para upload, erro por tipo/tamanho, persistência e remoção; usuário confirmou que passaram em 08/10/2026; resultado registrado em `docs/TEST-MATRIX.md`.

Decisão de implementação: as imagens da demo ficam em uma URL `data:` dentro do perfil IndexedDB. O limite de 2 MiB evita crescimento descontrolado do mock e elimina dependência de storage externo; o endpoint continua isolado para substituição por storage real. O fluxo só atualiza o perfil depois da validação completa e do controle de versão.

### TASK-09C — Alteração de senha

- [x] Criar formulário separado com senha atual, nova senha e confirmação; validar confirmação e mínimo de 8 caracteres.
- [x] Implementar `PUT /api/profile/password`, validar senha atual e trocar salt/verificador PBKDF2 sem persistir senha em claro.
- [x] Preservar a sessão ativa e exibir erros da API sem alterar a senha quando validação falha.
- [x] Adicionar teste unitário de rejeição de senha atual incorreta/versão obsoleta e E2E para nova autenticação e senha antiga rejeitada.
- [x] Executar E2E desktop/mobile; usuário confirmou que passaram em 08/10/2026; resultado registrado em `docs/TEST-MATRIX.md`.

### TASK-10 — Eventos, reconexão e recuperação (épico)

Quebrada em cinco entregas por camada: TASK-10A (emissão após persistência), TASK-10B (consumo versionado), TASK-10C (isolamento de sessão), TASK-10D (reconciliação após reconexão) e TASK-10E (recuperação idempotente de pedidos). Expiração de sessão, controles determinísticos e auditoria de cenários foram concluídos na TASK-11; a TASK-10C cobre logout e troca de usuário.

### TASK-10A — Emissão de eventos de domínio

- [x] Emitir EVT-01 quando preço ou disponibilidade do NFT mudar e EVT-02 quando o status do pedido mudar, apenas depois da gravação atômica no IndexedDB.
- [x] Montar envelopes com `eventId`, `resourceId`, versão monotônica, horário e snapshot correspondente; eventos de pedido incluem `userId` e `sessionId`.
- [x] Cobrir versão e payload dos dois eventos em testes de domínio/integração; o usuário confirmou que os testes passaram em 08/10/2026 e autorizou o commit da etapa.

TASK-10A concluída e commitada após aprovação explícita do usuário. O reteste confirmou o handshake Socket.IO autenticado e os eventos de domínio em desktop/mobile. A emissão ocorre depois da transação IndexedDB e o teste compara o snapshot publicado com a leitura REST persistida.

### TASK-10B — Consumo seguro de eventos

- [x] Registrar listener Socket.IO após a inicialização do worker MSW; validar estrutura/coerência do evento e comparar versões antes de atualizar o cache de NFT ou pedido.
- [x] Deduplicar por `eventId` com conjunto limitado; rejeitar evento de pedido com usuário/sessão divergentes, payload/envelope incoerentes ou estado terminal regressivo.
- [x] Atualizar cache de detalhe/pedido e invalidar listas, facetas e carrinhos afetados; confirmação do pedido invalida o carrinho da identidade autenticada, sem aplicar efeitos financeiros locais.
- [x] Cobrir validação estrutural, identidade, versões e terminalidade em `tests/unit/domain-events.spec.ts` (25 testes unitários passaram).
- [x] Executar `tests/e2e/domain-events.spec.ts` em Chromium desktop/mobile; o usuário confirmou que passou em 08/10/2026.

Durante a verificação, foi corrigida uma comparação de identidade: `sessionId` do evento não é o token de autenticação. O consumidor agora usa o `sessionId` devolvido por `session.authenticated`. Também foi corrigida a captura do ID do pedido no teste de integração, que estava navegando para `/orders/undefined`. `npm run typecheck`, `npm run lint`, `npm run test:unit` (25 testes) e build passaram; o usuário confirmou a execução E2E em desktop/mobile.

### TASK-10C — Isolamento de recursos privados entre sessões

- [x] Na limpeza do consumidor Socket.IO, desconectar o socket, invalidar seus handlers e cancelar/remover o cache privado do usuário anterior.
- [x] Remover somente os dados privados da identidade anterior; preservar catálogo público, carrinho visitante e cache de outra identidade.
- [x] Ignorar callbacks de evento que cheguem após a limpeza do listener.
- [x] Cobrir troca de usuário/logout e eventos atrasados em E2E desktop/mobile; o usuário confirmou que toda a suíte rodou em 08/10/2026.
- [x] Verificar que trocar de usuário não revela pedido, tentativa, dados do checkout nem eventos da conta anterior. Expiração/401 fica na TASK-11.

TASK-10C concluída. Typecheck, lint, build e 27 testes unitários passaram; o usuário confirmou a execução E2E desktop/mobile. A cobertura de expiração/401 continua na TASK-11.

### TASK-10D — Reconciliação REST depois de reconectar

- [x] Detectar reconexão Socket.IO e refazer consultas REST de detalhe/listas/facetas, carrinhos e pedidos ativos que podem ter mudado durante a desconexão.
- [x] Usar o evento `online` do navegador como fallback para iniciar a mesma reconciliação caso a rede volte antes de o Socket.IO emitir `connect`; REST permanece a fonte autoritativa e os eventos continuam fornecendo atualizações em tempo real.
- [x] Reconciliar pedidos pendentes e dados do carrinho/catálogo com versões atuais; a API REST fornece o estado autoritativo após eventos possivelmente perdidos.
- [x] Revalidar a cotação ativa após a reconciliação; comparar preço, estoque, cupom, taxa e totais, e encaminhar para revisão quando os termos mudarem.
- [x] Adicionar E2E de reconciliação de carrinho/cotação após desconexão, com alteração de cupom não observada pelo socket; typecheck, lint, 28 testes unitários e build passaram.
- [x] Executar o E2E de reconexão em Chromium desktop/mobile; o usuário confirmou que os testes passaram.

### TASK-10E — Recuperação idempotente de pedido

- [x] Persistir a tentativa antes do POST e restaurar sua disponibilidade após a sessão ser recuperada no refresh; manter o payload e a chave originais.
- [x] Consultar a tentativa por REST antes de agir; pedidos encontrados seguem para sua rota e são acompanhados até pending/confirmed/declined. Só reenviar o payload original com a mesma chave quando a consulta retornar 404.
- [x] Adicionar controle determinístico de resposta 504 após persistência e E2E para refresh, acompanhamento pending→confirmed, um único POST e carrinho removido após confirmação.
- [x] Executar o novo E2E em Chromium desktop/mobile; o usuário confirmou que os testes passaram.


### TASK-11B/C — Controles de rede e reset de avaliação

O usuário confirmou que os E2E desktop/mobile de detalhe/carrinho com falhas de rede e recuperação, e o reset de avaliação com limpeza de storage, passaram. TASK-11B/C concluídas.

### TASK-11A — Expiração e retomada da sessão

Adicionado E2E que avança o relógio simulado além das 24 horas, verifica o `401` de `/api/auth/session`, a remoção do token expirado, a preservação de `returnTo` e o retorno ao perfil após novo login. Adicionado teste unitário da fronteira exata de expiração, incluindo remoção da sessão expirada. Typecheck, lint e 29 testes unitários passaram. O usuário confirmou a conclusão da TASK-11A.

### TASK-11D — Auditoria de cenários e evidências

Corrigidas as descrições de SCN-07 e SCN-11 após a conclusão das TASK-11A e TASK-10E; atualizados contratos, fluxos e guia de mocks para refletir o comportamento implementado. Registrados os limites reais: sem seletor para os 18 cenários, sem resposta HTTP atrasada além do timeout real, e variantes específicas de pedido pending/evento ou resposta privada antiga ainda não cobertas. A matriz registra as confirmações do usuário para E2E desktop/mobile dos grupos TEST-03, TEST-07, TEST-08, TEST-12 e TEST-16, sem afirmar que relatórios/traces foram anexados. Typecheck, lint, build, 29 testes unitários e diff check passaram; o runner Playwright deste ambiente continua bloqueado por `listen EPERM` antes de iniciar servidor local.

### Ajuste UI-02 — Comprar abre o carrinho — 08/10/2026

Implementado em `src/routes/nft-detail-page.tsx`: Comprar adiciona edição/quantidade e navega para o carrinho somente após sucesso da API; erro mantém o detalhe. Removido botão adicional desktop; ícone mobile mantém inclusão sem navegação. E2Es de carrinho/checkout atualizados para o botão Comprar. Build, TypeScript, ESLint e revisão do diff passaram. Os seis E2Es de carrinho passaram em desktop/mobile. Sem commit nesta etapa.

### Página de favoritos — DEC-32 — 08/10/2026 — Concluído

Solicitada pelo usuário para completar a navegação sugerida pelo coração mobile, embora a página não esteja entre as nove telas obrigatórias do enunciado. `/favorites` é protegida por sessão e acessível no header desktop e na barra mobile. Reutiliza os cards e favoritos persistentes por usuário, com acesso ao detalhe, remoção otimista/rollback, mensagem de erro visível, carregamento, retry e vazio com acesso ao catálogo. Espaçamento do header ajustado no tablet para acomodar o novo atalho sem overflow.

Motivação registrada em DEC-32 no documento de decisões para avaliação e em ARCHITECTURE; UI-SPEC atualizada. Typecheck, lint, build e revisão do diff passaram. Os 18 E2Es de favoritos/autenticação/shell passaram em desktop/mobile; seis cobrem a página nova. Capturas revisadas em 390/768/1440 px e overflow horizontal verificado. Evidências e limitações em TEST-MATRIX. Sem commit nesta etapa.

### Follow-up — Navegação global mobile — A fazer

Escopo incorporado à TASK-12B; este checklist continua sendo o detalhamento do follow-up.

Por solicitação do usuário, a página de favoritos adota temporariamente o padrão atual de carrinho e perfil: sem barra inferior e com voltar ao início. O coração da barra da homepage continua abrindo favoritos; “Explorar catálogo” fica abaixo da lista no mobile. Removido o espaço reservado para a barra na página de favoritos.

Ajuste temporário verificado: seis E2Es de favoritos passaram em desktop/mobile, incluindo ausência da barra e presença do controle de voltar no mobile; typecheck, build, lint e diff check passaram. Sem commit. A revisão global abaixo permanece pendente.

- [ ] Revisar a navegação global de início, favoritos, carrinho e perfil para permitir troca consistente entre as telas principais, com indicação da seção ativa.
- [ ] Definir o comportamento no detalhe do NFT e no checkout, considerando os controles de compra e a concentração no fluxo de pagamento.
- [ ] Resolver a coexistência com o resumo fixo do carrinho, garantindo que navegação e ações não se sobreponham, inclusive com safe-area.
- [ ] Validar em mobile navegação por toque/teclado, retorno, foco, rolagem e ausência de conteúdo coberto; atualizar UI-SPEC e os E2Es após a decisão.


### Correção — Acesso direto a favoritos com sessão salva — 08/10/2026

Reproduzido `CancelledError` ao abrir ou atualizar `/favorites` no Vite dev com Strict Mode: a desmontagem inicial do observador cancelava a leitura de sessão compartilhada com o guard. O bootstrap agora aguarda a recuperação da sessão antes de montar o roteador; a autenticação das rotas continua usando o guard existente. Adicionada `playwright.dev.config.ts` para executar os E2Es com Strict Mode ativo e artefatos separados da suíte de produção; comando documentado no README.

Verificação: 18 E2Es de favoritos/autenticação/shell passaram em desenvolvimento e outros 18 em produção, nos projetos desktop/mobile, incluindo acesso direto e refresh. Typecheck, build, lint e diff check passaram. Sem commit desta correção.

### TASK-12 — Decomposição em subtarefas — 08/10/2026

Planejamento dividido em TASK-12A a TASK-12F, todas **adiadas até nova análise**, por decisão do usuário. O épico mantém seu escopo e as dependências de TASK-13/14 continuam apontando para sua conclusão integral. Ordem técnica: revisão visual → responsividade/navegação → estados → acessibilidade → ações auxiliares → aceite consolidado.

- [ ] **TASK-12A — Fidelidade visual e assets:** comparar as nove telas com as referências disponíveis; incluir hero, catálogo, destaque, banners, cards editoriais e footer da home; revisar IBM Plex Mono e placeholders locais, registrar diferenças e atualizar UI-SPEC/ASSETS quando necessário. Nos layouts sem frame, registrar a adaptação, sem afirmar equivalência com uma referência inexistente.
- [ ] **TASK-12B — Responsividade e navegação:** revisar as nove telas obrigatórias e favoritos em 390/768/1440; aplicar DEC-18 a perfil, carteiras e confirmação; resolver o checklist de navegação global mobile acima, preservando o comportamento temporário até a revisão; validar safe-area, barras fixas, toque, rolagem, zoom 200% e acesso integral às ações.
- [ ] **TASK-12C — Estados e movimento:** exercitar loading, vazio, erro, sucesso, retry e atualização em background; conferir dimensões dos skeletons e estabilidade do conteúdo em catálogo/detalhe/resumo; verificar shimmer e ausência de animação com reduced motion. Reutilizar os controles determinísticos da TASK-11B/C e registrar evidências de TEST-12.
- [ ] **TASK-12D — Acessibilidade:** percorrer os fluxos principais por teclado; verificar ordem/foco visível, contenção e retorno de foco em diálogo/drawer, labels, erros associados e foco no campo inválido; conferir semântica, alt, contraste e anúncio acessível de mutations e eventos. Registrar resultados de TEST-11/14 e ajustes de acessibilidade que alterem a referência.
- [ ] **TASK-12E — Ações auxiliares:** inventariar e verificar OAuth, recuperação de senha, newsletter, compartilhamento, avaliações, links editoriais/suporte e controles sem significado confirmado; oferecer comportamento coerente ou aviso explícito de indisponibilidade, acessível por teclado e sem simular envio/autenticação/sucesso.
- [ ] **TASK-12F — Aceite e evidências:** executar TEST-11/12 em desktop/mobile e TEST-14 em 390/768/1440; revisar capturas das nove telas e favoritos; preparar/revisar snapshots de início/detalhe/carrinho/checkout para TEST-13 com cenário, relógio, fontes e imagens estáveis; registrar viewport, referência, resultados e desvios em TEST-MATRIX/UI-SPEC. Baselines devem ser revisadas contra as referências, não apenas aprovadas por coincidirem com a aplicação. TASK-13 permanece responsável pela consolidação da suíte e entrega das baselines, HTML e traces.

Verificação desta decomposição: revisão documental do escopo, requisitos, grupos de teste e dependências, além de `git diff --check`. Nenhum teste da aplicação executado ou critério de implementação marcado como concluído. Próximo passo: analisar as evidências e a situação atual da aplicação para definir o escopo e as prioridades; a execução da TASK-12 permanece adiada até essa análise e a confirmação do usuário. Sem commit nesta etapa.


### Destinos auxiliares em construção — 08/10/2026 — Concluído

Por solicitação do usuário, todos os acionadores auditados sem funcionalidade/destino próprio passaram a abrir `/em-construcao?recurso=…`. A tela identifica o recurso, informa que está sendo construída e permite voltar ao início. Conectados itens auxiliares do rodapé, redes sociais, artigos, Criadores/Aprenda, newsletter, recuperação/OAuth da modal, ação central mobile e explorador do recibo. A modal fecha ao seguir um destino de construção; não há envio de email, OAuth, inscrição nem exploração de uma transação real. UI-SPEC e as decisões de avaliação foram atualizadas.

Verificação: tipos, build, lint e diff check passaram. As suítes de autenticação, homepage e checkout passaram em desktop/mobile. A nova suíte validou cliques em 20 destinos da homepage desktop e 19 mobile, os três links auxiliares da modal, acesso direto, refresh e retorno. Execução final dessa suíte: cinco testes passaram e um foi pulado porque a modal é exclusiva de desktop. Capturas desktop/mobile revisadas. Sem commit desta etapa.

### TASK-13 — Regressão visual automatizada — 08/10/2026

Implementados oito testes `@visual` para início, detalhe, carrinho e pagamento em Chromium desktop/mobile, com dez PNGs de baseline, incluindo a revisão do pagamento. Cenário SCN-01/seed 1, relógios fixos, fontes/imagens aguardadas e animações desabilitadas na captura. A execução normal falha se a baseline estiver ausente ou diferente; atualizações exigem `--update-snapshots`. Procedimento e ambiente em [VISUAL-TESTS](docs/VISUAL-TESTS.md).

Capturas inspecionadas e comparação repetida três vezes por caso: 24 testes passaram sem atualizar as imagens. A execução final com atualização automática bloqueada também passou nos oito testes; typecheck/build, lint e diff check passaram. Baselines representam o estado atual, sem concluir o aceite contra as referências. TASK-12 continua adiada até nova análise; TASK-13 permanece em andamento para consolidar os demais grupos e artefatos. Sem commit nesta etapa.
