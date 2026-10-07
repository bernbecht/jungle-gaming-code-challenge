# NFT Marketplace — desafio frontend

Projeto com **TASK-02 concluída**: base, tipos, lint e build aprovados; dependências instaladas e lockfile presente. O smoke Playwright desktop/mobile foi executado e aprovado pelo usuário no terminal local. A sandbox desta sessão bloqueou a repetição do teste (EPERM na porta de preview). Catálogo, autenticação, compra, mocks e tempo real ainda não estão implementados. Não há deploy.

## Documentação e ordem de trabalho

| Documento | Responsabilidade |
| --- | --- |
| [challenge-description.md](challenge-description.md) | Enunciado original e fonte normativa |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Exigências com IDs REQ, classificação e rastreabilidade |
| [ROTEIRO.md](ROTEIRO.md) | Cronograma de dois dias e prioridades |
| [TASKS.md](TASKS.md) | Backlog com dependências, aceite, status e IDs TASK |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Decisões DEC sobre estado, sessão, dinheiro, pedidos e eventos |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | Contratos propostos API/EVT, payloads, validações e erros |
| [docs/UI-SPEC.md](docs/UI-SPEC.md) | Telas UI, análise dos 15 PNGs, tokens medidos e pendências visuais |
| [docs/SCENARIOS.md](docs/SCENARIOS.md) | Fixtures, controles e cenários determinísticos SCN |
| [docs/TEST-MATRIX.md](docs/TEST-MATRIX.md) | Cobertura TEST, assertions e registro de evidências |
| [docs/RELEASE.md](docs/RELEASE.md) | Gates REL, auditoria, publicação e entrega |

TASK-01 concluída como análise das 15 screenshots e definição da abordagem: fonte semelhante, placeholders temporários e adaptações próprias para telas sem referência (DEC-16, DEC-17, DEC-18). A execução dessas decisões permanece nas tarefas de implementação. TASK-02 concluída. TASK-03 em andamento para a prova técnica REST/MSW e Socket.IO/MSW. Criar testes enquanto implementa fluxos. Atualizar a documentação no mesmo trabalho que alterar comportamento ou contrato.

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

`nvm use` é opcional se o Node compatível já estiver instalado. `package-lock.json` está disponível. Tipos, lint e build passaram após instalação pelo usuário; `npm ci --dry-run` também passou. A instalação real em checkout limpo e os testes no navegador ainda precisam ser realizados.

| Comando | Finalidade / estado |
| --- | --- |
| `npm run dev` | Vite em `http://127.0.0.1:5173`; depende da instalação |
| `npm run build` | Typecheck + build otimizado; verificado |
| `npm run preview` | Servir `dist` em `http://127.0.0.1:4173` após build |
| `npm run typecheck` | TypeScript dos arquivos da aplicação/configuração/testes |
| `npm run lint` | ESLint sem warnings permitidos |
| `npm run test:e2e` | Smoke do shell; instalar Chromium com `npx playwright install chromium` antes |
| `npm run test:visual` | Filtro `@visual`; ainda não há testes visuais, portanto não deve ser considerado aprovado |
| `npm run test:report` | Abrir relatório HTML após execução Playwright |
| `npm run audit:lighthouse` | Auditoria exploratória da home; iniciar preview e disponibilizar Chrome antes. Não executa ainda a matriz final da TASK-14 |

O shell tem home inicial e rotas em preparação para detalhe, carrinho, login/cadastro, checkout, pedido, perfil e carteiras. Não há operações de negócio, guards/sessão, dados privados, favoritos ou preço/estoque fictícios dentro dos componentes.

## Configuração

`.env.example` está disponível. As variáveis são públicas; não colocar segredos nelas.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base da instância Axios |
| `VITE_MOCKS_ENABLED` | `true` | Lida/validada, mas ativação MSW será implementada em TASK-03 |
| `VITE_MOCK_SCENARIO` | `SCN-01` | Reservada para cenários; handlers/banco ainda não existem |

Não há chamadas de negócio nem worker MSW inicializado nesta etapa. `true` na configuração ainda não significa mocks funcionais. Socket.IO e MSW estão declarados como dependências; prova de transporte/binding e bootstrap fazem parte da TASK-03.

## Fonte e assets

Escolhida **IBM Plex Mono**, pesos 400, 500, 600 e 700, como aproximação monoespaçada da referência. Os imports Fontsource geram arquivos locais no build; não há chamadas a Google Fonts/CDN na aplicação. Comparação visual no browser ainda pendente.

Quatro placeholders SVG abstratos estão em `public/assets/placeholders/`. Consulte [inventário de assets](docs/ASSETS.md) para origem e limitações. São temporários e não representam fidelidade às artes dos PNGs.

## Credenciais e cenários — planejados

Credenciais seed propostas: `collector-a@example.test` e `collector-b@example.test`, senha fictícia `DemoNft!2026`. **Ainda não são utilizáveis.** A implementação armazenará verificadores com salt, sem persistir senhas em claro.

Seleção/reset será pelo painel de demonstração e controles MSW descritos em [SCENARIOS](docs/SCENARIOS.md). Para reproduzir falhas, usar SCN-07 (sessão expirada), SCN-10 (preço/estoque), SCN-11 (timeout após criação), SCN-12 (recusa) e SCN-14 (reconexão). Os passos e resultados esperados estão em TEST-03, TEST-07, TEST-09 e TEST-10; substituir por instruções com controles reais quando implementados.

## Testes, relatórios e entrega

O usuário confirmou que o smoke Playwright passou no terminal local em desktop/mobile. A sandbox impediu repetição pelo agente; o resultado local não deve ser confundido com execução dos fluxos REST/socket. Tipos/lint/build passaram; TEST-16 segue parcial. Não há auditoria Lighthouse realizada. A matriz exige os 12 grupos E2E, baselines de quatro telas e revisão em 390/768/1440. Lighthouse terá 12 medições e medianas por página/perfil. Guardar evidências nos registros de TEST-MATRIX e RELEASE.

Repositório remoto, URL pública, commit e provedor final: **pendentes**. TASK-03 valida primeira publicação; TASK-15 conclui a entrega. Limitações e desvios reais devem constar em ARCHITECTURE, sem tratar propostas como resultados medidos.
