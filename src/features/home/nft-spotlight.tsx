import { Skeleton } from "@/components/ui/skeleton";
import { nftQuery } from "@/features/catalog/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export function NftSpotlight() {
  const nft = useQuery(nftQuery("nft-002"));

  return (
    <section className="home-nft-spotlight" aria-labelledby="spotlight-title">
      <h2 id="spotlight-title">NFT em destaque</h2>
      <p className="home-spotlight-label">Oferta limitada</p>
      {nft.isPending ? (
        <Skeleton className="mt-3 aspect-square w-full" />
      ) : nft.isError ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Destaque temporariamente indisponível.
        </p>
      ) : (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.data.id }}
          className="home-spotlight-link"
        >
          <img
            src={nft.data.images[0]?.url}
            alt={nft.data.images[0]?.alt ?? nft.data.name}
            width={320}
            height={320}
            loading="lazy"
          />
          <span className="home-spotlight-details">
            <span>{nft.data.name}</span>
            <span>{nft.data.editions[0]?.unitPrice} ETH</span>
          </span>
        </Link>
      )}
    </section>
  );
}
