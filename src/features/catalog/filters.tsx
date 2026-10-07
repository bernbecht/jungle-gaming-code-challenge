import { useQuery } from '@tanstack/react-query'
import type { CatalogParams } from '@/contracts/marketplace'
import { facetsQuery } from './api'
import { Button } from '@/components/ui/button'
import { PriceFilter } from './price-filter'
import { QueryError } from './components'

type Props = {
  params: CatalogParams
  update: (patch: Partial<CatalogParams>) => void
  clear: () => void
}

type ChoicesProps = {
  title: string
  values: string[]
  selected: string[]
  change: (values: string[]) => void
}

function FilterChoices({ title, values, selected, change }: ChoicesProps) {
  return (
    <fieldset>
      <legend className="font-medium">{title}</legend>
      <div className="mt-2 space-y-1">
        {[...new Set([...values, ...selected])].map(value => (
          <label key={value} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.includes(value)}
              onChange={event => change(event.target.checked
                ? [...selected, value]
                : selected.filter(item => item !== value))}
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function CatalogFilters({ params, update, clear }: Props) {
  const facets = useQuery(facetsQuery)
  const hasFilters = params.q || params.category.length || params.collection.length
    || params.creator.length || params.network.length || params.minPrice !== undefined
    || params.maxPrice !== undefined || params.availableOnly

  if (facets.isPending) return <p role="status">Carregando filtros…</p>
  if (facets.isError) return <QueryError retry={() => void facets.refetch()} message="Não foi possível carregar os filtros." />

  return (
    <div className="space-y-6">
      <FilterChoices
        title="Coleções"
        values={facets.data.category}
        selected={params.category}
        change={category => update({ category })}
      />
      <PriceFilter
        key={`${params.minPrice ?? ''}:${params.maxPrice ?? ''}:${facets.data.priceRange.max}`}
        minPrice={params.minPrice}
        maxPrice={params.maxPrice}
        catalogMax={facets.data.priceRange.max}
        apply={update}
      />
      <FilterChoices
        title="Rede"
        values={facets.data.network}
        selected={params.network}
        change={network => update({ network: network as CatalogParams['network'] })}
      />
      {Boolean(hasFilters) && <Button variant="ghost" onClick={clear}>Limpar filtros</Button>}
    </div>
  )
}
