import { HeaderSearch } from '@/features/catalog/header-search'
import { defaultCatalog } from '@/features/catalog/search'
import { Link, Outlet } from '@tanstack/react-router'
import { Home, LogIn, ShoppingBag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="page-container flex min-h-20 items-center justify-between gap-4 border-b border-border">
        <Link to="/" search={defaultCatalog} aria-label="Kurio — início" className="text-lg font-bold tracking-[0.14em]">
          KURIO
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          <Link to="/" search={defaultCatalog} activeOptions={{ exact: true }} activeProps={{ className: 'text-primary' }}>
            Início
          </Link>
          <Link to="/" search={defaultCatalog} hash="colecoes">Mercado</Link>
        </nav>
        <div className="flex items-center gap-2">
          <HeaderSearch />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" aria-label="Carrinho de NFTs"><ShoppingBag aria-hidden="true" /></Link>
          </Button>
          <Button asChild>
            <Link to="/login"><LogIn aria-hidden="true" />Entrar</Link>
          </Button>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="page-container outline-none">
        <Outlet />
      </main>

      <footer className="page-container mt-16 border-t border-border pt-8 pb-28 md:pb-8">
        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold tracking-widest">KURIO</span>
          <p className="text-muted-foreground">Feito para colecionadores, criadores e cultura.</p>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Demonstração. Nenhuma transação real é realizada.</p>
      </footer>

      <nav aria-label="Navegação mobile" className="mobile-nav md:hidden">
        <Link to="/" search={defaultCatalog} activeOptions={{ exact: true }} activeProps={{ className: 'text-primary' }}>
          <Home aria-hidden="true" size={20} /><span>Início</span>
        </Link>
        <Link to="/cart" activeProps={{ className: 'text-primary' }}>
          <ShoppingBag aria-hidden="true" size={20} /><span>Carrinho</span>
        </Link>
        <Link to="/profile" activeProps={{ className: 'text-primary' }}>
          <UserRound aria-hidden="true" size={20} /><span>Perfil</span>
        </Link>
      </nav>
    </div>
  )
}
