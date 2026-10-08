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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import axios from "axios";
import {
  ChevronLeft,
  Linkedin,
  Mail,
  ShoppingCart,
  Star,
  Twitter,
} from "lucide-react";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import { addCartItem, cartQuery, getGuestId } from "@/features/cart/api";
import { sessionQuery } from "@/features/auth/api";
import { useRef, useState } from "react";

function CollectorRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating.toFixed(1)} de 5 estrelas; ${count} avaliações de colecionadores`}
      className="hidden items-center gap-1 md:flex"
    >
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.min(1, Math.max(0, rating - index)) * 100;
          return (
            <span key={index} className="relative inline-flex">
              <Star
                size={16}
                className="fill-muted-foreground text-muted-foreground"
              />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star size={16} className="fill-primary text-primary" />
              </span>
            </span>
          );
        })}
      </span>
      <span className="text-sm">{count} avaliações de colecionadores</span>
    </span>
  );
}

function AddToCartButton({ nft, editionId, quantity, disabled, iconOnly = false }: { nft: Nft; editionId: string; quantity: number; disabled: boolean; iconOnly?: boolean }) {
  const session = useQuery(sessionQuery)
  const identity = session.data ? `user:${session.data.id}` : `guest:${getGuestId()}`
  const key = ['cart', identity]
  const queryClient = useQueryClient()
  const cart = useQuery({ ...cartQuery(identity), enabled: !session.isPending })
  const mutation = useMutation({
    mutationFn: () => addCartItem({ nftId: nft.id, editionId, quantity, expectedVersion: cart.data!.version }),
    onSuccess: (updated) => queryClient.setQueryData(key, updated),
    onError: () => void queryClient.invalidateQueries({ queryKey: key }),
  })
  const isDisabled = disabled || session.isPending || cart.isPending || cart.isError || mutation.isPending
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant={iconOnly ? "outline" : "default"}
        size={iconOnly ? "icon" : "default"}
        className={iconOnly ? "size-14 rounded-full" : "min-h-11"}
        disabled={isDisabled}
        aria-label={iconOnly ? `Adicionar ${nft.name} ao carrinho` : undefined}
        onClick={() => mutation.mutate()}
      >
        {iconOnly ? <ShoppingCart aria-hidden="true" /> : <><ShoppingCart aria-hidden="true" />Adicionar ao carrinho</>}
      </Button>
      {mutation.isSuccess && <span role="status" className="text-sm text-primary">Adicionado ao carrinho.</span>}
      {mutation.isError && <span role="alert" className="text-sm text-destructive">Não foi possível adicionar. Atualize o carrinho e tente novamente.</span>}
    </div>
  )
}

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
  return <NftDetail key={nftId} nft={nft.data} />;
}
function NftDetail({ nft }: { nft: Nft }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [editionId, setEditionId] = useState(lowestEdition(nft).id);
  const [requestedQuantity, setQuantity] = useState(1);
  const [panel, setPanel] = useState<"details" | "reviews">("details");
  const detailTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
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
        <FavoriteButton nftId={nft.id} name={nft.name} className="size-10" />
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
        <div className="nft-detail-gallery flex flex-col gap-4 md:grid md:grid-cols-[104px_minmax(0,1fr)] md:items-start">
          <img
            src={image?.url}
            alt={image?.alt ?? nft.name}
            width={640}
            height={640}
            fetchPriority="high"
            className="aspect-square w-full min-w-0 overflow-hidden rounded-3xl border-[12px] border-card object-cover md:col-start-2 md:row-start-1"
          />
          <div
            role="group"
            aria-label="Galeria do NFT"
            className="hidden gap-4 md:col-start-1 md:row-start-1 md:flex md:w-[104px] md:flex-col"
          >
            {nft.images.map((item, index) => (
              <button
                key={item.url}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={imageIndex === index}
                onClick={() => setImageIndex(index)}
                className={`size-[104px] shrink-0 rounded-lg border-2 p-0 ${imageIndex === index ? "border-primary" : "border-transparent"}`}
              >
                <img
                  src={item.url}
                  alt=""
                  width={100}
                  height={100}
                  className="aspect-square size-full rounded object-cover"
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
            <CollectorRating
              rating={nft.rating.average}
              count={nft.rating.count}
            />
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
                size="stepper"
                className="text-2xl leading-none"
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1 || edition.available === 0}
                onClick={() => setQuantity(quantity - 1)}
              >
                −
              </Button>
              <output aria-label="Quantidade selecionada">{quantity}</output>
              <Button
                size="stepper"
                className="text-2xl leading-none"
                aria-label="Aumentar quantidade"
                disabled={quantity >= edition.available}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
            <div className="nft-detail-desktop-actions flex flex-wrap gap-3">
              <Button className="uppercase" disabled>
                Comprar
              </Button>
              <AddToCartButton nft={nft} editionId={edition.id} quantity={quantity} disabled={edition.available === 0} />
              <FavoriteButton nftId={nft.id} name={nft.name} showLabel className="min-h-11 gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted" />
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-base text-muted-foreground">
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
          <div className="mt-3 hidden items-center gap-2 text-sm md:flex">
            <span className="mr-1">Compartilhar este NFT:</span>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no LinkedIn"
              className="inline-flex size-8 items-center justify-center text-foreground hover:text-primary"
            >
              <Linkedin
                size={16}
                aria-hidden="true"
                fill="currentColor"
                stroke="none"
              />
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Confira este NFT: ${nft.name}`)}&body=${encodeURIComponent(window.location.href)}`}
              aria-label="Compartilhar por email"
              className="inline-flex size-8 items-center justify-center text-foreground hover:text-primary"
            >
              <Mail size={16} aria-hidden="true" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(nft.name)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no Twitter"
              className="inline-flex size-8 items-center justify-center text-foreground hover:text-primary"
            >
              <Twitter
                size={16}
                fill="currentColor"
                stroke="none"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </section>
      <section className="mt-12 hidden md:block">
        <div
          role="tablist"
          aria-label="Informações do NFT"
          className="flex flex-wrap gap-8 border-b border-border"
          onKeyDown={(event) => {
            const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            const currentIndex = panel === "details" ? 0 : 1;
            const nextIndex =
              event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 1
                    : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + 2) % 2;
            const nextPanel = nextIndex === 0 ? "details" : "reviews";
            setPanel(nextPanel);
            detailTabRefs.current[nextIndex]?.focus();
          }}
        >
          <button
            ref={(element) => {
              detailTabRefs.current[0] = element;
            }}
            type="button"
            role="tab"
            id="nft-details-tab"
            aria-controls="nft-details-panel"
            aria-selected={panel === "details"}
            tabIndex={panel === "details" ? 0 : -1}
            className={`-mb-px border-b-2 px-0 pb-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${panel === "details" ? "border-primary text-primary" : "border-transparent text-foreground"}`}
            onClick={() => setPanel("details")}
          >
            Detalhes do NFT
          </button>
          <button
            ref={(element) => {
              detailTabRefs.current[1] = element;
            }}
            type="button"
            role="tab"
            id="nft-reviews-tab"
            aria-controls="nft-reviews-panel"
            aria-selected={panel === "reviews"}
            tabIndex={panel === "reviews" ? 0 : -1}
            className={`-mb-px border-b-2 px-0 pb-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${panel === "reviews" ? "border-primary text-primary" : "border-transparent text-foreground"}`}
            onClick={() => setPanel("reviews")}
          >
            Avaliações de colecionadores ({nft.rating.count})
          </button>
        </div>
        <div
          role="tabpanel"
          id="nft-details-panel"
          aria-labelledby="nft-details-tab"
          tabIndex={0}
          hidden={panel !== "details"}
          className="space-y-4 py-5 text-sm leading-7 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <p>{nft.description}</p>
            <p>
              Rede: {nft.network}. Dados e disponibilidade desta demonstração
              são simulados.
            </p>
        </div>
        <div
          role="tabpanel"
          id="nft-reviews-panel"
          aria-labelledby="nft-reviews-tab"
          tabIndex={0}
          hidden={panel !== "reviews"}
          className="py-5 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            Nota média: {nft.rating.average.toFixed(1)} em {nft.rating.count}{" "}
            avaliações simuladas. Comentários individuais não estão disponíveis.
        </div>
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
              size="stepper"
              className="text-lg leading-none"
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
              size="stepper"
              className="text-lg leading-none"
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
          <AddToCartButton nft={nft} editionId={edition.id} quantity={quantity} disabled={edition.available === 0} iconOnly />
        </div>
      </div>
    </div>
  );
}
