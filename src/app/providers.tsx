import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { env } from '@/lib/env'
import { AuthDialogProvider } from '@/features/auth/auth-dialog-context'
import { getSessionToken, sessionQuery } from '@/features/auth/api'
import { nftQuery } from '@/features/catalog/api'
import type { Nft, Order, Page } from '@/contracts/marketplace'
import { clearPrivateQueriesForUser, isNftUpdatedEvent, isOrderUpdatedEvent, shouldApplyNftEvent, shouldApplyOrderEvent } from '@/features/realtime/domain-event-consumer'
import { reconnectGenerationQueryKey } from '@/features/realtime/reconciliation'

let mockWorkerStart: Promise<void> | undefined

function startMockWorker() {
  mockWorkerStart ??= import('@/mocks/browser').then(({ initializeMocks }) => initializeMocks())
  return mockWorkerStart
}

function DomainEventConsumer({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery)
  const queryClient = useQueryClient()
  const userId = session.data?.id ?? ''
  const hasSocketConnected = useRef(false)

  useEffect(() => {
    if (!env.mocksEnabled || session.isPending) return

    let active = true
    const seenEventIds = new Set<string>()
    let socket: import('socket.io-client').Socket | undefined
    let authenticatedSessionId: string | null = null
    let reconnectCycle = 0
    let pendingReconnectCycle: number | null = null
    const reconcileAfterReconnect = async (cycle: number, includePrivate: boolean) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: ['nfts', 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['nfts', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['nfts', 'facets'] }),
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
      ]
      if (includePrivate) invalidations.push(queryClient.invalidateQueries({ queryKey: ['orders'] }))
      await Promise.all(invalidations)
      if (!active || cycle !== reconnectCycle) return
      const generation = queryClient.getQueryData<number>(reconnectGenerationQueryKey) ?? 0
      queryClient.setQueryData(reconnectGenerationQueryKey, generation + 1)
    }
    const handleOnline = () => {
      if (!hasSocketConnected.current) return
      const cycle = ++reconnectCycle
      pendingReconnectCycle = null
      void reconcileAfterReconnect(cycle, Boolean(userId && getSessionToken()))
    }
    window.addEventListener('online', handleOnline)
    const remember = (eventId: string) => {
      if (seenEventIds.has(eventId)) return false
      seenEventIds.add(eventId)
      if (seenEventIds.size > 500) seenEventIds.delete(seenEventIds.values().next().value!)
      return true
    }

    void import('socket.io-client').then(({ io }) => {
      if (!active) return
      socket = io(window.location.origin, { path: '/socket.io/', transports: ['websocket'] })
      socket.on('connect', () => {
        if (!active) return
        // Keep this across effect restarts (for example, when sign-in changes
        // userId) so a replacement socket still reconciles missed REST state.
        const isReconnect = hasSocketConnected.current
        hasSocketConnected.current = true
        authenticatedSessionId = null
        const token = userId ? getSessionToken() : null
        if (isReconnect) {
          const cycle = ++reconnectCycle
          pendingReconnectCycle = token ? cycle : null
          if (!token) void reconcileAfterReconnect(cycle, false)
        }
        if (token) socket?.emit('session.authenticate', { token })
      })
      socket.on('session.authenticated', (payload: unknown) => {
        if (!active) return
        if (payload && typeof payload === 'object' && 'sessionId' in payload && typeof payload.sessionId === 'string')
          authenticatedSessionId = payload.sessionId
        if (pendingReconnectCycle !== null) {
          const cycle = pendingReconnectCycle
          pendingReconnectCycle = null
          void reconcileAfterReconnect(cycle, true)
        }
      })
      socket.on('session.authenticationFailed', () => {
        if (!active) return
        authenticatedSessionId = null
        void queryClient.invalidateQueries({ queryKey: ['session'] })
        if (pendingReconnectCycle !== null) {
          const cycle = pendingReconnectCycle
          pendingReconnectCycle = null
          void reconcileAfterReconnect(cycle, false)
        }
      })
      socket.on('nft.updated', (payload: unknown) => {
        if (!active) return
        if (!isNftUpdatedEvent(payload) || !remember(payload.eventId)) return
        const detail = queryClient.getQueryData<Nft>(nftQuery(payload.resourceId).queryKey)
        const cachedLists = queryClient.getQueriesData<Page<Nft>>({ queryKey: ['nfts', 'list'] })
        const latestVersion = Math.max(
          detail?.version ?? 0,
          ...cachedLists.flatMap(([, page]) => page?.items.filter(item => item.id === payload.resourceId).map(item => item.version) ?? []),
        )
        if (!shouldApplyNftEvent(payload, latestVersion)) return
        queryClient.setQueryData(nftQuery(payload.resourceId).queryKey, payload.data.nft)
        void queryClient.invalidateQueries({ queryKey: ['nfts', 'list'] })
        void queryClient.invalidateQueries({ queryKey: ['nfts', 'facets'] })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        queryClient.setQueryData(['domain-events', 'nft', payload.resourceId], payload)
      })
      socket.on('order.updated', (payload: unknown) => {
        if (!active) return
        if (!isOrderUpdatedEvent(payload) || !remember(payload.eventId)) return
        if (!userId || !authenticatedSessionId || !shouldApplyOrderEvent(payload, queryClient.getQueryData<Order>(['orders', payload.resourceId]), userId, authenticatedSessionId)) return
        queryClient.setQueryData(['orders', payload.resourceId], payload.data.order)
        queryClient.setQueryData(['domain-events', 'order', payload.resourceId], payload)
        if (payload.data.order.status === 'confirmed')
          void queryClient.invalidateQueries({ queryKey: ['cart', `user:${userId}`] })
      })
    }).catch(() => undefined)

    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      socket?.disconnect()
      clearPrivateQueriesForUser(queryClient, userId)
    }
  }, [queryClient, session.isPending, userId])

  // Resolve session restoration before route guards share this query. In
  // Strict Mode the initial observer can detach and cancel an in-flight read.
  if (session.isPending) return <main role="status" className="grid min-h-screen place-items-center text-sm text-muted-foreground">Recuperando sessão…</main>
  return children
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
  return <DomainEventConsumer>{children}</DomainEventConsumer>
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <MockBootstrap>
        <AuthDialogProvider>
          <RouterProvider router={router} />
        </AuthDialogProvider>
      </MockBootstrap>
    </QueryClientProvider>
  )
}
