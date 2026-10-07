# Fonte e assets da base

Relacionado a DEC-16/DEC-17, TASK-02, REQ-037/REQ-040. Arquivos criados; renderização da aplicação ainda não verificada.

## Tipografia

**IBM Plex Mono** foi escolhida como aproximação visual da tipografia monoespaçada dos PNGs. Não é uma identificação da fonte original. Pesos: 400, 500, 600 e 700; subset latin nos imports de `src/main.tsx`, incluindo os caracteres portugueses usuais.

Origem: pacote `@fontsource/ibm-plex-mono`, com distribuição local pelo bundler. Versão instalada 5.3.0 registrada no lockfile. Arquivos woff/woff2 incluídos no build; licença OFL original preservada em `public/licenses/ibm-plex-mono-OFL.txt` e copiada para dist pelo Vite. Validar métricas/quebras de linha junto dos PNGs em TASK-12.

Referência oficial de instalação: [Fontsource — IBM Plex Mono](https://fontsource.org/fonts/ibm-plex-mono/use).

## Placeholders

| Arquivo | Uso previsto | Dimensão |
| --- | --- | --- |
| `public/assets/placeholders/emerald.svg` | Hero e arte temporária verde | viewBox 640 × 640 |
| `public/assets/placeholders/violet.svg` | Arte temporária lilás | viewBox 640 × 640 |
| `public/assets/placeholders/ivory.svg` | Arte temporária neutra | viewBox 640 × 640 |
| `public/assets/placeholders/golden.svg` | Arte temporária dourada | viewBox 640 × 640 |
| `public/favicon.svg` | Símbolo K provisório | viewBox 64 × 64 |

SVGs geométricos criados para este projeto, sem imagens externas ou recortes do Figma. Usar URLs estáveis nas futuras fixtures. Para `<img>`, fornecer dimensões/alt contextual; imagens decorativas usam alt vazio. Os placeholders não comprovam fidelidade às artes originais e serão reavaliados em TASK-12 antes da entrega.

## Componentes e referências de implementação

Button/Input/Skeleton adaptados manualmente do padrão shadcn/ui; Button usa Radix Slot e class-variance-authority. `components.json` descreve aliases/tema para futuras adições; CLI shadcn não executada nesta sessão.

- [shadcn/ui — configuração Vite](https://ui.shadcn.com/docs/installation/vite)
- [Tailwind — integração Vite](https://tailwindcss.com/docs/installation/using-vite)
- [TanStack Router — rotas em código](https://tanstack.com/router/latest/docs/framework/react/routing/code-based-routing)
- [TanStack Query — QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient)

Ícones via `lucide-react`. Licenças das dependências acompanham os pacotes instalados; registrar/verificar sua redistribuição antes do deploy final.
