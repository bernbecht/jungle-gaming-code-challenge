# Regressão visual automatizada

Execute `npm run test:visual`. O Playwright inicia build/preview e compara capturas completas com os PNGs em [visual.spec.ts-snapshots](../tests/e2e/visual.spec.ts-snapshots/). Os oito testes em [visual.spec.ts](../tests/e2e/visual.spec.ts) também integram `npm run test:e2e`.

| Tela | Estado capturado | Projetos |
| --- | --- | --- |
| Início | Visitante, catálogo inicial e seções editoriais | Desktop 1440 × 900; mobile 390 × 844 |
| Detalhe | Violet Nomad, edição 1/10, quantidade 1 | Ambos |
| Carrinho | Collector A, um Violet Nomad, Ethereum, sem cupom | Ambos |
| Pagamento | Dados preenchidos; depois carteira conectada e cotação revisada | Ambos, duas capturas por projeto |

São dez baselines, com largura do projeto e altura total do documento. Elementos fixos aparecem na posição relativa ao viewport da captura. Nenhum conteúdo é mascarado. A suíte usa contexto isolado, reset SCN-01/seed 1, relógio da aplicação e do domínio em `2026-01-15T12:00:00Z`, locale `pt-BR` e timezone `America/Sao_Paulo`. Aguarda o fim dos skeletons, fontes e decodificação das imagens, inclusive as lazy; desabilita animações e caret apenas durante a captura. Há comparação sem tolerância adicional de quantidade de pixels (`maxDiffPixels: 0`), mantendo o limiar de cor padrão do Playwright.

## Ambiente e atualização

As baselines iniciais foram geradas em macOS, com Playwright 1.63.0 e seu Chromium, instalados pelo `package-lock.json`. Os nomes incluem projeto e plataforma (`darwin`). Use `npm ci` e `npx playwright install chromium` para instalar as versões correspondentes. Renderização pode variar entre sistemas operacionais; estas capturas não constituem baselines Linux/Windows. Para outro ambiente, gere e revise seu conjunto próprio, sem renomear imagens de outra plataforma.

Uma execução normal não cria nem atualiza baselines (`updateSnapshots: 'none'`); uma baseline ausente ou diferente falha. Para uma alteração visual intencional:

1. Execute `npm run test:visual -- --update-snapshots` no ambiente das baselines.
2. Inspecione os PNGs e o diff, comparando com as referências em `design/screenshots/` e justificando as diferenças.
3. Execute `npm run test:visual` novamente, sem atualização, e inclua apenas as imagens revisadas no commit da mudança.

Falhas geram expected/actual/diff em `test-results/`, relatório em `playwright-report/` e trace retido. Abra o relatório com `npm run test:report`. Esses artefatos são ignorados; os PNGs de baseline pertencem ao repositório.

## Limite do aceite

As dez capturas iniciais foram inspecionadas para verificar conteúdo completo, imagens carregadas e ausência de estados transitórios. Elas registram a implementação atual, incluindo placeholders locais e decisões temporárias de navegação. O teste detecta mudanças futuras; não mede automaticamente fidelidade ao Figma nem aprova desvios existentes.

A comparação final com as referências, a largura adicional de 414 px prevista em TEST-MATRIX e os ajustes de layout/acessibilidade permanecem na TASK-12, adiada até nova análise. O [relatório anterior](evidence/task12-browser-review/RELATORIO.md) continua preservado; deve ser reavaliado contra a aplicação atual antes de executar suas sugestões. A TASK-13 continua em andamento para consolidar os demais grupos e entregar as evidências finais.
