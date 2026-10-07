import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CatalogParams } from '@/contracts/marketplace'
import { facetsQuery } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toWei } from '@/lib/money'
import { QueryError } from './components'

type Props = { params: CatalogParams; update: (patch: Partial<CatalogParams>) => void; clear: () => void }
export function CatalogFilters({ params, update, clear }: Props) {
  const facets = useQuery(facetsQuery)
  const [min, setMin] = useState(params.minPrice ?? '')
  const [max, setMax] = useState(params.maxPrice ?? '')
  const [error, setError] = useState('')
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Filtros</h3><Button variant="ghost" onClick={clear}>Limpar</Button></div>
    {facets.isPending ? <p role="status">Carregando filtros…</p> : facets.isError ? <QueryError retry={() => void facets.refetch()} message="Não foi possível carregar os filtros." /> : (['category', 'collection', 'creator', 'network'] as const).map(key => <fieldset key={key} className="border-t border-border pt-4"><legend className="pr-3 font-medium">{{ category: 'Categorias', collection: 'Coleções', creator: 'Criadores', network: 'Rede' }[key]}</legend><div className="mt-2 space-y-1">{[...new Set([...facets.data[key], ...params[key]])].map(value => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={(params[key] as string[]).includes(value)} onChange={e => update({ [key]: e.target.checked ? [...params[key], value] : params[key].filter(item => item !== value) })} />{value}</label>)}</div></fieldset>)}
    <form onSubmit={e => { e.preventDefault(); try { if (min) toWei(min); if (max) toWei(max); if (min && max && toWei(min) > toWei(max)) throw new Error(); setError(''); update({ minPrice: min || undefined, maxPrice: max || undefined }) } catch { setError('Informe valores ETH válidos; o mínimo deve ser menor ou igual ao máximo.') } }} className="space-y-3 border-t border-border pt-4">
      <h4>Faixa de preço (ETH)</h4><label className="block text-sm">Mínimo<Input inputMode="decimal" value={min} onChange={e => setMin(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'price-error' : undefined} /></label><label className="block text-sm">Máximo<Input inputMode="decimal" value={max} onChange={e => setMax(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'price-error' : undefined} /></label>{error && <p id="price-error" role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" variant="outline" className="w-full">Aplicar preço</Button>
    </form>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={params.availableOnly} onChange={e => update({ availableOnly: e.target.checked })} />Somente disponíveis</label>
  </div>
}
