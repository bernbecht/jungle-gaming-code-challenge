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

export async function uploadAvatar(file: File, expectedVersion: number) {
  const form = new FormData()
  form.append('file', file)
  form.append('expectedVersion', String(expectedVersion))
  return (await http.put<Profile>('/profile/avatar', form)).data
}

export async function removeAvatar(expectedVersion: number) {
  return (await http.delete<Profile>('/profile/avatar', { headers: { 'If-Match': String(expectedVersion) } })).data
}
