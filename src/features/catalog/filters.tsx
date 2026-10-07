import { useQuery } from '@tanstack/react-query'
import type { CatalogParams } from '@/contracts/marketplace'
import { facetsQuery } from './api'
import { Button } from '@/components/ui/button'
import { PriceFilter } from './price-filter'
import { QueryError } from './components'

type Props = { params: CatalogParams; update: (patch: Partial<CatalogParams>) => void; clear: () => void }
export function CatalogFilters({ params, update, clear }: Props) {
  const facets = useQuery(facetsQuery)
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Filtros</h3><Button variant="ghost" onClick={clear}>Limpar</Button></div>
    {facets.isPending ? <p role="status">Carregando filtros…</p> : facets.isError ? <QueryError retry={() => void facets.refetch()} message="Não foi possível carregar os filtros." /> : (['category', 'collection', 'creator', 'network'] as const).map(key => <fieldset key={key} className="border-t border-border pt-4"><legend className="pr-3 font-medium">{{ category: 'Categorias', collection: 'Coleções', creator: 'Criadores', network: 'Rede' }[key]}</legend><div className="mt-2 space-y-1">{[...new Set([...facets.data[key], ...params[key]])].map(value => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={(params[key] as string[]).includes(value)} onChange={e => update({ [key]: e.target.checked ? [...params[key], value] : params[key].filter(item => item !== value) })} />{value}</label>)}</div></fieldset>)}
    {facets.data && <PriceFilter
      key={`${params.minPrice ?? ''}:${params.maxPrice ?? ''}:${facets.data.priceRange.max}`}
      minPrice={params.minPrice}
      maxPrice={params.maxPrice}
      catalogMax={facets.data.priceRange.max}
      apply={update}
    />}
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={params.availableOnly} onChange={e => update({ availableOnly: e.target.checked })} />Somente disponíveis</label>
  </div>
}
