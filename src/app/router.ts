import { createElement } from 'react'
import { createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/app/query-client'
import { AppShell } from '@/components/layout/app-shell'
import { HomePage } from '@/routes/home-page'
import { UnavailablePage } from '@/routes/unavailable-page'
import { NotFoundPage } from '@/routes/not-found-page'
import { ErrorPage } from '@/routes/error-page'
import { IntegrationProofPage } from '@/routes/integration-proof-page'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const integrationProofRoute = createRoute({ getParentRoute: () => rootRoute, path: '/__proof', component: IntegrationProofPage })

// Rotas preparadas, sem dados privados ou operações simuladas.
// Guards reais entram junto da sessão na TASK-06, antes de expor dados privados.
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: () => createElement(UnavailablePage, { title: 'Carrinho de NFTs' }),
})
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => createElement(UnavailablePage, { title: 'Entrar na Kurio' }),
})
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: () => createElement(UnavailablePage, { title: 'Criar perfil de colecionador' }),
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => createElement(UnavailablePage, { title: 'Perfil do colecionador' }),
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  component: () => createElement(UnavailablePage, { title: 'Suas carteiras' }),
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: () => createElement(UnavailablePage, { title: 'Pagamento com carteira' }),
})
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: () => createElement(UnavailablePage, { title: 'Detalhes do NFT' }),
})
const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  component: () => createElement(UnavailablePage, { title: 'Seu pedido' }),
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute, integrationProofRoute, cartRoute, loginRoute, registerRoute, profileRoute,
    walletsRoute, checkoutRoute, nftRoute, orderRoute,
  ]),
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
