import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <>
      <section aria-labelledby="hero-title" className="grid items-center gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-16">
        <div className="max-w-xl">
          <p className="mb-5 text-xs font-medium tracking-widest text-muted-foreground">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="text-3xl leading-snug font-semibold tracking-tight uppercase lg:text-5xl lg:leading-snug">
            Seja dono do futuro da arte digital
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
            Descubra novas formas de colecionar. Arte digital, criatividade e uma comunidade de possibilidades.
          </p>
          <Button size="lg" className="mt-7" asChild>
            <a href="#colecoes">Explorar<ArrowUpRight aria-hidden="true" /></a>
          </Button>
        </div>
        <figure className="relative mx-auto w-full max-w-md">
          <img
            src="/assets/placeholders/emerald.svg"
            alt="Composição abstrata em verde e cobre, ilustração temporária da coleção"
            width={640}
            height={640}
            fetchPriority="high"
            className="aspect-square w-full rounded-3xl border border-border bg-card object-cover"
          />
          <figcaption className="absolute right-5 bottom-5 left-5 rounded-xl border border-white/10 bg-background/90 px-5 py-4 text-sm">
            Arte sem fronteiras.<span className="mt-1 block text-xs text-muted-foreground">Uma nova perspectiva para sua coleção.</span>
          </figcaption>
        </figure>
      </section>

      <section id="colecoes" aria-labelledby="collections-title" className="scroll-mt-6 py-8">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <h2 id="collections-title" className="text-lg font-semibold text-primary">Explore as coleções</h2>
          <ArrowDown aria-hidden="true" size={18} className="text-primary" />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="font-medium">Novas coleções em breve</p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            O catálogo ainda está em preparação. Volte em breve para descobrir as obras disponíveis.
          </p>
        </div>
      </section>
    </>
  )
}
