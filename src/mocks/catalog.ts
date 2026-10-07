import type { CatalogFacets, CatalogParams, CatalogSort, Network, Nft, Page } from '../contracts/marketplace'
import { fromWei, toWei } from '../lib/money'
import { invalid, MockError } from './errors'
import type { DatabaseState } from './state'

export function readNft(state: DatabaseState, id: string): Nft {
  const original = state.nfts.find(nft => nft.id === id)
  if (!original) throw new MockError(404, 'NOT_FOUND', 'NFT não encontrado.')
  const nft = structuredClone(original)
  for (const edition of nft.editions) {
    const reserved = Object.values(state.reservations).flat().filter(item => item.nftId === id && item.editionId === edition.id).reduce((total, item) => total + item.quantity, 0)
    edition.available -= reserved
  }
  return nft
}

export function referencePrice(nft: Nft): bigint {
  const available = nft.editions.filter(edition => edition.available > 0)
  return (available.length ? available : nft.editions).reduce<bigint | undefined>((lowest, edition) => {
    const price = toWei(edition.unitPrice)
    return lowest === undefined || price < lowest ? price : lowest
  }, undefined) ?? 0n
}

export function parseCatalogParams(search: URLSearchParams): CatalogParams {
  const single = (key: string) => {
    if (search.getAll(key).length > 1) invalid(`Parâmetro ${key} repetido.`)
    return search.get(key) ?? undefined
  }
  const integer = (key: string, fallback: number, maximum: number) => {
    const raw = single(key)
    if (raw === undefined) return fallback
    const value = Number(raw)
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > maximum) invalid(`Parâmetro ${key} inválido.`)
    return value
  }
  const minPrice = single('minPrice')
  const maxPrice = single('maxPrice')
  try {
    if (minPrice !== undefined) toWei(minPrice)
    if (maxPrice !== undefined) toWei(maxPrice)
    if (minPrice !== undefined && maxPrice !== undefined && toWei(minPrice) > toWei(maxPrice)) invalid('Faixa de preço inválida.')
  } catch { invalid('Faixa de preço inválida.') }
  const sort = single('sort') ?? 'featured'
  const sorts: CatalogSort[] = ['featured', 'recent', 'price-asc', 'price-desc', 'name']
  if (!sorts.includes(sort as CatalogSort)) invalid('Ordenação inválida.')
  const tab = single('tab') ?? 'all'
  if (!['all', 'new', 'trending'].includes(tab)) invalid('Aba inválida.')
  const availableOnly = single('availableOnly') ?? 'false'
  if (!['true', 'false'].includes(availableOnly)) invalid('Disponibilidade inválida.')
  const network = [...new Set(search.getAll('network'))]
  if (network.some(value => !['ethereum', 'polygon', 'solana'].includes(value))) invalid('Rede inválida.')
  const list = (key: string) => [...new Set(search.getAll(key).map(value => value.trim()))].filter(Boolean)
  return {
    q: (single('q') ?? '').trim(), category: list('category'), collection: list('collection'), creator: list('creator'),
    network: network as Network[], minPrice, maxPrice, availableOnly: availableOnly === 'true',
    tab: tab as CatalogParams['tab'], sort: sort as CatalogSort, page: integer('page', 1, Number.MAX_SAFE_INTEGER), pageSize: integer('pageSize', 12, 48),
  }
}

export function listNfts(state: DatabaseState, params: CatalogParams): Page<Nft> {
  const matches = (values: string[], value: string) => !values.length || values.includes(value)
  const query = params.q.toLocaleLowerCase('pt-BR')
  const items = state.nfts.map(nft => readNft(state, nft.id)).filter(nft => {
    const price = referencePrice(nft)
    return (!query || `${nft.name} ${nft.creator} ${nft.collection}`.toLocaleLowerCase('pt-BR').includes(query))
      && matches(params.category, nft.category) && matches(params.collection, nft.collection)
      && matches(params.creator, nft.creator) && matches(params.network, nft.network)
      && (params.minPrice === undefined || price >= toWei(params.minPrice))
      && (params.maxPrice === undefined || price <= toWei(params.maxPrice))
      && (!params.availableOnly || nft.editions.some(edition => edition.available > 0))
      && (params.tab !== 'trending' || nft.trending)
      && (params.tab !== 'new' || Date.parse(nft.createdAt) >= state.now - 7 * 86_400_000)
  })
  items.sort((a, b) => {
    let compared = 0
    if (params.sort === 'price-asc' || params.sort === 'price-desc') {
      const left = referencePrice(a), right = referencePrice(b)
      compared = left === right ? 0 : left < right ? -1 : 1
      if (params.sort === 'price-desc') compared *= -1
    } else if (params.sort === 'name') compared = a.name.localeCompare(b.name, 'pt-BR')
    else if (params.sort === 'recent') compared = Date.parse(b.createdAt) - Date.parse(a.createdAt)
    else compared = Number(b.featured) - Number(a.featured)
    return compared || a.id.localeCompare(b.id)
  })
  const start = (params.page - 1) * params.pageSize
  return { items: items.slice(start, start + params.pageSize), total: items.length, page: params.page, pageSize: params.pageSize }
}

export function catalogFacets(state: DatabaseState): CatalogFacets {
  const values = (key: 'category' | 'collection' | 'creator' | 'network') =>
    [...new Set(state.nfts.map(nft => nft[key]))].sort()
  const counts = (key: 'category' | 'network') => Object.fromEntries(
    values(key).map(value => [value, state.nfts.filter(nft => nft[key] === value).length]),
  )
  const prices = state.nfts.flatMap(nft => nft.editions.map(edition => toWei(edition.unitPrice)))
  const maximum = prices.reduce((highest, price) => price > highest ? price : highest, 0n)
  return {
    category: values('category'), collection: values('collection'),
    creator: values('creator'), network: values('network'),
    counts: { category: counts('category'), network: counts('network') },
    priceRange: { min: '0', max: fromWei(maximum) },
  }
}
