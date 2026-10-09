# Verificação e entrega

Referência para preparar a entrega do code challenge e permitir que o avaliador confira código, aplicação e evidências da mesma versão. **O deploy inicial foi validado; a entrega final e suas auditorias permanecem pendentes.** Este documento não registra uma nova publicação nem uma nova execução de testes.

O formato exigido é **link do repositório + URL pública da aplicação**, com código-fonte, lockfile, assets, mocks, fixtures, testes e configuração de auditoria. O [enunciado, seção 12](../challenge-description.md#12-entrega), também exige README com instruções reproduzíveis e documentação técnica. Não determina PDF, vídeo ou apresentação como formato de entrega.

Os IDs REL-01 a REL-05 são estáveis. Progresso: [TASKS](../TASKS.md). Resultados de testes: [TEST-MATRIX](TEST-MATRIX.md). Critérios: [REQUIREMENTS](../REQUIREMENTS.md).

## O que disponibilizar ao avaliador

| Item | Conteúdo / localização | Situação atual |
| --- | --- | --- |
| Repositório e versão | [GitHub](https://github.com/bernbecht/jungle-gaming-code-challenge); identificar o hash final entregue | Repositório existente; hash final ainda não definido |
| Aplicação pública | [Demonstração na Vercel](https://jungle-gaming-code-challenge.vercel.app); deve corresponder ao hash entregue | Há registro de smoke do deploy inicial; smoke da versão final pendente |
| Instruções de uso e execução | `README.md`, setup, ambiente, credenciais, cenários/reset e reprodução de falhas | README atual preservado; [README.avaliacao.md](../README.avaliacao.md) é uma versão separada para revisão, ainda sem substituir o atual |
| Explicação das escolhas | [ARCHITECTURE](../ARCHITECTURE.md), [decisões para avaliação](DECISOES-PARA-AVALIACAO.md), [contratos](CONTRACTS.md) e [fluxos](FLOWS.md) | Documentação em revisão; conferir consistência com a versão final |
| Evidências Playwright | Relatório HTML da execução final, traces das falhas e baselines visuais versionadas | Execuções parciais registradas; pacote final e baselines pendentes |
| Evidências Lighthouse | 12 relatórios HTML + 12 JSON, configuração, medianas, LCP/CLS/TBT e ambiente | Auditoria final pendente; script atual é exploratório |
| Limitações | Requisitos incompletos, desvios de UX/Figma e alcance real das simulações | Registrar o estado final explicitamente, com referência ao requisito/decisão |

Para facilitar a leitura, a mensagem de entrega deve identificar repositório, demonstração, hash final, documento de entrada e localização dos relatórios. Links para evidências precisam funcionar sem acesso a serviços privados. A lista acima organiza o material exigido; não acrescenta um formato obrigatório ao enunciado.

## Critérios de conclusão

| ID | Verificação | Evidência de saída | Requisitos / testes | Status final |
| --- | --- | --- | --- | --- |
| REL-01 | Instalar em checkout limpo usando runtime/package manager fixados e lockfile; rodar tipos, lint, unidade e build | Versões efetivamente usadas, comandos, logs e hash | REQ-047, REQ-050; TEST-16 | Pendente; verificações de etapas anteriores não substituem checkout limpo final |
| REL-02 | Cobrir os 12 grupos E2E exigidos em desktop/mobile; regressão visual e revisão de acessibilidade/responsividade | HTML report, traces de falhas, baselines revisadas e evidência das larguras | REQ-037, REQ-039, REQ-041 a REQ-044; TEST-01 a TEST-14 | Pendente; cobertura/evidências parciais em TEST-MATRIX |
| REL-03 | Auditar início/detalhe no build final com cenário padrão | 12 HTML + 12 JSON, medianas, métricas e ambiente | REQ-045, REQ-046; TEST-15 | Pendente |
| REL-04 | Publicar versão correspondente ao hash entregue e executar smoke público | URL, hash/deployment, data e resultado | REQ-033, REQ-048; TEST-18 | Deploy inicial validado; smoke final pendente |
| REL-05 | Conferir documentação real e reunir artefatos acessíveis | README completo, contratos/arquitetura, cenários e links válidos | REQ-028, REQ-047, REQ-049, REQ-050; TEST-16 | Em preparação |

## Verificação local — REL-01, REL-02

Configuração versionada: Node `26.10.0` em [.nvmrc](../.nvmrc), npm `11.19.1` em [package.json](../package.json) e lockfile. O mínimo declarado em `engines` é Node `22.12.0`; registre a versão realmente usada na entrega. As variáveis públicas estão em [.env.example](../.env.example): API `/api`, mocks habilitados e cenário `SCN-01`.

Em um checkout limpo da versão candidata, com o runtime configurado:

```sh
npm ci
cp .env.example .env
npx playwright install chromium
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

Registre os resultados reais dos comandos; não marque uma etapa como aprovada apenas porque o script existe. O comando E2E usa [playwright.config.ts](../playwright.config.ts), que inicia build/preview quando necessário e configura Chromium desktop 1440 × 900 e mobile 390 × 844. A revisão manual inclui tablet 768 px e comparação com os frames do Figma, conforme a matriz de testes.

O reporter gera `playwright-report/`; traces e screenshots de falhas ficam em `test-results/`. Para abrir o relatório localmente, use `npm run test:report`. A configuração não faz retries automáticos. Se um preview já estiver aberto fora de CI, ele pode ser reutilizado: confira que está servindo o build candidato.

`npm run test:visual` executa oito testes `@visual` de início, detalhe, carrinho e pagamento em Chromium desktop/mobile, com dez baselines (pagamento inclui dados e revisão). Procedimento e limites em [VISUAL-TESTS](VISUAL-TESTS.md). As baselines registram a aplicação atual; o aceite contra as referências e as correções adiadas na TASK-12 continuam pendentes. REL-02 ainda exige a consolidação dos demais grupos e artefatos.

`playwright-report/`, `test-results/` e `artifacts/` estão ignorados pelo Git. Para a entrega, reúna as evidências finais em um pacote ou localização acessível e registre o link abaixo; não presuma que os relatórios serão enviados junto com o código. Baselines e configuração de auditoria devem ser versionadas, conforme o enunciado.

## Lighthouse — REL-03

A matriz obrigatória é início `/` e detalhe `/nfts/nft-001` × mobile/desktop × três rodadas: **12 medições**, cada uma com HTML e JSON.

1. Registrar Node, npm, Chrome e Lighthouse efetivamente usados, sistema operacional, CPU/memória, modo headless, throttling e comandos/configuração.
2. Gerar build otimizado e servir via preview; usar mocks em SCN-01, com imagens, fontes e funcionalidades reais. Não medir o servidor de desenvolvimento.
3. Executar rodadas sequenciais, com storage/perfil limpos e mesmas fixtures/condições. Não medir páginas simultaneamente.
4. Salvar relatórios por página/perfil/rodada; calcular mediana de cada categoria separadamente e registrar LCP/CLS/TBT por rodada e mediana.
5. Comparar as metas: Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥90. Explicar causas de desvios; manter os recursos da aplicação durante a auditoria.
6. Após mudanças que afetem medições, repetir o conjunto pertinente no build atualizado. Identificar a versão que originou os relatórios.

O [script atual](../scripts/lighthouse.mjs), acionado por `npm run audit:lighthouse`, pressupõe preview em `http://127.0.0.1:4173` e executa **uma medição exploratória da home**, salvando HTML/JSON com prefixo `artifacts/lighthouse/home`. Ele não inicia o preview, não percorre a matriz completa e não calcula medianas. A configuração final e os relatórios pertencem à TASK-14.

Organização proposta para os artefatos finais: `artifacts/lighthouse/<pagina>/<perfil>/run-<n>.{html,json}` e `artifacts/lighthouse/summary.md`. Esse formato ainda não é produzido pelo script atual. Não há pacote final de auditoria registrado neste documento.

## Publicação — REL-04

Provedor escolhido pelo usuário em 07/10/2026: **Vercel**. [vercel.json](../vercel.json) configura fallback SPA para rotas internas; `npm run build` gera `dist`. O repositório foi importado pelo painel web conectado ao GitHub, com preset Vite e `VITE_MOCKS_ENABLED=true` em Production/Preview.

### Evidência histórica: deploy inicial

Deploy inicial aprovado em 07/10/2026 após o usuário liberar o acesso ao repositório:

- URL pública: [jungle-gaming-code-challenge.vercel.app](https://jungle-gaming-code-challenge.vercel.app).
- Hash: `4047da30e6ceab18c71461c1039f3cf8018efe55`, branch `main`.
- Deployment: `dpl_HLZFEAJ95RT29n9ipfAHJHzKaMnj`.
- Smoke manual pelo agente no Chrome: home, acesso direto/refresh de `/__proof`, REST e Socket.IO aprovados. Repetido em janela anônima, sem autenticação na Vercel.
- Alcance: worker e interceptação no build hospedado. Esse registro não comprova que a URL pública atual contém todos os fluxos posteriores nem substitui o smoke final.

### Conferência da versão final

Conferir que o hash publicado é o mesmo identificado na entrega e que o site permanece acessível ao avaliador. Usar contexto limpo de navegador, com os mocks ativos, e registrar data, deployment e resultados.

| Verificação pública | Resultado a observar |
| --- | --- |
| Home e `/nfts/nft-001` por acesso direto/refresh | Conteúdo e assets carregam; rotas não retornam 404 do host |
| `/__proof` | REST e Socket.IO atravessam o mock hospedado |
| Rota privada sem sessão e login com retorno | Proteção e navegação funcionam no build publicado |
| Carrinho visitante → login → compra | Merge, cotação, pedido pendente e recibo confirmado; resultado coerente no carrinho |
| Refresh de `/orders/:orderId` e recuperação da tentativa | Pedido da conta atual é recuperado sem compra duplicada |
| Falhas/alterações disponíveis na versão final | Reproduzir conforme SCENARIOS, sem tratar casos planejados como controles disponíveis |
| Reset | Restaura as fixtures e permite repetir a demonstração |
| Assets, fonte e worker | Arquivos servidos corretamente, sem rewrite indevido ou dependência privada |

Verificar também as demais rotas implementadas no momento da entrega. Não há controle dedicado para alterar preço ou esgotar arbitrariamente uma edição; essa variante é documentada como parcial em SCN-10 e não é comprovada pela lista de smoke. Não foi feita consulta ao deploy durante esta revisão documental.

## Registro final a preencher

| Campo | Registro |
| --- | --- |
| Repositório | [GitHub](https://github.com/bernbecht/jungle-gaming-code-challenge) |
| URL / provedor | [Vercel](https://jungle-gaming-code-challenge.vercel.app) |
| Hash final / deployment / data | Pendente; o deploy inicial está registrado acima |
| Node / npm / Chrome / Playwright / Lighthouse usados | Pendente de registro final; configuração de Node/npm descrita em REL-01 |
| Checkout limpo: comandos e resultados | Pendente |
| E2E: HTML / traces / baselines | Pendente de localização acessível e vínculo com a versão final |
| Lighthouse: configuração / HTML / JSON / medianas / ambiente | Pendente |
| Smoke público: rotas, fluxos e resultados | Pendente |
| README escolhido como entrada da entrega | Pendente de decisão; manter as duas versões atuais durante a revisão |
| Requisitos incompletos e limitações finais | Consolidar a partir de REQUIREMENTS, TASKS e evidências |

Não declarar conclusão enquanto houver critério eliminatório sem evidência. Obrigações incompletas devem ser registradas explicitamente; documentar uma lacuna não a torna atendida.
