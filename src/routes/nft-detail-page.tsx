import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Nft } from "@/contracts/marketplace";
import { catalogQuery, nftQuery } from "@/features/catalog/api";
import {
  CatalogSkeleton,
  NftCard,
  QueryError,
} from "@/features/catalog/components";
import { lowestEdition } from "@/features/catalog/price";
import { defaultCatalog } from "@/features/catalog/search";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import axios from "axios";
import {
  ChevronLeft,
  Heart,
  HeartIcon,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useState } from "react";

export function NftDetailPage() {
  const { nftId } = useParams({ from: "/nfts/$nftId" });
  const nft = useQuery(nftQuery(nftId));
  if (nft.isPending)
    return (
      <section
        role="status"
        aria-label="Carregando detalhe"
        className="grid gap-8 py-10 md:grid-cols-2"
      >
        <span className="sr-only">Carregando detalhe…</span>
        <Skeleton className="aspect-square" />
        <div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="mt-6 h-6 w-1/3" />
          <Skeleton className="mt-8 h-56 w-full" />
        </div>
      </section>
    );
  if (nft.isError) {
    if (axios.isAxiosError(nft.error) && nft.error.response?.status === 404)
      return (
        <section className="py-16 text-center">
          <h1 className="text-2xl font-semibold">NFT não encontrado</h1>
          <p className="mt-4">Esta obra não está disponível no catálogo.</p>
          <Button asChild className="mt-6">
            <Link to="/" search={defaultCatalog} hash="colecoes">
              Voltar ao mercado
            </Link>
          </Button>
        </section>
      );
    return (
      <section className="py-10">
        <QueryError
          retry={() => void nft.refetch()}
          message="Não foi possível carregar o detalhe."
        />
      </section>
    );
  }
  return <NftDetail key={nftId} nft={nft.data} updating={nft.isFetching} />;
}
function NftDetail({ nft, updating }: { nft: Nft; updating: boolean }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [editionId, setEditionId] = useState(lowestEdition(nft).id);
  const [requestedQuantity, setQuantity] = useState(1);
  const [panel, setPanel] = useState<"details" | "reviews">("details");
  const [shareMessage, setShareMessage] = useState("");
  const edition =
    nft.editions.find((e) => e.id === editionId) ?? lowestEdition(nft);
  const quantity = Math.max(
    1,
    Math.min(requestedQuantity, edition.available || 1),
  );
  const image = nft.images[imageIndex] ?? nft.images[0];
  const related = useQuery(
    catalogQuery({
      ...defaultCatalog,
      collection: [nft.collection],
      pageSize: 6,
    }),
  );
  return (
    <div className="nft-detail-page pb-44 md:pb-0">
      <nav
        aria-label="Navegação do detalhe"
        className="mobile-detail-toolbar md:hidden"
      >
        <Link to="/" search={defaultCatalog} aria-label="Voltar ao mercado">
          <ChevronLeft aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled
          aria-label="Favoritos indisponíveis nesta etapa"
          className="disabled:opacity-100"
        >
          <Heart aria-hidden="true" />
        </button>
      </nav>
      <nav
        aria-label="Caminho da página"
        className="hidden py-6 text-sm md:block"
      >
        <Link to="/" search={defaultCatalog}>
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link to="/" search={defaultCatalog} hash="colecoes">
          Mercado
        </Link>
      </nav>
      <section
        aria-labelledby="nft-title"
        className="nft-detail-layout grid gap-8 lg:grid-cols-2"
      >
        <div className="nft-detail-gallery flex flex-col gap-4 md:flex-row-reverse">
          <img
            src={image?.url}
            alt={image?.alt ?? nft.name}
            width={640}
            height={640}
            fetchPriority="high"
            className="aspect-square min-w-0 flex-1 rounded-xl border-[12px] border-card object-cover md:w-[calc(100%-100px)]"
          />
          <div
            role="group"
            aria-label="Galeria do NFT"
            className="hidden gap-3 md:flex md:w-20 md:flex-col"
          >
            {nft.images.map((item, index) => (
              <button
                key={item.url}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={imageIndex === index}
                onClick={() => setImageIndex(index)}
                className={`w-16 shrink-0 rounded-lg border-2 p-1 md:w-20 ${imageIndex === index ? "border-primary" : "border-transparent"}`}
              >
                <img
                  src={item.url}
                  alt=""
                  width={80}
                  height={80}
                  className="aspect-square rounded object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="nft-detail-info min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h1
              id="nft-title"
              className="text-xl font-semibold md:text-2xl lg:text-3xl"
            >
              {nft.name}
            </h1>
            <p className="mobile-rating flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 text-xs md:hidden">
              <Star
                className="fill-primary text-primary"
                size={14}
                aria-hidden="true"
              />
              {nft.rating.average.toFixed(1)}{" "}
              <span className="text-muted-foreground">
                ({nft.rating.count})
              </span>
            </p>
          </div>
          <div className="nft-detail-price-row mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="hidden text-xl font-semibold text-primary md:block">
              {edition.unitPrice} ETH
            </p>
            <p className="hidden items-center gap-2 text-sm md:flex">
              <Star className="text-primary" size={18} aria-hidden="true" />
              {nft.rating.average.toFixed(1)} · {nft.rating.count} avaliações
            </p>
          </div>
          <h2 className="mt-5 font-semibold">Sobre este NFT</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {nft.description}
          </p>
          <fieldset className="mt-5">
            <legend className="mb-3 font-medium">Edição</legend>
            <div className="flex flex-wrap gap-3">
              {nft.editions.map((item) => (
                <label
                  key={item.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card ${item.id === edition.id ? "border-primary text-primary" : "border-border"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="edition"
                    value={item.id}
                    checked={item.id === edition.id}
                    onChange={() => {
                      setEditionId(item.id);
                      setQuantity(1);
                    }}
                  />
                  {item.label}
                  {item.available === 0 ? " · Esgotada" : ""}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-center justify-between mt-4">
            <div
              role="group"
              aria-label="Quantidade"
              className="nft-detail-desktop-quantity flex items-center gap-4"
            >
              <Button
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1 || edition.available === 0}
                onClick={() => setQuantity(quantity - 1)}
              >
                −
              </Button>
              <output aria-label="Quantidade selecionada">{quantity}</output>
              <Button
                aria-label="Aumentar quantidade"
                disabled={quantity >= edition.available}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
            <div className="nft-detail-desktop-actions flex flex-wrap gap-3">
              <Button disabled>Comprar</Button>
              <Button variant="outline" disabled>
                <HeartIcon size={20} aria-hidden />
                Favoritar
              </Button>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">#{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{nft.collection}</dd>
            </div>
            <div>
              <dt className="inline">Criador: </dt>
              <dd className="inline">{nft.creator}</dd>
            </div>
            {nft.attributes.map((attribute) => (
              <div key={attribute.name}>
                <dt className="inline">{attribute.name}: </dt>
                <dd className="inline">{attribute.value}</dd>
              </div>
            ))}
          </dl>
          <Button
            variant="ghost"
            className="mt-3 hidden md:block"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href).then(
                () => setShareMessage("Link copiado."),
                () =>
                  setShareMessage(
                    "Não foi possível copiar o link. Copie o endereço do navegador.",
                  ),
              );
            }}
          >
            Compartilhar NFT
          </Button>
          <p role="status" className="text-sm">
            {shareMessage}
          </p>
        </div>
      </section>
      <section className="mt-12 hidden md:block">
        <div
          role="group"
          aria-label="Informações do NFT"
          className="flex flex-wrap gap-4 border-b border-border pb-3"
        >
          <Button
            variant="ghost"
            aria-pressed={panel === "details"}
            onClick={() => setPanel("details")}
          >
            Detalhes do NFT
          </Button>
          <Button
            variant="ghost"
            aria-pressed={panel === "reviews"}
            onClick={() => setPanel("reviews")}
          >
            Avaliações de colecionadores
          </Button>
        </div>
        {panel === "details" ? (
          <div className="space-y-4 py-5 text-sm leading-7 text-muted-foreground">
            <p>{nft.description}</p>
            <p>
              Rede: {nft.network}. Dados e disponibilidade desta demonstração
              são simulados.
            </p>
          </div>
        ) : (
          <p className="py-5 text-sm text-muted-foreground">
            Nota média: {nft.rating.average.toFixed(1)} em {nft.rating.count}{" "}
            avaliações simuladas. Comentários individuais não estão disponíveis.
          </p>
        )}
      </section>
      <section className="mt-10" aria-labelledby="related-title">
        <h2
          id="related-title"
          className="mb-6 border-b border-border pb-4 font-semibold text-primary"
        >
          Mais desta coleção
        </h2>
        {related.isPending ? (
          <CatalogSkeleton count={5} />
        ) : related.isError ? (
          <QueryError retry={() => void related.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {related.data.items
              .filter((item) => item.id !== nft.id)
              .slice(0, 5)
              .map((item) => (
                <NftCard key={item.id} nft={item} />
              ))}
          </div>
        )}
      </section>
      <div className="mobile-purchase-bar md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Quantidade"
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-muted-foreground">Qtd.</span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1 || edition.available === 0}
              onClick={() => setQuantity(quantity - 1)}
            >
              −
            </Button>
            <output
              aria-label="Quantidade selecionada"
              className="min-w-3 text-center"
            >
              {quantity}
            </output>
            <Button
              variant="outline"
              size="icon"
              aria-label="Aumentar quantidade"
              disabled={quantity >= edition.available}
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
          <p className="text-lg font-semibold text-primary">
            {edition.unitPrice} ETH
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <Button disabled className="h-14 flex-1 rounded-full">
            Comprar NFT
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-14 rounded-full"
            disabled
            aria-label="Adicionar ao carrinho indisponível nesta etapa"
          >
            <ShoppingCart aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
