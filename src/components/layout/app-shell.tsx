import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeaderSearch } from "@/features/catalog/header-search";
import { defaultCatalog } from "@/features/catalog/search";
import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionQuery, signOut } from "@/features/auth/api";
import { useAuthDialog } from "@/features/auth/use-auth-dialog";
import { AuthDialog } from "@/features/auth/auth-dialog";
import { cartQuery, getGuestId } from "@/features/cart/api";
import {
  Heart,
  Home,
  LogIn,
  ScanLine,
  ShoppingCart,
  UserRound,
} from "lucide-react";

export function AppShell() {
  const session = useQuery(sessionQuery);
  const cartIdentity = session.data ? `user:${session.data.id}` : `guest:${getGuestId()}`;
  const cart = useQuery({ ...cartQuery(cartIdentity), enabled: !session.isPending });
  const queryClient = useQueryClient();
  const router = useRouter();
  const authDialog = useAuthDialog();
  const logoutMutation = useMutation({
    mutationFn: signOut,
    onMutate: async () => { await queryClient.cancelQueries(); },
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(['session'], null);
      void router.navigate({ to: '/', search: defaultCatalog });
    },
  });
  const { pathname, hash } = useLocation();
  const isHome = pathname === "/";
  const isNftDetail = pathname.startsWith("/nfts/");
  const isCart = pathname === "/cart";
  const isMarketActive = isNftDetail || pathname === "/cart" || pathname === "/checkout" || (isHome && hash === "colecoes");
  const isHomeActive = isHome && !isMarketActive;
  return (
    <div className="min-h-dvh">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header
        className={`page-container flex min-h-20 items-center justify-between gap-4 ${isHome || isNftDetail || isCart ? "hidden md:flex" : ""}`}
      >
        <Link
          to="/"
          search={defaultCatalog}
          aria-label="Kurio — início"
          className="text-lg font-bold tracking-[0.14em]"
        >
          KURIO
        </Link>
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-8 md:flex"
        >
          <Link
            to="/"
            search={defaultCatalog}
            aria-current={isHomeActive ? "page" : undefined}
            className={`flex h-20 items-center border-b-2 px-0 pb-3 pt-3 transition-colors ${isHomeActive ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary"}`}
          >
            Início
          </Link>
          <Link
            to="/"
            search={defaultCatalog}
            hash="colecoes"
            aria-current={isMarketActive ? "page" : undefined}
            className={`flex h-20 items-center border-b-2 px-0 pb-3 pt-3 transition-colors ${isMarketActive ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary"}`}
          >
            Mercado
          </Link>
          <Link
            to="/"
            search={defaultCatalog}
            hash="colecoes"
            className="flex h-20 items-center border-b-2 border-transparent px-0 pb-3 pt-3 text-foreground transition-colors hover:text-primary"
          >
            Criadores
          </Link>
          <Link
            to="/"
            search={defaultCatalog}
            hash="collecting-title"
            className="flex h-20 items-center border-b-2 border-transparent px-0 pb-3 pt-3 text-foreground transition-colors hover:text-primary"
          >
            Aprenda
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <HeaderSearch />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" aria-label="Carrinho de NFTs">
              <span className="relative inline-flex">
                <ShoppingCart aria-hidden="true" />
                {!!cart.data?.items.length && <span aria-hidden="true" className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{cart.data.items.reduce((total, item) => total + item.quantity, 0)}</span>}
              </span>
            </Link>
          </Button>
          {session.data ? <>
            <Button variant="ghost" size="sm" asChild><Link to="/profile">{session.data.displayName}</Link></Button>
            <Button size="sm" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>{logoutMutation.isPending ? 'Saindo…' : 'Sair'}</Button>
          </> : <Button size="sm" asChild>
            <Link
              to="/login"
              search={{ returnTo: undefined }}
              onClick={event => {
                if (window.matchMedia("(min-width: 768px)").matches) {
                  event.preventDefault();
                  authDialog.open("login", router.state.location.href, event.currentTarget);
                }
              }}
            ><LogIn aria-hidden="true" />Entrar</Link>
          </Button>}
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="page-container outline-none">
        <Outlet />
      </main>

      <SiteFooter isHome={isHome} hideOnMobile={isCart} />

      {authDialog.request && (
        <AuthDialog
          mode={authDialog.request.mode}
          returnTo={authDialog.request.returnTo}
          onClose={authDialog.close}
          onSwitchMode={authDialog.switchMode}
        />
      )}

      {isHome && (
        <nav aria-label="Navegação mobile" className="mobile-nav md:hidden">
          <Link
            to="/"
            search={defaultCatalog}
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-primary" }}
          >
            <Home aria-hidden="true" size={20} />
            <span className="sr-only">Início</span>
          </Link>
          <button
            type="button"
            disabled
            aria-label="Favoritos indisponíveis nesta etapa"
            className="text-muted-foreground disabled:opacity-100"
          >
            <Heart aria-hidden="true" size={20} />
          </button>
          <button
            type="button"
            className="mobile-nav-center"
            disabled
            aria-label="Ação central não disponível nesta demonstração"
          >
            <ScanLine aria-hidden="true" size={25} />
          </button>
          <Link
            to="/cart"
            activeProps={{ className: "text-primary" }}
            aria-label="Carrinho"
          >
            <ShoppingCart aria-hidden="true" size={20} />
          </Link>
          <Link
            to="/profile"
            activeProps={{ className: "text-primary" }}
            aria-label="Perfil"
          >
            <UserRound aria-hidden="true" size={20} />
          </Link>
        </nav>
      )}
    </div>
  );
}
