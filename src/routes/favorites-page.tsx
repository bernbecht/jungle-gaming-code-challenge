import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Heart } from 'lucide-react'
import type { Favorites } from '@/contracts/marketplace'
import { Button } from '@/components/ui/button'
import { sessionQuery } from '@/features/auth/api'
import { nftQuery } from '@/features/catalog/api'
import { CatalogSkeleton, NftCard, QueryError } from '@/features/catalog/components'
import { defaultCatalog } from '@/features/catalog/search'
import { favoritesQuery, saveFavorite } from '@/features/favorites/api'

export function FavoritesPage() {
  const session = useQuery(sessionQuery)
  const userId = session.data?.id ?? ''
  const queryClient = useQueryClient()
  const favorites = useQuery({ ...favoritesQuery(userId), enabled: Boolean(userId) })
  const nfts = useQueries({ queries: (favorites.data?.nftIds ?? []).map(nftQuery) })
  const removal = useMutation({
    mutationFn: (nftId: string) => saveFavorite(nftId, false),
    onMutate: async nftId => {
      const key = favoritesQuery(userId).queryKey
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      if (previous) queryClient.setQueryData<Favorites>(key, { ...previous, nftIds: previous.nftIds.filter(id => id !== nftId) })
      return { key, previous }
    },
    onError: (_error, _nftId, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: (_data, _error, _nftId, context) => {
      if (context) return queryClient.invalidateQueries({ queryKey: context.key })
    },
  })
  const loading = favorites.isPending || nfts.some(nft => nft.isPending)
  const failed = favorites.isError || nfts.some(nft => nft.isError)

  return (
    <section aria-labelledby="favorites-title" className="py-8 md:py-12">
      <Link to="/" search={defaultCatalog} aria-label="Voltar ao início" className="mb-5 inline-flex size-11 items-center justify-center rounded-full border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden">
        <ArrowLeft aria-hidden="true" size={20} />
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="favorites-title" className="text-2xl font-semibold md:text-3xl">Meus favoritos</h1>
          <p className="mt-3 text-sm text-muted-foreground">Os NFTs que você salvou para revisitar e colecionar.</p>
          {favorites.data && <p role="status" className="mt-2 text-sm text-primary">{favorites.data.nftIds.length} {favorites.data.nftIds.length === 1 ? 'NFT salvo' : 'NFTs salvos'}</p>}
        </div>
        <Button variant="outline" className="hidden md:inline-flex" asChild><Link to="/" search={defaultCatalog} hash="colecoes">Explorar catálogo</Link></Button>
      </div>
      {removal.isError && <p role="alert" className="mb-6 rounded border border-destructive p-4 text-sm">Não foi possível remover o favorito. Sua lista foi restaurada. Tente novamente.</p>}
      {loading ? <CatalogSkeleton count={6} /> : failed ? (
        <QueryError message="Não foi possível carregar seus favoritos." retry={() => {
          void favorites.refetch()
          nfts.filter(nft => nft.isError).forEach(nft => { void nft.refetch() })
        }} />
      ) : nfts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Heart aria-hidden="true" className="mx-auto mb-4 size-10 text-primary" />
          <h2 className="text-lg font-semibold">Você ainda não tem favoritos</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Toque no coração de um NFT para salvá-lo aqui. Você pode adicionar e remover favoritos quando quiser.</p>
          <Button className="mt-6" asChild><Link to="/" search={defaultCatalog} hash="colecoes">Descobrir NFTs</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-4" data-testid="favorites-grid">
          {nfts.map(result => result.data && (
            <div key={result.data.id} className="relative min-w-0">
              <NftCard nft={result.data} />
              <Button variant="ghost" size="icon" aria-label={`Remover ${result.data.name} dos favoritos`} disabled={removal.isPending} onClick={() => removal.mutate(result.data.id)} className="absolute top-2 right-2 size-11 rounded-full bg-background/90 text-primary hover:bg-background">
                <Heart aria-hidden="true" className="fill-current" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {!loading && !failed && nfts.length > 0 && (
        <Button variant="outline" className="mt-8 w-full md:hidden" asChild><Link to="/" search={defaultCatalog} hash="colecoes">Explorar catálogo</Link></Button>
      )}
    </section>
  )
}
