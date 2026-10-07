# Arquitetura e decisões

Status: **projeto proposto; implementação ainda não iniciada**. Decisões abaixo guiam o desenvolvimento e devem ser atualizadas quando o código trouxer evidência diferente. Fonte de obrigações: [REQUIREMENTS.md](REQUIREMENTS.md). Payloads: [CONTRACTS](docs/CONTRACTS.md).

## Estrutura e limites

```text
src/
  app/          # bootstrap, providers e sessão
  routes/       # TanStack Router e composição das páginas
  components/   # componentes compartilhados e shadcn/ui
  features/     # catalog, auth, favorites, cart, checkout, orders, profile, wallets
  contracts/    # DTOs, erros e envelopes de eventos
  lib/          # Axios, dinheiro e funções pequenas
  realtime/     # socket, subscriptions e reconciliação
  mocks/        # handlers, banco, fixtures, cenários e relógio
tests/
  e2e/
  visual/
docs/
```

| ID | Decisão e motivação | Requisitos |
| --- | --- | --- |
| DEC-01 | Vite + React + TypeScript, npm e lockfile; stack obrigatória sem biblioteca global adicional de estado. Versões serão fixadas em TASK-02 após prova de compatibilidade | REQ-001, REQ-050 |
| DEC-02 | URL guarda busca/filtros/ordenação/página; Query guarda estado remoto; estado local guarda edição/formulários/diálogos. Não duplicar carrinho em outro store | REQ-005, REQ-025, REQ-027 |
| DEC-03 | Componentes → hooks Query → serviços Axios → handlers MSW → domínio/banco simulado. Eventos e REST usam o mesmo domínio. UI não importa fixtures | REQ-025, REQ-029, REQ-030, REQ-032 |
| DEC-04 | Inicialização aguarda ativação dos mocks, depois recupera sessão e resolve guards. Token fictício opaco persistido; handlers verificam dono e expiração em toda operação privada | REQ-021, REQ-022, REQ-023 |
| DEC-05 | Banco simulado versionado em IndexedDB, com transações para pedido/estoque/carrinho/idempotência; verificador de senha derivado com salt, nunca senha em claro persistida | REQ-016, REQ-019, REQ-024, REQ-030 |
| DEC-06 | Aritmética em wei com BigInt; transporte/persistência com strings decimais ETH. Conversão estrita até 18 casas, quantidades inteiras positivas, descontos em basis points com arredondamento para baixo em wei | REQ-012 |
| DEC-07 | Carrinho de visitante tem identidade opaca. Login mescla uma vez por identidade/revisão, soma NFT+edição até estoque, informa ajustes e consome origem. Logout cria novo visitante vazio | REQ-009, REQ-010, REQ-023 |
| DEC-08 | Cotação é snapshot com versão/validade, rede, itens e totais. Compra revalida atomicamente; diferença retorna conflito e nova cotação para revisão explícita | REQ-014, REQ-015 |
| DEC-09 | Tentativa persistida antes do envio, por usuário, com chave e payload imutável. Busca por chave ou reenvio idêntico recupera pedido. Nova revisão gera nova tentativa somente após resolver a anterior | REQ-016, REQ-017 |
| DEC-10 | Mock reserva estoque ao criar pendência; confirma consumo ou libera reserva na recusa. Carrinho conserva itens até confirmação. Snapshot do recibo nunca consulta preço atual | REQ-017, REQ-019, REQ-020 |
| DEC-11 | Socket com transporte WebSocket no mock, namespace padrão e eventos textuais. Provar binding MSW compatível em TASK-03; sem acknowledgements como dependência de negócio | REQ-032, REQ-033 |
| DEC-12 | Versão por recurso + IDs de evento; comparar versões também nas respostas REST para evitar regressão. Reconexão invalida/reconsulta recursos ativos | REQ-027, REQ-034, REQ-035, REQ-036 |
| DEC-13 | Favoritos são a mutation otimista: cancelar leitura, guardar snapshot, aplicar mudança, rollback em erro e invalidar ao concluir. Serializar ações do mesmo NFT para evitar rollback sobre ação posterior | REQ-008 |
| DEC-14 | Assets locais, tokens extraídos do Figma, estados acessíveis reutilizáveis e layouts próprios para mobile quando necessários | REQ-004, REQ-037, REQ-038, REQ-039, REQ-040 |
| DEC-15 | Cenários controlados por configuração/painel de demonstração; testes acionam handlers de controle, nunca setters/cache. Relógio do domínio e latência são controláveis | REQ-031, REQ-044 |

## Sessão e isolamento — DEC-04

Sessão terá uma geração local que muda em logout/troca de usuário. Ao trocar: bloquear UI privada, abortar requests, desconectar socket privado, liberar listeners, remover queries privadas e dados de tentativa carregados em memória. Resultado iniciado em geração anterior é descartado mesmo se o cancelamento chegar tarde. Autorização também existe nos handlers, não apenas nos guards.

Em 401, preservar o caminho de retorno interno validado e o contexto não sensível da compra vinculado ao usuário anterior. Não persistir senha ou dados completos do formulário de pagamento. Retomar tentativa privada somente se o mesmo usuário autenticar; outro usuário recebe seus próprios recursos. Após login, revalidar cotação. Retorno externo em parâmetro de URL não é permitido.

Verificadores de senha locais são apenas uma simulação; não representam segurança de backend real. Credenciais seed publicadas no README são fictícias; o banco armazena salt/verificador, não os textos dessas senhas.

## Cache e retries — DEC-02, DEC-12, DEC-13

| Recurso | Query key conceitual | Frescor inicial / sincronização |
| --- | --- | --- |
| Catálogo | `['nfts', parâmetrosNormalizados]` | 30 s; abortar ao trocar parâmetros; evento invalida listagens afetadas |
| Detalhe | `['nft', id]` | 30 s; comparar versão REST/evento |
| Sessão | `['session', geração]` | Revalidar no bootstrap e foco; tratar 401 em qualquer request |
| Favoritos/perfil/carteiras | `[recurso, userId]` | 30 s; invalidar após mutation |
| Carrinho | `['cart', identidade]` | staleTime 0; revalidar ao abrir, mutar, reconectar e receber NFT atualizado |
| Cotação | `['quote', identidade, cartVersion, rede, cupom]` | Sem reutilização para autorizar compra; API revalida no envio |
| Pedido | `['order', userId, orderId]` | Revalidar ao abrir/reconectar; polling de 2 s somente enquanto pendente, encerrado em terminal |

GET: uma repetição automática apenas para rede/5xx, com pequeno atraso; 4xx sem retry automático. Mutations sem retry automático; compra oferece recuperação com a mesma chave. Propagar AbortSignal para Axios. Mudanças concorrentes da mesma linha de carrinho são serializadas e usam versão esperada; conflito exige reconsulta.

Invalidar não significa mostrar tela vazia: manter conteúdo existente com feedback discreto de atualização. Skeleton é para carregamento sem conteúdo utilizável. Query keys privadas nunca dependem apenas do nome do recurso.

## Compra — DEC-08, DEC-09, DEC-10

```text
Carrinho → cotação revisada → envio com chave persistida → pending
                                                        ├→ confirmed
                                                        └→ declined
```

Timeout de rede não é recusa. A UI fica em recuperação até consultar a tentativa existente. A simulação persiste `resolveAt` e resultado programado; ao consultar após refresh/reconexão, avança pedidos vencidos de forma idempotente, sem depender de um timer perdido ao fechar a página.

Cada linha mantém identidade e lotes de quantidade com IDs. A compra captura os lotes comprados. Na confirmação, o domínio remove somente unidades ainda presentes desses lotes; adições posteriores têm outros IDs e sobrevivem. Remoção seguida de nova inclusão cria novos lotes. A baixa e a marcação de efeito aplicado ocorrem na mesma transação. Eventos e recargas não executam uma segunda baixa.

Uma chave é única por usuário e mapeia para fingerprint do payload e resultado persistido. Resolver uma chave existente precede nova validação de estoque, pois sua própria reserva não pode invalidar um reenvio. Conflitos de cotação que não criam pedido também têm resposta associada à tentativa; nova confirmação usa nova chave.

## Tempo real — DEC-11, DEC-12

Contrato em EVT-01 e EVT-02. Atualizar banco antes de emitir. Ignorar versão menor/igual já aplicada; payload REST atrasado também não substitui estado mais novo. Eventos são notificações, REST é a fonte para reconciliação e autorização. Resposta antiga que precise ser descartada gera reconsulta do recurso ativo.

Listeners pertencem a um único provedor por geração de sessão; cleanup deve funcionar também durante remount em desenvolvimento. `order.updated` é privado e validado por usuário/sessão; catálogo pode ter atualização pública. Reconexão revalida sessão primeiro e só então recursos privados.

Limitação planejada do mock: transporte WebSocket, eventos textuais e namespace padrão; comportamento de polling/upgrade não será uma evidência coberta. Confirmar limitações reais das versões escolhidas em TASK-03 e atualizar esta seção. O desafio permite a integração compatível descrita; não permite substituir socket por callbacks na UI.

## Decisões de UX, desvios e limitações

Decisões propostas: informar ajuste no merge de carrinho; bloquear envio durante tentativa pendente/desconectada; mostrar diferença de cotação antes de nova confirmação; manter erro junto do campo e feedback global acessível. Ações fora do escopo devem ser omitidas quando permitido ou explicar indisponibilidade, sem mensagem de sucesso.

Arquivo Figma ainda não inspecionado diretamente. As 15 screenshots foram analisadas em UI-SPEC: paleta raster, composição e campos visíveis registrados; fonte original, assets separados e semântica de campos ainda pendentes. Não há substituição de asset aprovada/registrada. Ao identificar uma, registrar requisito/UI afetado, motivo, efeito visual/acessível e evidência. Versões, custo real da persistência e compatibilidade do binding ainda dependem da prova técnica.

### Ajustes propostos após análise das screenshots — DEC-14

Login/cadastro usam apresentação modal no desktop e página no mobile, preservando rotas e acesso direto. Checkout mobile deve oferecer dados/revisão além do frame de carteira. Header privado deve refletir sessão apesar do botão Entrar presente na referência. Recibo deve indicar simulação em vez de alegar transação real. IDs/imagens/badges inconsistentes entre PNGs serão substituídos por uma fixture coerente. Essas decisões preservam REQ-014, REQ-020, REQ-021 e REQ-030; ainda não foram implementadas ou verificadas. Detalhes de ENS/indicação e da ação central mobile permanecem decisões pendentes, não funcionalidades inferidas.
