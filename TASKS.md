# Backlog de execução

Cronograma: [ROTEIRO.md](ROTEIRO.md). Requisitos: [REQUIREMENTS.md](REQUIREMENTS.md). As dependências abaixo representam ordem técnica; não pressupõem trabalho por múltiplos agentes.

Itens sem execução permanecem em **A fazer**. Estados permitidos: A fazer → Em andamento → Em verificação → Concluído; Bloqueado deve incluir motivo. Uma tarefa só é concluída com critérios de aceite e evidências dos testes indicados, sem marcar requisitos atendidos apenas por existir código.

## Situação atual — 06/10/2026

- [x] Roteiro de desenvolvimento criado em [ROTEIRO](ROTEIRO.md).
- [x] Documentação inicial criada: requisitos, tarefas, arquitetura, contratos propostos, interface, cenários, matriz de testes, entrega e README.
- [x] IDs e links locais da documentação validados.
- [x] Todas as 15 screenshots analisadas; inventário, dimensões, cores e diferenças desktop/mobile registrados em [UI-SPEC](docs/UI-SPEC.md).
- [x] Lacunas de contratos e inconsistências nas referências documentadas.
- [x] Resolver a abordagem das pendências visuais: fonte semelhante, placeholders temporários e layouts próprios (DEC-16, DEC-17, DEC-18).
- [x] Iniciar implementação da aplicação pela TASK-02 (arquivos da base preparados).
- [x] Instalar dependências, gerar lockfile e validar tipos/lint/build.
- [x] Smoke Playwright inicial do shell desktop/mobile executado pelo usuário e aprovado.

**Resumo:** TASK-01 a TASK-04 concluídas; TASK-05 em andamento; TASK-06 a TASK-15 ainda a fazer. A prova REST/Socket.IO está publicada e validada na Vercel. O núcleo de domínio e catálogo simulado existem, e as telas de catálogo/detalhe estão implementadas na árvore de trabalho, aguardando validação E2E local. Sua entrega final pertence à TASK-15.

## Tarefas

| ID | Dia / bloco do roteiro | Trabalho e critérios de aceite | Dependências | Requisitos | Testes | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-01 | 1 / 1 | Analisar referências; preencher frames, tokens e assets em UI-SPEC; documentar pendências sem inventar medidas | — | REQ-004, REQ-037, REQ-040 | TEST-14 (posterior, na TASK-12) | Concluído |
| TASK-02 | 1 / 1 | Inicializar Vite/React/TS e stack; providers/router; scripts, lockfile e env; shell com shadcn/Tailwind; escolher fonte local semelhante (DEC-16) e preparar placeholders (DEC-17) | — | REQ-001, REQ-025, REQ-050 | TEST-16 parcial + smoke shell | Concluído |
| TASK-03 | 1 / 1 | Provar Axios→MSW e MSW→Socket.IO→cliente no build; smoke Playwright; primeiro deploy com rota interna | TASK-02 | REQ-001, REQ-029, REQ-032, REQ-033, REQ-041, REQ-048 | TEST-16, TEST-18 | Concluído |
| TASK-04 | 1 / 2 | Implementar contratos, dinheiro exato, banco versionado, fixtures com placeholders locais (DEC-17), reset e núcleo de cotação/pedidos | TASK-03 | REQ-006, REQ-012, REQ-016, REQ-025, REQ-028, REQ-029, REQ-030 | TEST-16, TEST-17 | Concluída |
| TASK-05 | 1 / 3 | Início/detalhe completos; URL validada, filtros combinados, API parametrizada, cancelamento, galeria e estados | TASK-01, TASK-04 | REQ-002, REQ-003, REQ-005, REQ-006, REQ-007, REQ-026, REQ-027 | TEST-01, TEST-02, TEST-12 | Em andamento |
| TASK-06 | 1 / 4 | Cadastro/login/logout/guards, retorno interno, recuperação de sessão, isolamento e favorito otimista com rollback | TASK-04, TASK-05 | REQ-002, REQ-003, REQ-008, REQ-021, REQ-022, REQ-023, REQ-024, REQ-027 | TEST-03, TEST-04 | A fazer |
| TASK-07 | 1 / 4 | Carrinho persistente, merge idempotente de visitante, estoque, cupom e totais retornados pela API | TASK-06 | REQ-002, REQ-003, REQ-009, REQ-010, REQ-011, REQ-012 | TEST-05, TEST-17 | A fazer |
| TASK-08 | 1 / 5 | Checkout com carteiras seed; conexão/rede, revisão, cotação revalidada, pedido idempotente e recibo; refresh recupera tentativa | TASK-07 | REQ-002, REQ-003, REQ-012, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020 | TEST-06, TEST-07, TEST-17 | A fazer |
| TASK-09 | 2 / 7 | Completar perfil/avatar/senha e cadastro/edição de carteiras; persistir alterações e exibir erros da API | TASK-08 | REQ-002, REQ-003, REQ-014, REQ-024 | TEST-08 | A fazer |
| TASK-10 | 2 / 8 | Eventos versionados, limpeza de sessão, cotação inválida, reconexão REST e recuperação de pedido sem repetir efeitos | TASK-08 | REQ-013, REQ-015, REQ-017, REQ-019, REQ-023, REQ-027, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036 | TEST-09, TEST-10 | A fazer |
| TASK-11 | 2 / 8 | Completar controles determinísticos de rede/sessão/falhas; reset por teste; cenários de SCENARIOS reproduzíveis | TASK-09, TASK-10 | REQ-022, REQ-030, REQ-031, REQ-044 | TEST-03, TEST-07, TEST-08, TEST-12, TEST-16 | A fazer |
| TASK-12 | 2 / 9 | Revisar todas as telas em 390/768/1440; adaptações próprias (DEC-18), fonte/placeholders (DEC-16, DEC-17), shimmer, reduced motion, teclado, foco, zoom e ações auxiliares | TASK-09, TASK-10 | REQ-004, REQ-026, REQ-037, REQ-038, REQ-039, REQ-040 | TEST-11, TEST-12, TEST-13, TEST-14 | A fazer |
| TASK-13 | 1 / 6 e 2 / 10 | Criar testes junto dos fluxos; consolidar 12 grupos, desktop/mobile, baselines revisadas, HTML e traces | TASK-03; conclusão após TASK-11, TASK-12 | REQ-041, REQ-042, REQ-043, REQ-044 | TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-11, TEST-12, TEST-13, TEST-16 | A fazer |
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
- [x] API-13: status, reset integral e relógio. SCN-01/seed 1 implementados; demais controles/cenários continuam na TASK-11.
- [x] Núcleo de cotação/pedidos: revalidação, reserva, fingerprint/chave por usuário, recuperação de resultado, confirmado/recusado terminal e snapshot imutável. Baixa captura lotes para preservar adições posteriores (REQ-016; DEC-08 a DEC-10).
- [x] 12 testes unitários passaram via `npm run test:unit`; typecheck, lint e build passaram. Testes não abrem browser.
- [x] Executar `npm run test:e2e`: o usuário confirmou em 07/10/2026 que a suíte passou localmente, incluindo os novos testes de catálogo, persistência e reset em desktop/mobile (`tests/e2e/mock-foundation.spec.ts`) e as provas anteriores. Evidência registrada em TEST-MATRIX; relatório/trace não anexado.

API privada de carrinho/cotação/pedidos e telas serão conectadas nas TASK-06 a TASK-08; eventos de domínio na TASK-10. Esta entrega é a base dessas funcionalidades, não a implementação dos seus fluxos de interface. TASK-04 está **Concluída**. A tentativa do agente foi bloqueada antes dos testes por `listen EPERM` em `127.0.0.1:4173`; a aprovação E2E corresponde à execução local confirmada pelo usuário.

### TASK-05 — implementada, validação E2E/visual pendente

- [x] UI-01: catálogo Axios→MSW, busca submetida, filtros combinados, abas, ordenação e paginação na URL; alterações reiniciam a página (REQ-005).
- [x] Parâmetros inválidos usam defaults seguros; histórico/refresh restauram os controles. Facetas vêm da API, sem importar fixtures na interface.
- [x] Consultas TanStack Query com chave por parâmetros/ID e AbortSignal; loading com shimmer, vazio, erro/retry e atualização em background (REQ-006, REQ-026, REQ-027).
- [x] Filtros em sidebar desktop e dialog nativo mobile/tablet, com Escape, contenção de foco e retorno ao disparador.
- [x] UI-02: acesso direto, 404, galeria, informações, edições esgotadas e quantidade limitada ao estoque (REQ-007).
- [x] Cards/recomendações compartilhados, banners da home e blocos explicativos; placeholders locais conforme DEC-17.
- [x] 14 testes unitários, typecheck, lint e build passaram na execução do agente.
- [x] E2E TEST-01/TEST-02 e parte de TEST-12 preparados em `tests/e2e/catalog.spec.ts`, incluindo latência, resposta obsoleta e erro/retry pela rede MSW.
- [ ] Validar `npm run test:e2e` localmente: tentativa do agente bloqueada antes dos testes por `listen EPERM` em `127.0.0.1:4173`.
- [ ] Revisar visualmente início/detalhe em 390/768/1440 px; fidelidade final/baselines permanecem na TASK-12/TASK-13.

Compra e favorito têm indicação de indisponibilidade nesta etapa; serão conectados nas TASK-06/TASK-07. Eventos de atualização continuam na TASK-10. Não há publicação nem commit desta etapa.

Revisão UI-01 solicitada: item 1 (slider de faixa de preço) implementado, com dois controles, leitura ETH e Aplicar; aguardando verificação visual/E2E local. Itens 2–5 (busca, grupos da sidebar, ordenação sutil e fundo do card) serão tratados separadamente conforme orientação do usuário.

Revisão UI-01, item 2: barra de busca permanente removida do catálogo. Ícone de lupa no header abre diálogo de busca; submissão mantém filtros/ordenação, reinicia página e atualiza URL/API. Escape/fechar retornam foco à lupa. Typecheck, lint e build passaram; E2E adaptados, execução/validação visual pendentes. Itens 3–5 continuam para alterações separadas.

Revisão UI-01, item 3: grupos visíveis limitados a Coleções (categorias de arte), Faixa de preço e Rede, na ordem da referência, em sidebar e drawer. Removidos grupos adicionais e Somente disponíveis da UI. Contratos de filtros adicionais preservados; TEST-01 adaptado para combinar duas categorias com rede/busca. Validação E2E/visual pendente. Itens 4–5 serão tratados separadamente.

Revisão UI-01, item 4: Ordenar por estilizado como texto discreto, sem borda/fundo, com seta pequena e foco visível ao teclado. Select nativo e comportamento URL/API preservados. Validação visual pendente; item 5 segue para a próxima alteração.

Revisão UI-01, item 5: sidebar desktop com card retangular usando `bg-card` (`#241612`), padding de 16 px e altura ajustada ao conteúdo. Os cinco itens solicitados estão implementados; revisão visual e execução E2E local permanecem pendentes. TASK-05 não está concluída por estas alterações isoladas.

Revisão adicional UI-01: Coleções/Rede com texto clicável e contagens à direita; removidos checkboxes visíveis. Cores exatas de estado, teclado e seleção múltipla via `aria-pressed`; contagens calculadas pela API. 15 testes unitários, typecheck, lint e build passaram. TEST-01 adaptado para botões; execução E2E e revisão visual continuam pendentes.
