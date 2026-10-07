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

**Resumo:** preparação documental inicial concluída; TASK-01 concluída como análise e definição de abordagem; TASK-02 concluída; TASK-03 em andamento; TASK-04 a TASK-15 ainda a fazer. Os fluxos de negócio não foram implementados ou testados. Os documentos de contratos, arquitetura e cenários descrevem propostas, não código entregue; sua atualização final permanece na TASK-15.

## Tarefas

| ID | Dia / bloco do roteiro | Trabalho e critérios de aceite | Dependências | Requisitos | Testes | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-01 | 1 / 1 | Analisar referências; preencher frames, tokens e assets em UI-SPEC; documentar pendências sem inventar medidas | — | REQ-004, REQ-037, REQ-040 | TEST-14 (posterior, na TASK-12) | Concluído |
| TASK-02 | 1 / 1 | Inicializar Vite/React/TS e stack; providers/router; scripts, lockfile e env; shell com shadcn/Tailwind; escolher fonte local semelhante (DEC-16) e preparar placeholders (DEC-17) | — | REQ-001, REQ-025, REQ-050 | TEST-16 parcial + smoke shell | Concluído |
| TASK-03 | 1 / 1 | Provar Axios→MSW e MSW→Socket.IO→cliente no build; smoke Playwright; primeiro deploy com rota interna | TASK-02 | REQ-001, REQ-029, REQ-032, REQ-033, REQ-041, REQ-048 | TEST-16, TEST-18 | Em andamento |
| TASK-04 | 1 / 2 | Implementar contratos, dinheiro exato, banco versionado, fixtures com placeholders locais (DEC-17), reset e núcleo de cotação/pedidos | TASK-03 | REQ-006, REQ-012, REQ-016, REQ-025, REQ-028, REQ-029, REQ-030 | TEST-16, TEST-17 | A fazer |
| TASK-05 | 1 / 3 | Início/detalhe completos; URL validada, filtros combinados, API parametrizada, cancelamento, galeria e estados | TASK-01, TASK-04 | REQ-002, REQ-003, REQ-005, REQ-006, REQ-007, REQ-026, REQ-027 | TEST-01, TEST-02, TEST-12 | A fazer |
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

TASK-02 concluída. TASK-03 em andamento para provar Axios→MSW e MSW→Socket.IO→cliente; primeiro deploy permanece sujeito ao acesso ao provedor.


### Smoke shell — confirmação do usuário

O usuário informou em 07/10/2026 que `npm run test:e2e` passou após instalar Chromium em seu terminal local. Resultado da execução local do agente não disponível: preview bloqueado por EPERM da sandbox. Suíte é apenas o smoke do shell; não comprova integração REST/socket nem os E2E dos 12 grupos.

### TASK-03 — prova técnica parcial

- [x] Gerar worker MSW e inicializá-lo antes de montar o Router quando `VITE_MOCKS_ENABLED=true`.
- [x] Criar `GET /api/__proof` atendido por MSW e chamado pela instância Axios.
- [x] Integrar `socket.io-client` à prova usando o `@mswjs/socket.io-binding`; o mock envia `proof.event` através do WebSocket interceptado. O cliente é importado dinamicamente após a inicialização do worker para respeitar a ordem de patch do WebSocket.
- [x] Preparar teste Playwright REST e Socket.IO em desktop/mobile em `tests/e2e/integration-proof.spec.ts`.
- [x] Executar a prova no navegador local: o usuário confirmou que o reteste Socket.IO passou em 07/10/2026; a prova REST também havia passado anteriormente.
- [ ] Fazer primeira publicação com `/__proof` e validar rota, worker, REST e evento Socket.IO no ambiente publicado. CLI/provedor e credenciais não estão disponíveis nesta sessão.

Tipo, lint e build passaram depois da integração. O matcher do MSW foi validado isoladamente: o handler Socket.IO na raiz corresponde à URL padrão `/socket.io/`. O primeiro log do usuário confirmou handshake e envio de `proof.request`, mas não resposta; a causa era escutar o lado servidor do binding. O listener foi corrigido para usar o lado cliente, e o usuário confirmou o reteste bem-sucedido no navegador em 07/10/2026. A prova não cobre os eventos de domínio `nft.updated`/`order.updated`, que são tarefas seguintes. TASK-03 permanece **Em andamento** até validar a primeira publicação.
