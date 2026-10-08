import { Link, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { defaultCatalog } from '@/features/catalog/search'

export function UnderConstructionPage() {
  const { recurso } = useSearch({ from: '/em-construcao' })
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center py-12 text-center">
      <Construction aria-hidden="true" className="mb-6 size-12 text-primary" />
      <p className="mb-3 text-sm font-semibold text-primary">Em construção</p>
      <h1 className="text-2xl font-semibold md:text-3xl">{recurso}</h1>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">Esta página está sendo construída. Este recurso ainda não está disponível nesta demonstração.</p>
      <Button asChild variant="outline" className="mt-7"><Link to="/" search={defaultCatalog}><ArrowLeft aria-hidden="true" />Voltar ao início</Link></Button>
    </section>
  )
}
