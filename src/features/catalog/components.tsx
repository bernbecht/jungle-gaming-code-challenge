import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Nft } from "@/contracts/marketplace";
import { Link } from "@tanstack/react-router";
import { lowestEdition } from "./price";
import { FavoriteIndicator } from "@/features/favorites/favorite-button";

export function NftCard({
  nft,
  mobileHome = false,
}: {
  nft: Nft;
  mobileHome?: boolean;
}) {
  const edition = lowestEdition(nft);
  return (
    <article className="min-w-0">
      <div className="relative">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="group block"
          aria-label={`Ver ${nft.name}`}
        >
          <div className="relative bg-card">
            <img
              src={nft.images[0]?.url}
              alt={nft.images[0]?.alt ?? nft.name}
              width={640}
              height={640}
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
            {!nft.editions.some((item) => item.available > 0) && (
              <span className="absolute bottom-3 left-3 rounded bg-background px-2 py-1 text-xs">
                Esgotado
              </span>
            )}
          </div>
          <h3 className="mt-3 break-words px-1 text-sm font-medium group-hover:text-primary md:text-base">
            {nft.name}
          </h3>
          <p className="mt-1 px-1 text-sm font-semibold text-primary md:text-lg">
            {edition.unitPrice} ETH
          </p>
        </Link>
        {mobileHome && (
          <FavoriteIndicator nftId={nft.id} name={nft.name} className="absolute top-3 right-3 size-9 bg-background/90 text-primary md:hidden" />
        )}
      </div>
    </article>
  );
}
export function CatalogSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando NFTs">
      <span className="sr-only">Carregando NFTs…</span>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-2 h-5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function QueryError({
  retry,
  message = "Não foi possível carregar os NFTs.",
}: {
  retry: () => void;
  message?: string;
}) {
  return (
    <div role="alert" className="rounded border border-border p-8 text-center">
      <p>{message}</p>
      <Button className="mt-4" onClick={retry}>
        Tentar novamente
      </Button>
    </div>
  );
}
