import { queryOptions } from '@tanstack/react-query'
import type { Favorites } from '@/contracts/marketplace'
import { http } from '@/lib/http'

export const favoritesQuery = (userId: string) => queryOptions({
  queryKey: ['favorites', userId],
  queryFn: async ({ signal }) => (await http.get<Favorites>('/me/favorites', { signal })).data,
})

export async function saveFavorite(nftId: string, favorite: boolean) {
  return (await http.put<Favorites>(`/me/favorites/${encodeURIComponent(nftId)}`, { favorite })).data
}
