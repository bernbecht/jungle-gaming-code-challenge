import { queryOptions } from '@tanstack/react-query'
import type { Profile, UpdateProfileInput } from '@/contracts/marketplace'
import { http } from '@/lib/http'

export const profileQuery = (userId: string) => queryOptions({
  queryKey: ['profile', userId],
  queryFn: async ({ signal }) => (await http.get<Profile>('/profile', { signal })).data,
})

export async function saveProfile(input: UpdateProfileInput) {
  return (await http.patch<Profile>('/profile', input)).data
}
