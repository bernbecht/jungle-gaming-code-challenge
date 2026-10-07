import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  const pages = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [...new Set([1, page - 1, page, page + 1, totalPages])]
      .filter(value => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b)
  const items = pages.flatMap((value, index) =>
    index > 0 && value > pages[index - 1]! + 1 ? ['gap', value] : [value])
  const buttonClass = 'inline-flex size-11 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring'
  const controlClass = 'inline-flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary'

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-end">
      <span className="sr-only">Página {page} de {totalPages}</span>
      {page > 1 && (
        <button type="button" aria-label="Página anterior" className={buttonClass} onClick={() => onPageChange(page - 1)}>
          <span className={controlClass}><ChevronLeft size={14} aria-hidden="true" /></span>
        </button>
      )}
      {items.map((item, index) => typeof item === 'string' ? (
        <span key={`gap-${index}`} className="inline-flex h-11 w-7 items-center justify-center text-xs text-muted-foreground" aria-hidden="true">…</span>
      ) : (
        <button
          key={item}
          type="button"
          aria-label={`Página ${item}`}
          aria-current={page === item ? 'page' : undefined}
          className={buttonClass}
          onClick={() => onPageChange(item)}
        >
          <span className={`inline-flex size-7 items-center justify-center rounded-sm border text-xs ${page === item ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
            {item}
          </span>
        </button>
      ))}
      {page < totalPages && (
        <button type="button" aria-label="Próxima página" className={buttonClass} onClick={() => onPageChange(page + 1)}>
          <span className={controlClass}><ChevronRight size={14} aria-hidden="true" /></span>
        </button>
      )}
    </nav>
  )
}
