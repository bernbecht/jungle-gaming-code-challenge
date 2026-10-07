import { defaultCatalog } from '@/features/catalog/search'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="py-24 text-center">
      <p className="text-sm text-primary">404</p>
      <h1 className="mt-3 text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-4 text-muted-foreground">Este endereço não está disponível na Kurio.</p>
      <Button asChild className="mt-7"><Link to="/" search={defaultCatalog}>Voltar ao início</Link></Button>
    </section>
  )
}
