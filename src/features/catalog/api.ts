import { queryOptions } from '@tanstack/react-query'
import type { CatalogFacets, CatalogParams, Nft, Page } from '@/contracts/marketplace'
import { http } from '@/lib/http'
import { catalogSearchParams } from './search'
export const catalogQuery = (params: CatalogParams) => queryOptions({ queryKey: ['nfts', 'list', params], queryFn: async ({ signal }) => (await http.get<Page<Nft>>('/nfts', { params: catalogSearchParams(params), signal })).data })
export const nftQuery = (id: string) => queryOptions({ queryKey: ['nfts', 'detail', id], queryFn: async ({ signal }) => (await http.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data })
export const facetsQuery = queryOptions({ queryKey: ['nfts', 'facets'], queryFn: async ({ signal }) => (await http.get<CatalogFacets>('/nfts/facets', { signal })).data })
