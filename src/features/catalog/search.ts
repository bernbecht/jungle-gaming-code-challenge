import type { CatalogParams, CatalogSort, Network } from '../../contracts/marketplace'
import { toWei } from '../../lib/money'

export const defaultCatalog: CatalogParams = { q: '', category: [], collection: [], creator: [], network: [], availableOnly: false, tab: 'all', sort: 'featured', page: 1, pageSize: 12 }
export function validateCatalogSearch(raw: Record<string, unknown>): CatalogParams {
  const strings = (key: string) => [...new Set((Array.isArray(raw[key]) ? raw[key] : typeof raw[key] === 'string' ? [raw[key]] : []).filter((v): v is string => typeof v === 'string' && Boolean(v.trim())).map(v => v.trim()))].sort()
  const integer = (key: string, fallback: number, maximum: number) => {
    const value = Number(raw[key]); return Number.isSafeInteger(value) && value > 0 && value <= maximum ? value : fallback
  }
  const price = (key: string) => { try { if (typeof raw[key] === 'string') { toWei(raw[key]); return raw[key] } } catch { /* Ignore malformed URL values. */ } return undefined }
  let minPrice = price('minPrice'), maxPrice = price('maxPrice')
  if (minPrice && maxPrice && toWei(minPrice) > toWei(maxPrice)) { minPrice = undefined; maxPrice = undefined }
  const sorts: CatalogSort[] = ['featured', 'recent', 'price-asc', 'price-desc', 'name']
  return { q: typeof raw.q === 'string' ? raw.q.trim() : '', category: strings('category'), collection: strings('collection'), creator: strings('creator'), network: strings('network').filter((v): v is Network => ['ethereum', 'polygon', 'solana'].includes(v)), minPrice, maxPrice, availableOnly: raw.availableOnly === true || raw.availableOnly === 'true', tab: raw.tab === 'new' || raw.tab === 'trending' ? raw.tab : 'all', sort: sorts.includes(raw.sort as CatalogSort) ? raw.sort as CatalogSort : 'featured', page: integer('page', 1, Number.MAX_SAFE_INTEGER), pageSize: integer('pageSize', 12, 48) }
}
export function catalogSearchParams(params: CatalogParams) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach(item => search.append(key, item))
    else if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return search
}
