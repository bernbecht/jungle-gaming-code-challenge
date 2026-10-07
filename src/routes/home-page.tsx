import { Button } from "@/components/ui/button";
import type { CatalogParams, CatalogSort } from "@/contracts/marketplace";
import { catalogQuery } from "@/features/catalog/api";
import {
  CatalogSkeleton,
  NftCard,
  QueryError,
} from "@/features/catalog/components";
import { CatalogFilters } from "@/features/catalog/filters";
import { defaultCatalog } from "@/features/catalog/search";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRef } from "react";

export function HomePage() {
  const params = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const catalog = useQuery(catalogQuery(params));
  const dialog = useRef<HTMLDialogElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const update = (patch: Partial<CatalogParams>) => {
    void navigate({
      search: { ...params, ...patch, page: patch.page ?? 1 },
      hash: "colecoes",
    });
  };
  const clear = () => {
    void navigate({ search: defaultCatalog, hash: "colecoes" });
  };
  const totalPages = catalog.data
    ? Math.max(1, Math.ceil(catalog.data.total / params.pageSize))
    : 1;
  const filterKey = `${params.minPrice ?? ""}:${params.maxPrice ?? ""}`;
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="grid items-center gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-16"
      >
        <div className="max-w-xl">
          <p className="mb-5 text-xs font-medium tracking-widest text-muted-foreground">
            Bem-vindo à Kurio
          </p>
          <h1
            id="hero-title"
            className="text-3xl leading-snug font-semibold tracking-tight uppercase lg:text-5xl lg:leading-snug"
          >
            Seja dono do futuro da arte digital
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
            Descubra novas formas de colecionar. Arte digital, criatividade e
            uma comunidade de possibilidades.
          </p>
          <Button size="lg" className="mt-7" asChild>
            <a href="#colecoes">
              Explorar
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
        <figure className="relative mx-auto w-full max-w-md">
          <img
            src="/assets/placeholders/emerald.svg"
            alt="Composição abstrata em verde e cobre, ilustração temporária da coleção"
            width={640}
            height={640}
            fetchPriority="high"
            className="aspect-square w-full rounded-3xl border border-border bg-card object-cover"
          />
          <figcaption className="absolute right-5 bottom-5 left-5 rounded-xl border border-white/10 bg-background/90 px-5 py-4 text-sm">
            Arte sem fronteiras.
            <span className="mt-1 block text-xs text-muted-foreground">
              Uma nova perspectiva para sua coleção.
            </span>
          </figcaption>
        </figure>
      </section>

      <section
        id="colecoes"
        aria-labelledby="collections-title"
        className="scroll-mt-6 py-8"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <h2
            id="collections-title"
            className="text-lg font-semibold text-primary"
          >
            Explore as coleções
          </h2>
          <ArrowDown aria-hidden="true" size={18} className="text-primary" />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Categorias de lançamento"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                { value: "all", label: "Todos os NFTs" },
                { value: "new", label: "Novos lançamentos" },
                { value: "trending", label: "Em alta" },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.value}
                variant={params.tab === tab.value ? "default" : "ghost"}
                aria-pressed={params.tab === tab.value}
                onClick={() => update({ tab: tab.value })}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="flex max-w-full items-center gap-1 text-xs text-muted-foreground">
            <label htmlFor="catalog-sort" className="shrink-0">
              Ordenar por:
            </label>
            <div className="relative min-w-0">
              <select
                id="catalog-sort"
                className="min-h-11 max-w-full cursor-pointer appearance-none border-0 bg-transparent py-2 pr-5 pl-0 text-inherit focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                value={params.sort}
                onChange={(event) =>
                  update({ sort: event.target.value as CatalogSort })
                }
              >
                <option
                  className="bg-background text-foreground"
                  value="featured"
                >
                  Destaques
                </option>
                <option
                  className="bg-background text-foreground"
                  value="recent"
                >
                  Listados recentemente
                </option>
                <option
                  className="bg-background text-foreground"
                  value="price-asc"
                >
                  Menor preço
                </option>
                <option
                  className="bg-background text-foreground"
                  value="price-desc"
                >
                  Maior preço
                </option>
                <option className="bg-background text-foreground" value="name">
                  Nome
                </option>
              </select>
              <ChevronDown
                aria-hidden="true"
                size={12}
                className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2"
              />
            </div>
          </div>
          <Button
            ref={filterTrigger}
            variant="outline"
            className="lg:hidden"
            onClick={() => dialog.current?.showModal()}
          >
            <SlidersHorizontal aria-hidden="true" />
            Filtros
          </Button>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[230px_1fr]">
          <aside
            aria-label="Filtros do catálogo"
            className="hidden self-start bg-card p-4 lg:block"
          >
            <CatalogFilters
              key={filterKey}
              params={params}
              update={update}
              clear={clear}
            />
          </aside>
          <div className="min-w-0">
            {catalog.isPending ? (
              <CatalogSkeleton count={params.pageSize} />
            ) : catalog.isError ? (
              <QueryError retry={() => void catalog.refetch()} />
            ) : catalog.data.items.length === 0 ? (
              <div className="border border-border p-8 text-center">
                <h3 className="font-semibold">Nenhum NFT encontrado</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Altere os filtros ou volte ao catálogo completo.
                </p>
                <Button className="mt-4" onClick={clear}>
                  Limpar filtros
                </Button>
                {params.page > 1 && (
                  <Button variant="ghost" onClick={() => update({ page: 1 })}>
                    Voltar à primeira página
                  </Button>
                )}
              </div>
            ) : (
              <div
                className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6"
                data-testid="catalog-grid"
              >
                {catalog.data.items.map((nft) => (
                  <NftCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
            {catalog.data && catalog.data.total > 0 && (
              <nav
                aria-label="Paginação"
                className="mt-8 flex flex-wrap items-center justify-center gap-3"
              >
                <Button
                  variant="outline"
                  disabled={params.page <= 1}
                  onClick={() => update({ page: params.page - 1 })}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {params.page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={params.page >= totalPages}
                  onClick={() => update({ page: params.page + 1 })}
                >
                  Próxima
                </Button>
              </nav>
            )}
          </div>
        </div>
        <dialog
          ref={dialog}
          aria-labelledby="filter-title"
          className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(90vw,380px)] max-w-none border-l border-border bg-background p-6 text-foreground backdrop:bg-black/70"
          onClose={() => filterTrigger.current?.focus()}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 id="filter-title">Filtros do catálogo</h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar filtros"
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <CatalogFilters
            key={filterKey}
            params={params}
            update={update}
            clear={clear}
          />
          <Button
            className="mt-6 w-full"
            onClick={() => dialog.current?.close()}
          >
            Ver resultados
          </Button>
        </dialog>
      </section>
      <section
        aria-label="Descubra a Kurio"
        className="mt-12 grid gap-6 md:grid-cols-2"
      >
        <div className="border border-border bg-card p-8">
          <p className="text-xs text-primary">ARTE E CULTURA</p>
          <h2 className="mt-4 text-xl font-semibold">
            Encontre sua próxima coleção
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Conheça as obras que estão em alta na comunidade.
          </p>
          <Button className="mt-5" asChild>
            <Link
              to="/"
              search={{ ...defaultCatalog, tab: "trending" }}
              hash="colecoes"
            >
              Explorar destaques
            </Link>
          </Button>
        </div>
        <div className="border border-border bg-secondary p-8">
          <p className="text-xs text-primary">NOVAS PERSPECTIVAS</p>
          <h2 className="mt-4 text-xl font-semibold">
            Descubra os novos lançamentos
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Explore as obras adicionadas recentemente ao mercado.
          </p>
          <Button variant="outline" className="mt-5" asChild>
            <Link
              to="/"
              search={{ ...defaultCatalog, tab: "new", sort: "recent" }}
              hash="colecoes"
            >
              Ver lançamentos
            </Link>
          </Button>
        </div>
      </section>
      <section aria-labelledby="collecting-title" className="mt-12">
        <h2
          id="collecting-title"
          className="border-b border-border pb-4 text-lg font-semibold text-primary"
        >
          Colecione com confiança
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Explore",
              "Combine busca, coleções e redes para encontrar a arte que combina com você.",
            ],
            [
              "Conheça a obra",
              "Confira imagens, criador, edições e disponibilidade antes de escolher.",
            ],
            [
              "Escolha sua edição",
              "Cada edição tem preço e quantidade próprios. Respeite os limites disponíveis.",
            ],
            [
              "Uma experiência simulada",
              "Este mercado usa dados fictícios. Nenhum pagamento ou transferência real é realizado.",
            ],
          ].map(([title, text], index) => (
            <article key={title} className="border border-border bg-card p-5">
              <span className="text-3xl text-primary">0{index + 1}</span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
