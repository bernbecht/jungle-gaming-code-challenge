import { createElement } from 'react'
import { createRootRouteWithContext, createRoute, createRouter, redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/app/query-client'
import { AppShell } from '@/components/layout/app-shell'
import { NftDetailPage } from '@/routes/nft-detail-page'
import { validateCatalogSearch } from '@/features/catalog/search'
import { HomePage } from '@/routes/home-page'
import { ProfilePage } from '@/routes/profile-page'
import { NotFoundPage } from '@/routes/not-found-page'
import { ErrorPage } from '@/routes/error-page'
import { IntegrationProofPage } from '@/routes/integration-proof-page'
import { AuthPage } from '@/routes/auth-page'
import { sessionQuery } from '@/features/auth/api'
import { CartPage } from '@/routes/cart-page'
import { CheckoutPage } from '@/routes/checkout-page'
import { OrderPage } from '@/routes/order-page'
import { WalletsPage } from '@/routes/wallets-page'
import { FavoritesPage } from '@/routes/favorites-page'
import { UnderConstructionPage } from '@/routes/under-construction-page'
import type { Network } from '@/contracts/marketplace'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: validateCatalogSearch, component: HomePage })
const integrationProofRoute = createRoute({ getParentRoute: () => rootRoute, path: '/__proof', component: IntegrationProofPage })
const underConstructionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/em-construcao',
  validateSearch: (search: Record<string, unknown>) => ({ recurso: typeof search.recurso === 'string' && search.recurso.trim() ? search.recurso.trim().slice(0, 160) : 'Página em construção' }),
  component: UnderConstructionPage,
})
const authSearch = (search: Record<string, unknown>) => ({ returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined })
const checkoutSearch = (search: Record<string, unknown>) => ({
  network: search.network === 'ethereum' || search.network === 'polygon' || search.network === 'solana'
    ? search.network as Network
    : undefined,
})
async function requireUser({ context, location }: { context: { queryClient: QueryClient }; location: { href: string } }) {
  const user = await context.queryClient.ensureQueryData(sessionQuery)
  if (user) return
  throw redirect({ to: '/login', search: { returnTo: location.href } })
}

// Recursos que ainda não têm UI funcional permanecem protegidos por sessão.
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
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
  component: ProfilePage,
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireUser,
  component: WalletsPage,
})
const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  beforeLoad: requireUser,
  component: FavoritesPage,
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: checkoutSearch,
  beforeLoad: requireUser,
  component: CheckoutPage,
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
  component: OrderPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute, integrationProofRoute, cartRoute, loginRoute, registerRoute, profileRoute,
    walletsRoute, favoritesRoute, checkoutRoute, nftRoute, orderRoute, underConstructionRoute,
  ]),
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
