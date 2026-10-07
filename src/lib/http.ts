import axios from 'axios'
import { env } from '@/lib/env'

// Os serviços de cada recurso usarão esta instância e receberão AbortSignal.
// Sessão/interceptors e contratos de negócio serão adicionados nas TASK-04/06.
export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1 || !axios.isAxiosError(error) || axios.isCancel(error)) {
    return false
  }

  return error.response === undefined || error.response.status >= 500
}
