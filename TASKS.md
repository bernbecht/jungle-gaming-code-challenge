# Backlog de execução

Cronograma: [ROTEIRO.md](ROTEIRO.md). Requisitos: [REQUIREMENTS.md](REQUIREMENTS.md). As dependências abaixo representam ordem técnica; não pressupõem trabalho por múltiplos agentes.

Itens sem execução permanecem em **A fazer**. Estados permitidos: A fazer → Em andamento → Em verificação → Concluído; Bloqueado deve incluir motivo. Uma tarefa só é concluída com critérios de aceite e evidências dos testes indicados, sem marcar requisitos atendidos apenas por existir código.

| ID | Dia / bloco do roteiro | Trabalho e critérios de aceite | Dependências | Requisitos | Testes | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-01 | 1 / 1 | Analisar referências; preencher frames, tokens e assets em UI-SPEC; documentar pendências sem inventar medidas | — | REQ-004, REQ-037, REQ-040 | TEST-14 | Em andamento |
| TASK-02 | 1 / 1 | Inicializar Vite/React/TS e stack; providers/router; scripts, lockfile e env; shell com shadcn/Tailwind | — | REQ-001, REQ-025, REQ-050 | TEST-16 | A fazer |
| TASK-03 | 1 / 1 | Provar Axios→MSW e MSW→Socket.IO→cliente no build; smoke Playwright; primeiro deploy com rota interna | TASK-02 | REQ-001, REQ-029, REQ-032, REQ-033, REQ-041, REQ-048 | TEST-16, TEST-18 | A fazer |
| TASK-04 | 1 / 2 | Implementar contratos, dinheiro exato, banco versionado, fixtures, reset e núcleo de cotação/pedidos | TASK-03 | REQ-006, REQ-012, REQ-016, REQ-025, REQ-028, REQ-029, REQ-030 | TEST-16, TEST-17 | A fazer |
| TASK-05 | 1 / 3 | Início/detalhe completos; URL validada, filtros combinados, API parametrizada, cancelamento, galeria e estados | TASK-01, TASK-04 | REQ-002, REQ-003, REQ-005, REQ-006, REQ-007, REQ-026, REQ-027 | TEST-01, TEST-02, TEST-12 | A fazer |
| TASK-06 | 1 / 4 | Cadastro/login/logout/guards, retorno interno, recuperação de sessão, isolamento e favorito otimista com rollback | TASK-04, TASK-05 | REQ-002, REQ-003, REQ-008, REQ-021, REQ-022, REQ-023, REQ-024, REQ-027 | TEST-03, TEST-04 | A fazer |
| TASK-07 | 1 / 4 | Carrinho persistente, merge idempotente de visitante, estoque, cupom e totais retornados pela API | TASK-06 | REQ-002, REQ-003, REQ-009, REQ-010, REQ-011, REQ-012 | TEST-05, TEST-17 | A fazer |
| TASK-08 | 1 / 5 | Checkout com carteiras seed; conexão/rede, revisão, cotação revalidada, pedido idempotente e recibo; refresh recupera tentativa | TASK-07 | REQ-002, REQ-003, REQ-012, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020 | TEST-06, TEST-07, TEST-17 | A fazer |
| TASK-09 | 2 / 7 | Completar perfil/avatar/senha e cadastro/edição de carteiras; persistir alterações e exibir erros da API | TASK-08 | REQ-002, REQ-003, REQ-014, REQ-024 | TEST-08 | A fazer |
| TASK-10 | 2 / 8 | Eventos versionados, limpeza de sessão, cotação inválida, reconexão REST e recuperação de pedido sem repetir efeitos | TASK-08 | REQ-013, REQ-015, REQ-017, REQ-019, REQ-023, REQ-027, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036 | TEST-09, TEST-10 | A fazer |
| TASK-11 | 2 / 8 | Completar controles determinísticos de rede/sessão/falhas; reset por teste; cenários de SCENARIOS reproduzíveis | TASK-09, TASK-10 | REQ-022, REQ-030, REQ-031, REQ-044 | TEST-03, TEST-07, TEST-08, TEST-12, TEST-16 | A fazer |
| TASK-12 | 2 / 9 | Revisar todas as telas em 390/768/1440; Figma, shimmer, reduced motion, teclado, foco, zoom, assets e ações auxiliares | TASK-09, TASK-10 | REQ-004, REQ-026, REQ-037, REQ-038, REQ-039, REQ-040 | TEST-11, TEST-12, TEST-13, TEST-14 | A fazer |
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

Analisadas as 15 screenshots (9 desktop, 6 mobile), dimensões verificadas e paleta raster amostrada. Evidência documental em [UI-SPEC](docs/UI-SPEC.md). Inspeção identificou variantes mobile, formulários além dos contratos v0 e inconsistências nos dados ilustrativos. Restam fonte/assets individuais, semântica de campos e controles ambíguos, adaptação tablet/mobile ausente e comparação com aplicação. TEST-14 não foi executado: ainda não há UI implementada.
