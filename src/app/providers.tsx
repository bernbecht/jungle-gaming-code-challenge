import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { env } from '@/lib/env'

let mockWorkerStart: Promise<void> | undefined

function startMockWorker() {
  mockWorkerStart ??= import('@/mocks/browser').then(({ initializeMocks }) => initializeMocks())
  return mockWorkerStart
}

function MockBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!env.mocksEnabled)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!env.mocksEnabled) return

    let active = true
    void startMockWorker().then(() => {
      if (active) setReady(true)
    }).catch(() => {
      if (active) setError(true)
    })

    return () => { active = false }
  }, [])

  if (error) return <main role="alert" className="grid min-h-screen place-items-center text-sm text-muted-foreground">Não foi possível iniciar a simulação de rede.</main>
  if (!ready) return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Iniciando simulação de rede…</main>
  return children
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <MockBootstrap>
        <RouterProvider router={router} />
      </MockBootstrap>
    </QueryClientProvider>
  )
}
