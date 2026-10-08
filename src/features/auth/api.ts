import { queryOptions } from '@tanstack/react-query'
import axios from 'axios'
import type { AuthResponse, LoginInput, Profile, RegisterInput } from '@/contracts/marketplace'
import { http } from '@/lib/http'

const TOKEN_KEY = 'kurio-session-token'
export const sessionQuery = queryOptions({
  queryKey: ['session'],
  staleTime: 0,
  queryFn: async ({ signal }): Promise<Profile | null> => {
    const token = getSessionToken()
    if (!token) return null
    try { return (await http.get<{ user: Profile }>('/auth/session', { signal })).data.user }
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearSessionToken()
        return null
      }
      throw error
    }
  },
})

export function getSessionToken() { return sessionStorage.getItem(TOKEN_KEY) }
export function clearSessionToken() { sessionStorage.removeItem(TOKEN_KEY) }
export async function signIn(input: LoginInput) {
  const response = (await http.post<AuthResponse>('/auth/login', input)).data
  sessionStorage.setItem(TOKEN_KEY, response.token)
  return response.session.user
}
export async function signUp(input: RegisterInput) {
  const response = (await http.post<AuthResponse>('/auth/register', input)).data
  sessionStorage.setItem(TOKEN_KEY, response.token)
  return response.session.user
}
export async function signOut() {
  try { await http.post('/auth/logout') } finally { clearSessionToken() }
}
