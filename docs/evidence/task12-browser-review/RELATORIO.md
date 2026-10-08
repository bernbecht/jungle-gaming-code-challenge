# Evidências da revisão no navegador — TASK-12B a 12F

Executado em 08/10/2026 no Chromium com Playwright, sobre Vite dev em http://127.0.0.1:4173. Código, testes e documentação do repositório não foram alterados durante a validação. Evidências preservadas em `docs/evidence/task12-browser-review/` no repositório do projeto para versionamento, conforme solicitação do usuário.

## Decisão sobre as sugestões — 08/10/2026

Por solicitação do usuário, as sugestões deste relatório ficam **adiadas por enquanto, sem prazo de retomada**. Preservar o relatório, as screenshots e as medições para consulta futura. Retomar a implementação dessas sugestões somente após nova solicitação do usuário.

Os achados continuam registrados como pendências; o adiamento não constitui resolução dos problemas ou aceite integral das TASK-12B a TASK-12F. Este relatório retrata a versão observada durante a revisão; alterações posteriores exigem nova validação. A decisão também está registrada em [TASKS.md](../../../TASKS.md).

Revisadas home, detalhe, carrinho, checkout, confirmação, login, cadastro, perfil e carteiras, além de favoritos e modal de autenticação. Larguras: 390, 768 e 1440 px. Casos adicionais: 390 × 450 e reflow 720 × 450. Fontes e imagens aguardadas para as capturas; lazy loading foi antecipado apenas para capturar imagens em páginas completas.

## Pontos encontrados

### 1. Resumo fixo cobre o controle de quantidade

Prioridade: Alta. Task: 12B/12D.

390 × 450: o botão + recebe foco, mas elementFromPoint no seu centro encontra o aside summary-title. A screenshot mostra o item parcialmente encoberto.

[Screenshot](cart-focused-control-covered-390x450.png)

### 2. Skeleton do detalhe altera significativamente a composição

Prioridade: Média. Task: 12C.

768 × 1024: placeholder em x=24/y=120, 344 × 344; imagem carregada em x=144/y=148, 600 × 600. Loading usa duas colunas; conteúdo final empilhado. Não foi medida a métrica CLS.

[Screenshot](detail-loading-768.png)

[Conteúdo carregado para comparação](detail-loaded-768.png)

### 3. Erro de carteira não associado ao campo e sem foco

Prioridade: Média. Task: 12D.

Nas três larguras, wallet-primary-address tem aria-invalid=true após o erro, aria-describedby ausente e foco permanece em Salvar carteira.

[Screenshot](wallet-error-form-390.png)

### 4. Erro de perfil sem foco no primeiro campo inválido

Prioridade: Média. Task: 12D.

Nome de exibição A retorna erro de validação; displayName não recebe foco após submit.

[Screenshot](profile-error-focus-768.png)

### 5. Formulários comprimidos no tablet

Prioridade: Média. Task: 12B.

768 px: sidebar de 280 px e campos em duas colunas. Campo email do perfil tem 186 px de largura útil e 234 px de conteúdo, exigindo rolagem interna; informações auxiliares quebram em muitas linhas. Inputs de endereço permitem rolagem interna, portanto isso não significa perda permanente dos dados.

[Screenshot](profile-768.png)

### 6. Bordas pouco distinguíveis no modal

Prioridade: Média. Task: 12D.

Estilo computado de password: borda rgb(75,43,31), fundo rgb(36,22,18). Contraste calculado pela luminância relativa sRGB: 1,39:1. Screenshot ilustra o problema; cálculo complementa a evidência.

[Screenshot](auth-modal-1440.png)

### 7. Spinner ignora movimento reduzido

Prioridade: Média. Task: 12C.

matchMedia prefers-reduced-motion:reduce retorna true, mas animationName computado do loader é spin. Uma imagem estática não demonstra movimento; ver medição JSON.

[Screenshot](spinner-ignores-reduced-motion-390.png)

### 8. Navegação inferior ausente nas telas principais

Prioridade: Revisão de UX. Task: 12B.

Em 390 px, favoritos/perfil/carrinho ficam sem barra inferior. Isso corresponde à decisão temporária documentada, não a uma regressão; o follow-up de navegação continua pendente.

[Screenshot](favorites-390.png)

### 9. Ler mais parece uma ação sem destino

Prioridade: Revisão de UX. Task: 12E.

Quatro elementos .home-story-more são SPAN com aria-hidden=true, não links/botões. O aviso de conteúdo demonstrativo é sr-only, invisível para usuários que veem o teaser.

[Screenshot](editorial-inactive-read-more-1440.png)

## Verificações que passaram

- Fluxo de login → detalhe → carrinho → revisão → pedido → confirmação nas três larguras.
- Nenhum overflow horizontal da página nos estados capturados.
- Escape fecha o modal de autenticação e devolve o foco ao acionador.

## Limites desta revisão

Esta execução não é o aceite completo de TEST-11/12/13/14. Não executou toda a suíte E2E, leitor de tela, zoom nativo 200%, auditoria completa de contraste, revisão completa contra as referências ou baselines de regressão. Reflow 720 × 450 é somente uma viewport reduzida, não comprova zoom nativo. O Tab do modal incluiu uma passagem fora do DOM do diálogo; isso pode corresponder ao chrome do navegador, então não foi classificado como falha de contenção de foco.

Dados brutos: [targeted-observations.json](targeted-observations.json). Valores clipped nos dados são heurísticos: elementos sr-only e inputs que rolam internamente não são automaticamente defeitos.

## Todas as capturas

- [auth-modal-1440.png](auth-modal-1440.png)
- [cart-1440.png](cart-1440.png)
- [cart-390.png](cart-390.png)
- [cart-768.png](cart-768.png)
- [cart-focused-control-covered-390x450.png](cart-focused-control-covered-390x450.png)
- [cart-short-height-390x450.png](cart-short-height-390x450.png)
- [checkout-1440.png](checkout-1440.png)
- [checkout-390.png](checkout-390.png)
- [checkout-768.png](checkout-768.png)
- [checkout-review-1440.png](checkout-review-1440.png)
- [checkout-review-390.png](checkout-review-390.png)
- [checkout-review-768.png](checkout-review-768.png)
- [detail-1440.png](detail-1440.png)
- [detail-390.png](detail-390.png)
- [detail-768.png](detail-768.png)
- [detail-loaded-768.png](detail-loaded-768.png)
- [detail-loading-768.png](detail-loading-768.png)
- [editorial-inactive-read-more-1440.png](editorial-inactive-read-more-1440.png)
- [favorites-1440.png](favorites-1440.png)
- [favorites-390.png](favorites-390.png)
- [favorites-768.png](favorites-768.png)
- [home-1440.png](home-1440.png)
- [home-390.png](home-390.png)
- [home-768.png](home-768.png)
- [login-1440.png](login-1440.png)
- [login-390.png](login-390.png)
- [login-768.png](login-768.png)
- [order-confirmed-1440.png](order-confirmed-1440.png)
- [order-confirmed-390.png](order-confirmed-390.png)
- [order-confirmed-768.png](order-confirmed-768.png)
- [order-pending-reduced-motion-1440.png](order-pending-reduced-motion-1440.png)
- [order-pending-reduced-motion-390.png](order-pending-reduced-motion-390.png)
- [order-pending-reduced-motion-768.png](order-pending-reduced-motion-768.png)
- [profile-1440.png](profile-1440.png)
- [profile-390.png](profile-390.png)
- [profile-768.png](profile-768.png)
- [profile-error-focus-768.png](profile-error-focus-768.png)
- [profile-reflow-720x450.png](profile-reflow-720x450.png)
- [register-1440.png](register-1440.png)
- [register-390.png](register-390.png)
- [register-768.png](register-768.png)
- [spinner-ignores-reduced-motion-390.png](spinner-ignores-reduced-motion-390.png)
- [wallet-error-1440.png](wallet-error-1440.png)
- [wallet-error-390.png](wallet-error-390.png)
- [wallet-error-768.png](wallet-error-768.png)
- [wallet-error-form-1440.png](wallet-error-form-1440.png)
- [wallet-error-form-390.png](wallet-error-form-390.png)
- [wallet-error-form-768.png](wallet-error-form-768.png)
- [wallets-1440.png](wallets-1440.png)
- [wallets-390.png](wallets-390.png)
- [wallets-768.png](wallets-768.png)
