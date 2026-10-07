import { useId, useRef } from 'react'
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { defaultCatalog, validateCatalogSearch } from './search'

export function HeaderSearch({ variant = 'icon' }: { variant?: 'icon' | 'field' }) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const search = useSearch({ strict: false })
  const navigate = useNavigate({ from: '/' })
  const params = location.pathname === '/' ? validateCatalogSearch(search) : defaultCatalog

  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        size={variant === 'icon' ? 'icon' : 'default'}
        className={variant === 'field' ? 'w-full justify-start rounded-xl bg-card px-4 text-left text-muted-foreground hover:bg-card' : undefined}
        aria-label="Abrir busca de NFTs"
        aria-haspopup="dialog"
        aria-controls={`${id}-dialog`}
        onClick={() => {
          if (input.current) input.current.value = params.q
          dialog.current?.showModal()
          input.current?.focus()
        }}
      >
        <Search aria-hidden="true" />
        {variant === 'field' && <span>Explorar coleções</span>}
      </Button>
      <dialog
        ref={dialog}
        id={`${id}-dialog`}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-border bg-card p-5 text-foreground backdrop:bg-black/70 md:p-6"
        onClose={() => trigger.current?.focus()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={`${id}-title`} className="font-semibold">Buscar NFTs</h2>
          <Button variant="ghost" size="icon" aria-label="Fechar busca" onClick={() => dialog.current?.close()}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <form role="search" onSubmit={event => {
          event.preventDefault()
          const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
          void navigate({ search: { ...params, q, page: 1 }, hash: 'colecoes' })
            .then(() => dialog.current?.close())
        }}>
          <label className="sr-only" htmlFor={`${id}-input`}>Buscar NFTs</label>
          <Input ref={input} id={`${id}-input`} name="q" type="search" defaultValue={params.q} placeholder="Obra, coleção ou criador" />
          <Button type="submit" className="mt-4 w-full">Buscar</Button>
        </form>
      </dialog>
    </>
  )
}
