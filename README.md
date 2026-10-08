# NFT Marketplace — desafio frontend

Projeto com **TASK-01 a TASK-05 concluídas**: base, tipos, lint e build aprovados; provas Axios→MSW e Socket.IO→MSW implementadas. O usuário confirmou que a suíte E2E atual passou e que início/detalhe foram verificados em 390/768/1440. A finalização visual dos componentes abaixo do catálogo está separada na TASK-05A. Autenticação, compra e eventos de domínio ainda serão implementados.

Aplicação: https://jungle-gaming-code-challenge.vercel.app · [Prova de integração](https://jungle-gaming-code-challenge.vercel.app/__proof). Deploy inicial na Vercel do commit `4047da3`; evidências em [RELEASE](docs/RELEASE.md).

TASK-04 concluída na árvore de trabalho: contratos v1, 36 NFTs/dois usuários seed, banco IndexedDB, catálogo MSW, reset/relógio e núcleo de cotação/pedidos. 12 testes unitários, typecheck, lint e build passaram; o usuário confirmou aprovação da suíte E2E local, incluindo catálogo, persistência e reset. Esta base está conectada ao catálogo/detalhe na TASK-05; compra e publicação da nova versão continuam pendentes.

## Documentação e ordem de trabalho

| Documento | Responsabilidade |
| --- | --- |
| [challenge-description.md](challenge-description.md) | Enunciado original e fonte normativa |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Exigências com IDs REQ, classificação e rastreabilidade |
| [ROTEIRO.md](ROTEIRO.md) | Cronograma de dois dias e prioridades |
| [TASKS.md](TASKS.md) | Backlog com dependências, aceite, status e IDs TASK |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Decisões DEC sobre estado, sessão, dinheiro, pedidos e eventos |
| [docs/FLOWS.md](docs/FLOWS.md) | Fluxos FLOW: ações do usuário, estados, alternativas e resultados esperados |
| [docs/MOCKS-GUIDE.md](docs/MOCKS-GUIDE.md) | Guia didático dos arquivos, fixtures, banco, MSW e regras da TASK-04 |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | Contratos propostos API/EVT, payloads, validações e erros |
| [docs/UI-SPEC.md](docs/UI-SPEC.md) | Telas UI, análise dos 15 PNGs, tokens medidos e pendências visuais |
| [docs/SCENARIOS.md](docs/SCENARIOS.md) | Fixtures, controles e cenários determinísticos SCN |
| [docs/TEST-MATRIX.md](docs/TEST-MATRIX.md) | Cobertura TEST, assertions e registro de evidências |
| [docs/RELEASE.md](docs/RELEASE.md) | Gates REL, auditoria, publicação e entrega |

TASK-01 concluída como análise das 15 screenshots e definição da abordagem: fonte semelhante, placeholders temporários e adaptações próprias para telas sem referência (DEC-16, DEC-17, DEC-18). A execução dessas decisões permanece nas tarefas de implementação. TASK-02 a TASK-05 concluídas. Próxima tarefa: TASK-05A, finalização dos componentes da home abaixo do catálogo. Criar testes enquanto implementa fluxos. Atualizar a documentação no mesmo trabalho que alterar comportamento ou contrato.

Exemplo de rastreabilidade: REQ-015 (cotação revalidada) → TASK-08/TASK-10 → DEC-08 → API-08/API-09 e EVT-01 → UI-04 → SCN-10/SCN-17 → TEST-09 → REL-02.

IDs não são renumerados. REQUIREMENTS guarda obrigações; TASKS guarda progresso; TEST-MATRIX guarda resultados/evidências. Evitar copiar estados de execução para todos os documentos. Texto de planejamento não deve ser apresentado como implementação concluída.

## Stack e base inicial

React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse são obrigatórios. Vite e npm estão configurados. Versões resolvidas em package-lock.json; Vite 7.3.7 declarado diretamente. Tipos/lint/build verificados com a instalação atual.

## Setup

Runtime de referência: Node **26.10.0** (`.nvmrc`) e npm **11.19.1**, disponíveis durante a preparação. `engines` requer Node ≥22.12; outras versões ainda não foram verificadas.

Em um checkout limpo, com acesso ao registro npm:

```bash
nvm use
npm ci
cp .env.example .env
npm run typecheck
npm run lint
npm run build
npm run dev
```

`nvm use` é opcional se o Node compatível já estiver instalado. `package-lock.json` está disponível. Tipos, lint e build passaram após instalação pelo usuário; `npm ci --dry-run` também passou. E2E local e smoke do deploy inicial passaram; a instalação real em checkout limpo permanece pendente na TASK-15.

| Comando | Finalidade / estado |
| --- | --- |
| `npm run dev` | Vite em `http://127.0.0.1:5173`; depende da instalação |
| `npm run build` | Typecheck + build otimizado; verificado |
| `npm run preview` | Servir `dist` em `http://127.0.0.1:4173` após build |
| `npm run typecheck` | TypeScript dos arquivos da aplicação/configuração/testes |
| `npm run lint` | ESLint sem warnings permitidos |
| `npm run test:e2e` | Smoke do shell e provas REST/Socket.IO em desktop/mobile; instalar Chromium com `npx playwright install chromium` antes |
| `npm run test:unit` | Testes do domínio: precisão ETH, catálogo, cotação, idempotência, estoque e efeitos de confirmação/recusa; sem browser |
| `npm run test:visual` | Filtro `@visual`; ainda não há testes visuais, portanto não deve ser considerado aprovado |
| `npm run test:report` | Abrir relatório HTML após execução Playwright |
| `npm run audit:lighthouse` | Auditoria exploratória da home; iniciar preview e disponibilizar Chrome antes. Não executa ainda a matriz final da TASK-14 |

O shell tem home inicial e rotas em preparação para detalhe, carrinho, login/cadastro, checkout, pedido, perfil e carteiras. Não há operações de negócio, guards/sessão, dados privados, favoritos ou preço/estoque fictícios dentro dos componentes.

## Configuração

`.env.example` está disponível. As variáveis são públicas; não colocar segredos nelas.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base da instância Axios |
| `VITE_MOCKS_ENABLED` | `true` | Inicia o worker MSW antes de montar as rotas; habilitada no deploy Vercel |
| `VITE_MOCK_SCENARIO` | `SCN-01` | Único cenário disponível nesta etapa; outros cenários entram na TASK-11 |

O worker MSW atende `GET /api/__proof` e responde ao evento Socket.IO `proof.request` com `proof.event`. Para verificar, abra `/__proof` e execute as duas provas. Também atende `GET /api/nfts`, `GET /api/nfts/:id` e controles de status/reset/relógio em `/api/__mock/*`. O bootstrap prepara o IndexedDB antes de montar as rotas. Os endpoints privados de conta/carrinho/compra serão conectados nas tarefas seguintes.

O banco `kurio-demo` mantém um schema interno. Se mudarmos seu formato, dados incompatíveis serão substituídos pelas fixtures. Reset de demonstração: `POST /api/__mock/reset` com `{"scenarioId":"SCN-01"}`. Status: `GET /api/__mock/status`. Relógio: `POST /api/__mock/clock` com `{"advanceMs":2000}`. Esses controles pertencem aos mocks; painel previsto na TASK-11.

## Fonte e assets

Escolhida **IBM Plex Mono**, pesos 400, 500, 600 e 700, como aproximação monoespaçada da referência. Os imports Fontsource geram arquivos locais no build; não há chamadas a Google Fonts/CDN na aplicação. Comparação visual no browser ainda pendente.

Quatro placeholders SVG abstratos estão em `public/assets/placeholders/`. Consulte [inventário de assets](docs/ASSETS.md) para origem e limitações. São temporários e não representam fidelidade às artes dos PNGs.

## Credenciais e cenários — planejados

Credenciais seed propostas: `collector-a@example.test` e `collector-b@example.test`, senha fictícia `DemoNft!2026`. **Ainda não são utilizáveis.** A implementação armazenará verificadores com salt, sem persistir senhas em claro.

Seleção/reset será pelo painel de demonstração e controles MSW descritos em [SCENARIOS](docs/SCENARIOS.md). Para reproduzir falhas, usar SCN-07 (sessão expirada), SCN-10 (preço/estoque), SCN-11 (timeout após criação), SCN-12 (recusa) e SCN-14 (reconexão). Os passos e resultados esperados estão em TEST-03, TEST-07, TEST-09 e TEST-10; substituir por instruções com controles reais quando implementados.

## Testes, relatórios e entrega

O usuário confirmou aprovação do smoke e das provas E2E REST/Socket.IO no terminal local em desktop/mobile. O agente validou manualmente REST e Socket.IO no deploy público, incluindo acesso direto/refresh de `/__proof` e janela anônima. Tipos/lint/build passaram; TEST-16 segue parcial. Não há auditoria Lighthouse realizada. A matriz exige os 12 grupos E2E, baselines de quatro telas e revisão em 390/768/1440. Lighthouse terá 12 medições e medianas por página/perfil. Guardar evidências nos registros de TEST-MATRIX e RELEASE.

Repositório: https://github.com/bernbecht/jungle-gaming-code-challenge. Publicação inicial na Vercel validada na TASK-03; TASK-15 concluirá a entrega e registrará o commit final. Limitações e desvios reais devem constar em ARCHITECTURE, sem tratar propostas como resultados medidos.

### Validar a TASK-05 localmente

Execute `npm run test:e2e` para testar catálogo e detalhe junto das provas anteriores. Abra `/` e `/nfts/nft-001` em 390/768/1440 px; teste busca, filtros, histórico, galeria e quantidade. `/nfts/missing` demonstra 404. Compra/favorito ainda aguardam integração.

Para testar carregamento/erro no catálogo, no console do navegador use `fetch('/api/__mock/catalog-network', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delayMs: 1500, failuresRemaining: 2 }) })` antes de acessar uma busca não presente no cache. Duas falhas permitem observar erro após o retry automático; a nova tentativa manual recupera. Envie ambos como zero ou resete o cenário para restaurar. Contrato/limites em `docs/CONTRACTS.md`.
