import type { CatalogParams } from "@/contracts/marketplace";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { facetsQuery } from "./api";
import { QueryError } from "./components";
import { PriceFilter } from "./price-filter";

type Props = {
  params: CatalogParams;
  update: (patch: Partial<CatalogParams>) => void;
  clear: () => void;
};

type ChoicesProps = {
  title: string;
  values: string[];
  selected: string[];
  counts: Record<string, number>;
  labels?: Record<string, string>;
  change: (values: string[]) => void;
};

function FilterChoices({
  title,
  values,
  selected,
  counts,
  labels = {},
  change,
}: ChoicesProps) {
  const id = useId();
  return (
    <fieldset>
      <legend className="font-medium text-lg">{title}</legend>
      <div className="mt-2">
        {[...new Set([...values, ...selected])].map((value, index) => {
          const active = selected.includes(value);
          const count = Object.hasOwn(counts, value) ? counts[value]! : 0;
          const label = Object.hasOwn(labels, value) ? labels[value]! : value;
          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={active}
              aria-describedby={`${id}-count-${index}`}
              className={`flex min-h-9 w-full items-center justify-between gap-3 px-2 text-left text-base ${active ? "font-semibold text-accent" : "text-muted-foreground"}`}
              onClick={() =>
                change(
                  active
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
                )
              }
            >
              <span className="min-w-0 break-words">{label}</span>
              <span
                id={`${id}-count-${index}`}
                className="shrink-0 tabular-nums"
              >
                <span aria-hidden="true">({count})</span>
                <span className="sr-only">{count} NFTs no catálogo</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CatalogFilters({ params, update }: Props) {
  const facets = useQuery(facetsQuery);
  if (facets.isPending) return <p role="status">Carregando filtros…</p>;
  if (facets.isError)
    return (
      <QueryError
        retry={() => void facets.refetch()}
        message="Não foi possível carregar os filtros."
      />
    );

  return (
    <div className="space-y-6">
      <FilterChoices
        title="Coleções"
        values={facets.data.category}
        selected={params.category}
        counts={facets.data.counts.category}
        change={(category) => update({ category })}
      />
      <PriceFilter
        key={`${params.minPrice ?? ""}:${params.maxPrice ?? ""}:${facets.data.priceRange.max}`}
        minPrice={params.minPrice}
        maxPrice={params.maxPrice}
        catalogMax={facets.data.priceRange.max}
        apply={update}
      />
      <FilterChoices
        title="Rede"
        values={facets.data.network}
        selected={params.network}
        counts={facets.data.counts.network}
        labels={{ ethereum: "Ethereum", polygon: "Polygon", solana: "Solana" }}
        change={(network) =>
          update({ network: network as CatalogParams["network"] })
        }
      />
    </div>
  );
}
