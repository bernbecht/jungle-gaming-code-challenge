import { createElement } from 'react'
import { createRootRouteWithContext, createRoute, createRouter, redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/app/query-client'
import { AppShell } from '@/components/layout/app-shell'
import { NftDetailPage } from '@/routes/nft-detail-page'
import { validateCatalogSearch } from '@/features/catalog/search'
import { HomePage } from '@/routes/home-page'
import { UnavailablePage } from '@/routes/unavailable-page'
import { NotFoundPage } from '@/routes/not-found-page'
import { ErrorPage } from '@/routes/error-page'
import { IntegrationProofPage } from '@/routes/integration-proof-page'
import { AuthPage } from '@/routes/auth-page'
import { sessionQuery } from '@/features/auth/api'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: validateCatalogSearch, component: HomePage })
const integrationProofRoute = createRoute({ getParentRoute: () => rootRoute, path: '/__proof', component: IntegrationProofPage })
const authSearch = (search: Record<string, unknown>) => ({ returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined })
async function requireUser({ context, location }: { context: { queryClient: QueryClient }; location: { href: string } }) {
  const user = await context.queryClient.ensureQueryData(sessionQuery)
  if (user) return
  throw redirect({ to: '/login', search: { returnTo: location.href } })
}

// Recursos que ainda não têm UI funcional permanecem protegidos por sessão.
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: () => createElement(UnavailablePage, { title: 'Carrinho de NFTs' }),
})
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: authSearch,
  component: () => createElement(AuthPage, { mode: 'login' }),
})
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: authSearch,
  component: () => createElement(AuthPage, { mode: 'register' }),
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireUser,
  component: () => createElement(UnavailablePage, { title: 'Perfil do colecionador' }),
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireUser,
  component: () => createElement(UnavailablePage, { title: 'Suas carteiras' }),
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireUser,
  component: () => createElement(UnavailablePage, { title: 'Pagamento com carteira' }),
})
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailPage,
})
const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  beforeLoad: requireUser,
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
