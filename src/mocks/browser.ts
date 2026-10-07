import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers'
import { env } from '@/lib/env'
import { transact } from './database'

export const worker = setupWorker(...handlers)

export async function initializeMocks() {
  if (env.mockScenario !== 'SCN-01') throw new Error('Somente SCN-01 está implementado nesta etapa.')
  await transact(() => undefined)
  await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } })
}
