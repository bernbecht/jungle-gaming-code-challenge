import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function ErrorPage({ reset }: ErrorComponentProps) {
  return (
    <section role="alert" className="py-24 text-center">
      <h1 className="text-2xl font-semibold">Não foi possível abrir esta página</h1>
      <p className="mt-4 text-muted-foreground">Tente novamente para continuar navegando.</p>
      <Button className="mt-7" onClick={reset}>Tentar novamente</Button>
    </section>
  )
}
