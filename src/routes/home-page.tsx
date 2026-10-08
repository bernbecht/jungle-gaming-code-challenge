import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import type { CatalogParams, CatalogSort } from "@/contracts/marketplace";
import { catalogQuery } from "@/features/catalog/api";
import {
  CatalogSkeleton,
  NftCard,
  QueryError,
} from "@/features/catalog/components";
import { CatalogFilters } from "@/features/catalog/filters";
import { HeaderSearch } from "@/features/catalog/header-search";
import { defaultCatalog } from "@/features/catalog/search";
import { HomeEditorial } from "@/features/home/home-editorial";
import { NftSpotlight } from "@/features/home/nft-spotlight";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
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
  const sortLabels: Record<CatalogSort, string> = {
    featured: "Destaques",
    recent: "Listados recentemente",
    "price-asc": "Menor preço",
    "price-desc": "Maior preço",
    name: "Nome",
  };
  return (
    <>
      <div className="flex items-center gap-2 pt-5 lg:hidden">
        <HeaderSearch variant="field" />
        <Button
          ref={filterTrigger}
          variant="default"
          size="icon"
          aria-label="Abrir filtros do catálogo"
          onClick={() => dialog.current?.showModal()}
          className="shrink-0 rounded-xl"
        >
          <SlidersHorizontal aria-hidden="true" />
        </Button>
      </div>
      <section
        aria-labelledby="mobile-hero-title"
        className="relative mt-4 flex min-h-[190px] items-center overflow-hidden rounded-[28px] bg-card p-4 md:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 38% 50%, #55331f 0, #382319 48%, #241612 100%)",
        }}
      >
        <div className="relative z-10 w-[58%]">
          <p className="mb-2 text-xs text-foreground">Bem-vindo à Kurio</p>
          <h1
            id="mobile-hero-title"
            className="text-lg leading-snug font-semibold uppercase"
          >
            Seja dono da cultura digital
          </h1>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a
            href="#colecoes"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Explorar
          </a>
        </div>
        <img
          src="/assets/placeholders/emerald.svg"
          alt="Arte digital temporária em tons de verde"
          width={160}
          height={160}
          className="absolute top-3 right-3 aspect-square w-[39%] rounded-2xl object-cover"
        />
        <img
          src="/assets/placeholders/ivory.svg"
          alt="Arte digital temporária complementar"
          width={96}
          height={96}
          className="absolute right-[28%] bottom-3 aspect-square w-[23%] rounded-xl border-2 border-card object-cover"
        />
      </section>
      <section
        aria-labelledby="hero-title"
        className="hidden items-center gap-10 py-10 justify-between md:flex md:gap-16 md:py-16"
      >
        <div className="max-w-xl">
          <p className="mb-5 font-medium tracking-widest ">Bem-vindo à Kurio</p>
          <h1
            id="hero-title"
            className="text-3xl leading-snug font-semibold tracking-tight uppercase lg:text-5xl lg:leading-snug"
          >
            Seja dono do futuro da arte digital
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>
          <Button className="mt-7" asChild>
            <a href="#colecoes" className="uppercase">
              Explorar
            </a>
          </Button>
        </div>
        <figure className="relative w-full max-w-md">
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
        className="md:scroll-mt-6 md:py-8"
      >
        <div className="mt-6 grid gap-12 lg:grid-cols-[310px_1fr]">
          <aside
            aria-label="Filtros do catálogo"
            className="hidden self-start bg-card p-5 lg:block"
          >
            <CatalogFilters
              key={filterKey}
              params={params}
              update={update}
              clear={clear}
            />
            <NftSpotlight />
          </aside>
          <div className="min-w-0">
            <div className="flex w-full flex-wrap items-center justify-between gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] mb-9">
              <div
                role="group"
                aria-label="Categorias de lançamento"
                className="flex flex-nowrap gap-3 overflow-x-auto lg:col-start-1"
              >
                {(
                  [
                    { value: "all", label: "Todos os NFTs" },
                    { value: "new", label: "Novos lançamentos" },
                    { value: "trending", label: "Em alta" },
                  ] as const
                ).map((tab) => (
                  <Link
                    key={tab.value}
                    to="/"
                    search={{ ...params, tab: tab.value, page: 1 }}
                    hash="colecoes"
                    aria-current={params.tab === tab.value ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-1 text-xs transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-base ${params.tab === tab.value ? "border-primary font-semibold text-primary" : "border-transparent text-foreground hover:text-primary"}`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
              <div className="hidden max-w-full items-center gap-1 justify-end lg:col-start-2 lg:justify-self-end lg:flex">
                <label htmlFor="catalog-sort" className="shrink-0">
                  Ordenar por:
                </label>
                <div className="relative min-w-0">
                  <select
                    id="catalog-sort"
                    className="max-w-full cursor-pointer appearance-none border-0 bg-transparent px-0 py-2 text-right text-inherit focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    style={{ width: `${sortLabels[params.sort].length}ch` }}
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
                    <option
                      className="bg-background text-foreground"
                      value="name"
                    >
                      Nome
                    </option>
                  </select>
                </div>
              </div>
            </div>
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
                className="mobile-nft-grid grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 md:gap-y-20"
                data-testid="catalog-grid"
              >
                {catalog.data.items.map((nft) => (
                  <NftCard key={nft.id} nft={nft} mobileHome />
                ))}
              </div>
            )}
            {catalog.data && catalog.data.total > 0 && (
              <Pagination
                page={params.page}
                totalPages={totalPages}
                onPageChange={(page) => update({ page })}
              />
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
      <HomeEditorial />
    </>
  );
}
