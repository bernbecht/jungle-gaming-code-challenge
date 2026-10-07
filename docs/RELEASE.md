# Verificação e entrega

Status: **deploy inicial da TASK-03 publicado e validado; auditoria e entrega final ainda pendentes**. [TASK-15](../TASKS.md), [requisitos](../REQUIREMENTS.md), [matriz de testes](TEST-MATRIX.md).

## Gates de entrega

| ID | Verificação | Evidência de saída | Requisitos / testes | Status |
| --- | --- | --- | --- | --- |
| REL-01 | Instalar em checkout limpo usando runtime/package manager fixados e lockfile; rodar tipos, lint e build | Versões, comandos, logs, commit | REQ-047, REQ-050; TEST-16 | Pendente |
| REL-02 | Executar 12 grupos E2E desktop/mobile e visual, revisar acessibilidade e fluxos | HTML report, traces de falhas, baselines e revisão das três larguras | REQ-037, REQ-039, REQ-041, REQ-042, REQ-043, REQ-044; TEST-01 a TEST-14 | Pendente |
| REL-03 | Auditar início/detalhe no build final com cenário padrão | 12 HTML + 12 JSON, medianas/métricas e ambiente | REQ-045, REQ-046; TEST-15 | Pendente |
| REL-04 | Publicar versão correspondente ao commit entregue e executar smoke público | URL, commit, data e resultado | REQ-033, REQ-048; TEST-18 | Pendente |
| REL-05 | Atualizar documentação com implementação real e reunir artefatos | README completo, contratos/arquitetura atualizados, instruções de cenários e links válidos | REQ-028, REQ-047, REQ-049, REQ-050; TEST-16 | Pendente |

## Lighthouse — REL-03

1. Fixar versões de runtime, Chrome e Lighthouse na configuração/relatório. Registrar sistema operacional, CPU/memória, modo headless, throttling e comandos finais.
2. Gerar build otimizado e servir via preview; não usar servidor de desenvolvimento. Ativar mocks em SCN-01 e carregar imagens, fontes e funcionalidades reais da entrega.
3. Rodar `/` e `/nfts/nft-001` em perfis mobile e desktop, três vezes cada. Cada rodada inicia com storage/perfil limpos, mesma fixture e mesmas condições. Não rodar medições simultâneas.
4. Salvar HTML/JSON por página/perfil/rodada. Calcular mediana de cada categoria separadamente; registrar LCP/CLS/TBT por rodada e mediana.
5. Comparar Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90. Analisar causas quando abaixo; não desligar imagens, fontes, mocks ou funcionalidades apenas para obter pontuação.
6. Se corrigir código que afete medições, repetir conjunto relevante no build atualizado; os relatórios finais devem corresponder à versão entregue.

Diretório proposto: `artifacts/lighthouse/<pagina>/<perfil>/run-<n>.{html,json}` e `artifacts/lighthouse/summary.md`. Configuração versionada em caminho a definir em TASK-14. Não há relatórios disponíveis ainda.

## Publicação — REL-04

Provedor escolhido pelo usuário em 07/10/2026: **Vercel**. `vercel.json` configura o fallback da SPA para rotas internas; o build `dist` é gerado por `npm run build`. Repositório importado pelo painel web conectado ao GitHub, com preset Vite e `VITE_MOCKS_ENABLED=true` em Production/Preview.

Deploy inicial aprovado em 07/10/2026 após o usuário liberar o acesso ao repositório:

- URL pública: https://jungle-gaming-code-challenge.vercel.app
- Commit: `4047da30e6ceab18c71461c1039f3cf8018efe55` (branch `main`).
- Deployment: `dpl_HLZFEAJ95RT29n9ipfAHJHzKaMnj`.
- Smoke manual pelo agente no Chrome: home, acesso direto/refresh de `/__proof`, respostas REST e Socket.IO aprovadas. Repetido em janela anônima, sem autenticação na Vercel. As provas confirmam que o worker e a interceptação funcionam no build hospedado.
- Limite: demonstração de transporte; ainda não comprova os fluxos de negócio do deploy final (TASK-15).

Configurar build, diretório de saída, fallback SPA para rotas internas e entrega de assets/worker sem rewrite indevido. Variáveis públicas devem habilitar mocks sem conter segredos. Conferir que carregamento do worker e interceptação Socket.IO funcionam no build hospedado antes de prosseguir com funcionalidades.

No deploy final, testar rotas públicas e privadas por acesso direto/refresh, compra, cenário de preço alterado, reset e recuperação de pedido. Garantir que a aplicação permaneça acessível durante a avaliação. Guardar identificação do commit/deploy; código, baselines e relatórios precisam ter origem identificável.

## Registro final a preencher

- Repositório: https://github.com/bernbecht/jungle-gaming-code-challenge.
- URL pública / provedor: https://jungle-gaming-code-challenge.vercel.app / Vercel.
- Commit/deployment inicial: registrados em REL-04 acima; versão final ainda pendente.
- Runtime, npm, browser, Playwright e Lighthouse: pendentes.
- Relatórios E2E / traces / baselines: pendentes.
- Relatórios Lighthouse / medianas / causas de desvios: pendentes.
- Resultado de checkout limpo e smoke público: pendente.
- Requisitos não atendidos e limitações remanescentes: ainda não avaliados; consultar REQUIREMENTS.

Não declarar conclusão enquanto houver critério eliminatório sem evidência. Se houver outra obrigação incompleta, registrar explicitamente; documentação de uma lacuna não a torna atendida.
