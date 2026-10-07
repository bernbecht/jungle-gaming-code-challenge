import { Link } from '@tanstack/react-router'
import type { Nft } from '@/contracts/marketplace'
import { lowestEdition } from './price'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function NftCard({ nft }: { nft: Nft }) {
  const edition = lowestEdition(nft)
  return <article className="min-w-0"><Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="group block" aria-label={`Ver ${nft.name}`}>
    <div className="relative bg-card p-2 md:p-3"><img src={nft.images[0]?.url} alt={nft.images[0]?.alt ?? nft.name} width={640} height={640} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />{!nft.editions.some(e => e.available > 0) && <span className="absolute bottom-4 left-4 rounded bg-background px-2 py-1 text-xs">Esgotado</span>}</div>
    <h3 className="mt-3 break-words text-sm font-medium group-hover:text-primary">{nft.name}</h3><p className="mt-1 text-xs text-muted-foreground">{nft.creator}</p><p className="mt-1 font-semibold text-primary">{edition.unitPrice} ETH</p>
  </Link></article>
}
export function CatalogSkeleton({ count = 12 }: { count?: number }) {
  return <div role="status" aria-label="Carregando NFTs"><span className="sr-only">Carregando NFTs…</span><div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">{Array.from({ length: count }, (_, i) => <div key={i}><Skeleton className="aspect-square w-full" /><Skeleton className="mt-3 h-5 w-3/4" /><Skeleton className="mt-2 h-5 w-1/2" /></div>)}</div></div>
}
export function QueryError({ retry, message = 'Não foi possível carregar os NFTs.' }: { retry: () => void; message?: string }) {
  return <div role="alert" className="rounded border border-border p-8 text-center"><p>{message}</p><Button className="mt-4" onClick={retry}>Tentar novamente</Button></div>
}
