import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { sessionQuery } from '@/features/auth/api'
import { favoritesQuery, saveFavorite } from './api'
import { useAuthDialog } from '@/features/auth/use-auth-dialog'
import { cn } from '@/lib/utils'

export function FavoriteButton({ nftId, name, className = '', showLabel = false }: { nftId: string; name: string; className?: string; showLabel?: boolean }) {
  const session = useQuery(sessionQuery)
  const userId = session.data?.id
  const queryClient = useQueryClient()
  const router = useRouter()
  const authDialog = useAuthDialog()
  const favorites = useQuery({ ...favoritesQuery(userId ?? ''), enabled: Boolean(userId) })
  const mutation = useMutation({
    mutationFn: (favorite: boolean) => saveFavorite(nftId, favorite),
    onMutate: async favorite => {
      if (!userId) return
      const key = ['favorites', userId]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<{ userId: string; nftIds: string[] }>(key)
      queryClient.setQueryData(key, { userId, nftIds: favorite ? [...new Set([...(previous?.nftIds ?? []), nftId])] : (previous?.nftIds ?? []).filter(id => id !== nftId) })
      return { key, previous }
    },
    onError: (_error, _favorite, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: (_data, _error, _favorite, context) => {
      if (context) void queryClient.invalidateQueries({ queryKey: context.key })
    },
  })
  const isFavorite = Boolean(favorites.data?.nftIds.includes(nftId))
  const controlClass = cn('inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)
  if (!userId) return (
    <Link
      to="/login"
      search={{ returnTo: router.state.location.href }}
      aria-label={`Entrar para favoritar ${name}`}
      className={controlClass}
      onClick={event => {
        if (window.matchMedia('(min-width: 768px)').matches) {
          event.preventDefault()
          authDialog.open('login', router.state.location.href, event.currentTarget)
        }
      }}
    >
      <Heart aria-hidden="true" />{showLabel && <span>Favoritar</span>}
    </Link>
  )
  return (
    <button type="button" aria-label={isFavorite ? `Remover ${name} dos favoritos` : `Favoritar ${name}`} aria-pressed={isFavorite} disabled={mutation.isPending || favorites.isPending} onClick={() => mutation.mutate(!isFavorite)} className={`${controlClass} disabled:opacity-60`}>
      <Heart aria-hidden="true" className={isFavorite ? 'fill-primary text-primary' : ''} />{showLabel && <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>}
      {mutation.isError && <span role="status" className="sr-only">Não foi possível atualizar o favorito. Tente novamente.</span>}
    </button>
  )
}
