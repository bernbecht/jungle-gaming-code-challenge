# Roteiro de entrega — NFT Marketplace

Documentos de execução: [requisitos e IDs](REQUIREMENTS.md), [tarefas](TASKS.md), [arquitetura](ARCHITECTURE.md), [contratos](docs/CONTRACTS.md), [interface](docs/UI-SPEC.md), [cenários](docs/SCENARIOS.md), [testes](docs/TEST-MATRIX.md) e [entrega](docs/RELEASE.md). Este roteiro organiza o tempo; o status de execução fica em TASKS e as evidências em TEST-MATRIX. Índice e instruções em [README](README.md).

Plano baseado em `challenge-description.md`. Premissa: uma pessoa, dois dias com aproximadamente 10 horas produtivas por dia. É um prazo agressivo para o escopo; as estimativas são limites de tempo para orientar decisões, não garantia de conclusão. Com apenas 16 horas disponíveis, o risco de não atender integralmente ao enunciado aumenta bastante.

O objetivo é entregar todos os fluxos obrigatórios, com uma implementação simples, consistente e verificável. Prioridade significa ordem de execução, não autorização para omitir requisitos.

## 1. Estratégia

- Construir por fluxos completos: interface → Axios → MSW → estado persistido → resposta → interface.
- Validar primeiro os riscos eliminatórios: stack efetiva, compra confirmada pela simulação, isolamento entre usuários, Socket.IO real no cliente e E2E executável. Publicar uma primeira versão ainda no dia 1.
- Trabalhar a identidade visual desde a base: fidelidade visual e experiência somam 40 pontos. Não deixar toda a estilização para o final.
- Criar testes e documentação junto de cada fluxo. O fim do projeto será para executar, corrigir e registrar evidências.
- Evitar infraestrutura extra: sem backend real, blockchain, gateway, biblioteca global de estado ou abstrações genéricas sem necessidade.

## 2. Primeira etapa: leitura visual e prova técnica

Antes de desenvolver as telas:

1. Abrir o Figma, inventariar os frames desktop/mobile e exportar imagens, ícones e fontes disponíveis. O Figma não pôde ser inspecionado pela ferramenta durante a elaboração deste roteiro; nenhuma medida ou característica visual foi presumida.
2. Mapear tokens: cores, fontes, tamanhos, espaçamentos, raios, bordas e largura de conteúdo. Identificar componentes compartilhados e diferenças de composição mobile.
3. Criar Vite + React + TypeScript e instalar a stack obrigatória. Fixar versões compatíveis e versionar o lockfile.
4. Fazer uma chamada Axios interceptada por MSW e um evento interceptado pelo MSW que chegue por `socket.io-client`.
5. Validar essa prova em build de produção, com mocks habilitados, e na hospedagem pública. Verificar acesso direto e refresh de uma rota interna.

Proposta para o mock Socket.IO: transporte WebSocket, namespace padrão e eventos textuais usando `@mswjs/socket.io-binding`. O binding documenta limitações para namespaces customizados, acknowledgements e anexos binários; a prova inicial deve confirmar compatibilidade das versões instaladas. Fonte: [documentação do binding](https://github.com/mswjs/socket.io-binding).

**Critério de saída:** REST, Socket.IO, roteamento e primeiro teste Playwright funcionando no build que será publicado. Se essa etapa falhar, resolver antes de multiplicar telas.

## 3. Arquitetura proposta

```text
src/
  app/          # Providers, router, inicialização e sessão
  routes/       # Composição das páginas e validação dos parâmetros
  components/   # UI compartilhada e componentes shadcn adaptados
  features/
    catalog/
    auth/
    favorites/
    cart/
    checkout/
    orders/
    profile/
    wallets/
  lib/          # Axios, dinheiro, erros e utilitários pequenos
  contracts/    # DTOs REST, erros e envelopes de eventos
  realtime/     # Cliente Socket.IO, subscriptions e reconciliação
  mocks/        # Handlers REST/socket, banco, fixtures e cenários
tests/
  e2e/
  visual/
docs/           # Contratos e instruções de auditoria
```

Os componentes consomem serviços e hooks; não importam fixtures nem acessam o banco simulado. REST e eventos compartilham o mesmo estado na camada de mocks.

| Tipo de estado | Responsável |
| --- | --- |
| Busca, filtros, ordenação e página | Search params tipados do TanStack Router |
| Sessão, catálogo, favoritos, carrinho, perfil, carteiras e pedidos | TanStack Query, por Axios |
| Diálogos, menus e edição ainda não enviada | Estado local/formulários |
| Dados persistentes da simulação | Banco local versionado, acessado pelos mocks |
| Atualizações em tempo real | Socket.IO, com reconciliação REST |

Complementos opcionais: validação de schemas e biblioteca de formulários, se já dominadas. Não gastar prazo experimentando ferramentas auxiliares.

## 4. Decisões que devem ser tomadas antes das telas

### Contratos e dados

- Definir recursos de sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras. Documentar payloads, status HTTP e erros por campo.
- Incluir dois usuários fictícios, NFTs com diferentes filtros/edições/estoques e quantidade suficiente para paginação.
- Padronizar erros: código estável, mensagem e erros de campo quando aplicável. Cobrir 401, 403, 404, conflitos e falhas transitórias.
- Persistir o banco simulado e oferecer reset completo: dados, sessão, tentativas de compra, versões e cenário. Controlar relógio, latência e disparo de eventos nos testes.
- Não persistir senhas em claro. Usar verificadores derivados com salt para a autenticação fictícia, inclusive cadastro e alteração de senha. Explicar que isso é uma simulação local.

### Precisão monetária e cotação

- ETH entra e sai da API como string decimal. Fazer aritmética exata com unidades inteiras em wei e `BigInt`; serializar valores persistidos como strings.
- Centralizar conversão, arredondamento e apresentação; nunca calcular dinheiro com `Number`/ponto flutuante.
- A cotação da API contém identidade/versão, itens, preços, desconto, taxa e total. O pedido referencia a cotação revisada.
- Revalidar na criação do pedido. Qualquer diferença exige apresentar o novo resumo e obter nova confirmação explícita.

### Sessão, cache e carrinho

- Incluir identidade do usuário nas query keys privadas e todos os parâmetros nas consultas de catálogo.
- Encaminhar o sinal de cancelamento das queries ao Axios. Cancelar consultas antigas ao trocar sessão.
- No logout/troca de usuário: limpar cache privado, listeners e subscriptions; ignorar respostas e eventos da sessão anterior.
- Recuperar sessão antes de resolver rotas privadas. Em expiração, preservar rota, carrinho e contexto necessário à retomada; revalidar o checkout após login.
- Dar identidade persistente ao carrinho do visitante. No login, mesclar itens por NFT + edição, respeitar estoque e informar ajustes, sem duplicar a mesclagem após refresh.
- Política inicial: catálogo com janela curta de frescor; carrinho, cotação e pedido revalidados nos pontos críticos. Uma nova tentativa automática para GETs com falhas transitórias; sem retry automático de erros de negócio. Mutations de compra só podem ser reenviadas com a mesma chave de idempotência.
- Usar favoritos como interação otimista: cancelar consulta concorrente, guardar snapshot, atualizar, restaurar em erro e reconciliar com a API.

### Pedido e tempo real

- Estados do pedido: `pending → confirmed | declined`. Estados terminais não podem regredir.
- Persistir a chave de idempotência antes do envio. Na mesma tentativa, reutilizar chave e payload; a simulação devolve o mesmo pedido. Mesma chave com outro payload gera conflito.
- Desabilitar envio repetido na UI e garantir deduplicação também nos mocks. Após timeout, recuperar a tentativa existente antes de permitir outra compra.
- Persistir o snapshot do recibo. Mudanças futuras no catálogo não alteram itens, taxas ou total do pedido.
- Aplicar a baixa do carrinho uma única vez na confirmação, removendo somente quantidades compradas e preservando adições posteriores. Falha/recusa preserva os itens.
- Eventos incluem `eventId`, recurso, versão e identidade de usuário quando privados. Ignorar duplicatas, versões antigas e eventos de outra sessão.
- `nft.updated` sincroniza catálogo/detalhe e invalida carrinho/cotação. Mudança que afeta filtros ou ordenação exige reconsulta da listagem.
- `order.updated` atualiza o pedido sem reaplicar efeitos da confirmação. Só mostrar recibo confirmado após estado confirmado da simulação.
- Na reconexão, consultar novamente os recursos ativos. Um pedido pendente deve ser recuperável por REST mesmo quando seu evento terminal foi perdido.

## 5. Dia 1 — base e compra completa

Horários relativos ao início do dia. Testes pequenos acompanham cada bloco.

| Bloco | Tempo | Trabalho | Critério de conclusão |
| --- | ---: | --- | --- |
| 1 | 1h30 | Figma, assets, setup, prova REST/socket, primeiro deploy e smoke E2E | Build público com mocks, socket e rota interna funcionais |
| 2 | 1h30 | Contratos, banco persistido, fixtures, reset, sessão e núcleo de pedidos/cotações | Cenário padrão reproduzível e regras centrais definidas |
| 3 | 2h | Shell responsivo, tokens, início, catálogo, detalhe e favoritos | URL governa catálogo; detalhe direto e estados de carregamento/erro funcionam |
| 4 | 2h | Cadastro/login, proteção de rotas, carrinho, cupom e mesclagem visitante | Login preserva carrinho; resumo vem da API; favorito tem rollback |
| 5 | 2h | Checkout, carteiras mínimas necessárias, revisão, pedido e recibo | Compra completa com idempotência e confirmação pela simulação |
| 6 | 1h | E2E da compra em desktop/mobile, correções e atualização do deploy | Fluxo feliz executável e verificável na versão pública |

**Marco do dia 1:** uma pessoa consegue descobrir um NFT, autenticar-se, montar o carrinho, selecionar carteira/rede, comprar e recuperar o pedido após refresh. Telas ainda podem precisar de acabamento, mas o caminho inteiro passa pelas integrações obrigatórias.

## 6. Dia 2 — completar conta, falhas e evidências

Com a decomposição, o bloco da antiga TASK-09 foi reestimado de 1h30 para 1h50.

| Bloco | Tempo | Trabalho | Critério de conclusão |
| --- | ---: | --- | --- |
| 7A | 30 min | TASK-09A — editar dados do perfil e tratar validação/versão | Perfil persiste; erros da API aparecem nos campos |
| 7B | 20 min | TASK-09B — enviar, validar e remover avatar | Avatar permitido persiste; arquivo inválido é rejeitado sem salvar |
| 7C | 20 min | TASK-09C — alterar senha com confirmação | Senha antiga falha e nova autentica; segredo não fica em claro |
| 7D | 40 min | TASK-09D — cadastrar/editar carteiras principal e secundária | Carteiras persistem, mostram erros e aparecem atualizadas no checkout |
| 8 | 2h | Eventos completos, reconexão, expiração, preço/estoque, recusa e timeout | Cotação antiga bloqueada; mesma tentativa recupera mesmo pedido; sem vazamento entre usuários |
| 9 | 1h30 | Conferência Figma em 390/768/1440, skeletons, teclado, foco, zoom e movimento reduzido | Telas coerentes, sem overflow, feedback acessível |
| 10 | 2h | Completar e executar os 12 grupos E2E; baselines das quatro telas | Suíte isolada e reproduzível, HTML report e traces em falhas |
| 11 | 1h | Lighthouse, correções de maior impacto e relatórios finais | 12 medições válidas: duas páginas × dois perfis × três repetições |
| 12 | 1h | README, arquitetura, contratos, checkout limpo e deploy final | Repositório e URL representam a mesma versão; execução documentada |
| Reserva | 1h | Falhas de integração, testes ou publicação | Corrigir bloqueadores antes de adicionar acabamento opcional |

Executar uma auditoria preliminar assim que início e detalhe estiverem estáveis. A hora do bloco 11 é para consolidar evidências e pequenos ajustes, não para descobrir problemas estruturais.

## 7. Plano de testes e cenários

Manter uma matriz que relacione cada um dos 12 grupos do enunciado a testes executáveis. Agrupar por fluxo sem perder cenários:

| Suíte | Cobertura |
| --- | --- |
| Catálogo | Busca, filtros combinados, ordenação, paginação, histórico, detalhe direto e 404 |
| Sessão e conta | Cadastro/conflito, login, expiração, logout, troca de usuário, perfil/avatar/senha e carteiras |
| Favoritos e carrinho | Otimismo/rollback, quantidades, remoção, cupons, persistência e mesclagem no login |
| Compra | Compra confirmada, recusa, clique repetido, timeout após criação, recibo imutável e refresh |
| Tempo real | Preço/estoque no checkout, evento duplicado/antigo, desconexão e retomada de pendência |
| Experiência | Teclado, foco de diálogos, erros associados, skeletons em lentidão e nova tentativa |

- Executar fluxos principais em Chromium desktop e mobile. Conferir também 768 px.
- Regressão visual de início, detalhe, carrinho e pagamento em desktop/mobile, com baselines versionadas e revisadas visualmente contra o Figma.
- Fixar dados, relógio, fontes e condições de animação nas capturas. Não aceitar baseline apenas porque o teste passou.
- Cada teste inicia em cenário isolado; não depende da ordem de execução nem de sleeps arbitrários.
- O mecanismo de controle dos cenários altera o banco e emite eventos pela camada de mocks. Nunca chama setters/cache da aplicação diretamente.
- Incluir cenários de vazio, respostas fora de ordem, conexão indisponível, 4xx/5xx, não autorizado, validação, cupom expirado, esgotamento, timeout e confirmação/recusa.
- Testes unitários pequenos são úteis para precisão em ETH, idempotência e transições terminais; não substituem o E2E obrigatório.

## 8. Performance e publicação

- Assets e fontes locais, dimensões explícitas, imagens dimensionadas, lazy loading fora da primeira dobra e atenção ao recurso de LCP.
- Evitar dependências e trabalho de renderização desnecessários; dividir rotas quando trouxer benefício concreto.
- Auditar início e detalhe no build otimizado com o cenário padrão, sem desligar funcionalidades para elevar pontuação.
- Metas: Performance ≥ 90; Accessibility ≥ 95; Best Practices ≥ 95; SEO ≥ 90.
- Entregar HTML/JSON, medianas por categoria/página/perfil, LCP/CLS/TBT, versões e condições de execução. Documentar causas e limitações se alguma meta não for atingida.
- Escolher uma das hospedagens aceitas; configurar fallback de SPA, assets e worker MSW. Mocks precisam estar habilitados no build público por configuração.
- Fazer smoke da URL pública: acesso direto, refresh, login, catálogo, compra e evento de atualização. Não basta o preview local funcionar.

## 9. Checklist final

- [ ] Todas as tecnologias obrigatórias participam efetivamente da aplicação.
- [ ] Todas as nove telas e seus estados principais funcionam em desktop/mobile.
- [ ] Busca/filtros/paginação persistem na URL e respeitam histórico.
- [ ] Refresh recupera sessão, carrinho, conta e pedidos.
- [ ] Logout e troca de usuário não expõem dados privados anteriores.
- [ ] Compra revalida cotação, é idempotente e só confirma pela simulação.
- [ ] Recusa e timeout preservam dados e permitem recuperação correta.
- [ ] Eventos passam por Socket.IO, toleram duplicatas e reconciliam após reconexão.
- [ ] Cenários de falha e reset são reproduzíveis na demonstração.
- [ ] E2E dos 12 grupos, baselines, relatório HTML e configuração de traces entregues.
- [ ] Auditorias Lighthouse e condições de reprodução entregues.
- [ ] README, ARCHITECTURE e contratos cobrem setup, credenciais, variáveis, cache, sessão, eventos e limitações.
- [ ] Scripts disponíveis para dev com mocks, build, preview, tipos, lint, E2E e Lighthouse.
- [ ] Checkout limpo instala pelo lockfile e executa sem serviços privados.
- [ ] Repositório e aplicação pública entregues na mesma versão.

## 10. Se o prazo apertar

Reduzir variedade de componentes, animações extras, abstrações, bibliotecas auxiliares e funcionalidades fora do escopo. Reutilizar componentes de formulário, resumo de pedido e estados de erro. Congelar trabalho opcional após o marco do dia 1.

Não sacrificar requisitos eliminatórios, isolamento de usuário, compra consistente, Socket.IO, testes executáveis ou deploy. Se houver requisito obrigatório incompleto, registrar a lacuna explicitamente; documentação não o torna atendido.

O maior risco é deixar integração, testes e publicação para as últimas horas. A primeira versão pública e a primeira compra E2E são os marcos que devem orientar o restante da entrega.
