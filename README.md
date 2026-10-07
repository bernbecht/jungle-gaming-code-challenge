# NFT Marketplace — desafio frontend

Projeto em **fase de planejamento**. Ainda não há aplicação, package.json, scripts, fixtures executáveis, testes ou deploy. Este README é o ponto de entrada para desenvolver a solução e deverá ser atualizado com instruções verificadas em TASK-15.

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

TASK-01 tem análise das 15 screenshots registrada; fonte/assets separados e algumas decisões continuam pendentes. Prosseguir com TASK-02, concluir prova técnica TASK-03 e seguir dependências. Criar testes enquanto implementa fluxos. Atualizar a documentação no mesmo trabalho que alterar comportamento ou contrato.

Exemplo de rastreabilidade: REQ-015 (cotação revalidada) → TASK-08/TASK-10 → DEC-08 → API-08/API-09 e EVT-01 → UI-04 → SCN-10/SCN-17 → TEST-09 → REL-02.

IDs não são renumerados. REQUIREMENTS guarda obrigações; TASKS guarda progresso; TEST-MATRIX guarda resultados/evidências. Evitar copiar estados de execução para todos os documentos. Texto de planejamento não deve ser apresentado como implementação concluída.

## Stack prevista

React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse são obrigatórios. Vite e npm são escolhas propostas em DEC-01. Versões compatíveis serão fixadas no setup e lockfile.

## Setup e comandos — ainda não disponíveis

TASK-02 deve definir versão do Node/npm e criar os scripts abaixo. Depois da implementação, documentar instalação pelo lockfile (`npm ci`), instalação dos browsers Playwright e passos reais de execução. Os comandos desta tabela são o contrato planejado, não instruções executáveis hoje.

| Comando planejado | Finalidade |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks habilitados pela configuração |
| `npm run build` | Build otimizado |
| `npm run preview` | Servir build para verificação |
| `npm run typecheck` | Verificação TypeScript |
| `npm run lint` | Lint |
| `npm run test:e2e` | Playwright Chromium desktop/mobile |
| `npm run test:visual` | Regressão visual |
| `npm run test:report` | Abrir relatório HTML Playwright |
| `npm run audit:lighthouse` | Executar matriz de auditoria e gerar relatórios |

## Configuração planejada

TASK-02 criará `.env.example`. Estas variáveis são públicas e não devem conter segredos. Validar nomes e comportamento no código antes da entrega.

| Variável | Padrão proposto | Uso |
| --- | --- | --- |
| `VITE_MOCKS_ENABLED` | `true` | Ativar MSW; obrigatório no build da demonstração |
| `VITE_API_BASE_URL` | `/api` | Base das chamadas Axios |
| `VITE_MOCK_SCENARIO` | `SCN-01` | Cenário inicial; não reseta banco existente em cada refresh |

Endpoint socket derivado da origem da aplicação e configurado conforme prova técnica TASK-03. Dados simulados ficam no navegador; reset deve restaurar integralmente o cenário. Não há dependência de backend privado.

## Credenciais e cenários — planejados

Credenciais seed propostas: `collector-a@example.test` e `collector-b@example.test`, senha fictícia `DemoNft!2026`. **Ainda não são utilizáveis.** A implementação armazenará verificadores com salt, sem persistir senhas em claro.

Seleção/reset será pelo painel de demonstração e controles MSW descritos em [SCENARIOS](docs/SCENARIOS.md). Para reproduzir falhas, usar SCN-07 (sessão expirada), SCN-10 (preço/estoque), SCN-11 (timeout após criação), SCN-12 (recusa) e SCN-14 (reconexão). Os passos e resultados esperados estão em TEST-03, TEST-07, TEST-09 e TEST-10; substituir por instruções com controles reais quando implementados.

## Testes, relatórios e entrega

Nenhum teste ou auditoria executado ainda. A matriz exige os 12 grupos E2E, baselines de quatro telas e revisão em 390/768/1440. Lighthouse terá 12 medições e medianas por página/perfil. Guardar evidências nos registros de TEST-MATRIX e RELEASE.

Repositório remoto, URL pública, commit e provedor final: **pendentes**. TASK-03 valida primeira publicação; TASK-15 conclui a entrega. Limitações e desvios reais devem constar em ARCHITECTURE, sem tratar propostas como resultados medidos.
