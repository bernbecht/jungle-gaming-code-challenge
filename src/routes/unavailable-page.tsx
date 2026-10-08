import { defaultCatalog } from '@/features/catalog/search'
import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessionQuery, signOut } from '@/features/auth/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function UnavailablePage({ title, showMobileSignOut = false }: { title: string; showMobileSignOut?: boolean }) {
  const session = useQuery(sessionQuery)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(['session'], null)
      void navigate({ to: '/', search: defaultCatalog })
    },
  })

  return (
    <section className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-start justify-center py-12">
      <p className="mb-3 text-xs tracking-widest text-primary uppercase">Em breve</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-5 leading-7 text-muted-foreground">
        Esta página está em preparação. Por enquanto, nenhuma operação está disponível aqui.
      </p>
      {showMobileSignOut && session.data && <Button className="mt-6 md:hidden" variant="outline" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>{logoutMutation.isPending ? 'Saindo…' : 'Sair'}</Button>}
      <Button asChild className="mt-7" variant="outline">
        <Link to="/" search={defaultCatalog}><ArrowLeft aria-hidden="true" />Voltar ao início</Link>
      </Button>
    </section>
  )
}
