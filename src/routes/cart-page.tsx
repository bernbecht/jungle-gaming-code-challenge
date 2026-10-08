import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cart, Network } from "@/contracts/marketplace";
import { sessionQuery } from "@/features/auth/api";
import {
  applyCartCoupon,
  cartQuery,
  deleteCartItem,
  getGuestId,
  removeCartCoupon,
  setCartQuantity,
} from "@/features/cart/api";
import { catalogQuery } from "@/features/catalog/api";
import { NftCard, QueryError } from "@/features/catalog/components";
import { defaultCatalog } from "@/features/catalog/search";
import { fromWei, toWei } from "@/lib/money";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import axios from "axios";
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

function messageFrom(error: unknown) {
  return axios.isAxiosError(error)
    ? ((error.response?.data as { error?: { message?: string } } | undefined)
        ?.error?.message ?? "Não foi possível atualizar o carrinho.")
    : "Não foi possível atualizar o carrinho.";
}

function formatEth(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.length < 2 ? fraction.padEnd(2, "0") : fraction} ETH`;
}
function lineTotal(unitPrice: string, quantity: number) {
  return fromWei(toWei(unitPrice) * BigInt(quantity));
}
const networkLabels: Record<Network, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  solana: "Solana",
};

export function CartPage() {
  const session = useQuery(sessionQuery);
  const identity = session.data
    ? `user:${session.data.id}`
    : `guest:${getGuestId()}`;
  const queryClient = useQueryClient();
  const key = ["cart", identity];
  const cart = useQuery({
    ...cartQuery(identity),
    enabled: !session.isPending,
  });
  const [coupon, setCoupon] = useState("");
  const [recommendationPage, setRecommendationPage] = useState(1);
  const [operationError, setOperationError] = useState("");
  const recommendations = useQuery({
    ...catalogQuery({
      ...defaultCatalog,
      page: recommendationPage,
      pageSize: 12,
    }),
    enabled: !cart.isPending && Boolean(cart.data?.items.length),
  });
  const mutation = useMutation({
    mutationFn: async (
      operation:
        | { kind: "quantity"; id: string; quantity: number }
        | { kind: "remove"; id: string }
        | { kind: "coupon"; code: string }
        | { kind: "remove-coupon" },
    ) => {
      const current = queryClient.getQueryData<Cart>(key);
      if (!current) throw new Error("O carrinho ainda está carregando.");
      if (operation.kind === "quantity")
        return setCartQuantity(
          operation.id,
          operation.quantity,
          current.version,
        );
      if (operation.kind === "remove")
        return deleteCartItem(operation.id, current.version);
      if (operation.kind === "coupon")
        return applyCartCoupon(operation.code, current.version);
      return removeCartCoupon(current.version);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(key, updated);
      setOperationError("");
    },
    onError: async (error) => {
      setOperationError(messageFrom(error));
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coupon.trim()) return;
    mutation.mutate({ kind: "coupon", code: coupon.trim() });
  }

  if (session.isPending || cart.isPending)
    return (
      <section className="py-10" role="status" aria-label="Carregando carrinho">
        <Skeleton className="mb-8 h-10 w-56" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </section>
    );
  if (session.isError)
    return (
      <section className="py-10">
        <QueryError
          message="Não foi possível validar sua sessão."
          retry={() => void session.refetch()}
        />
      </section>
    );
  if (cart.isError)
    return (
      <section className="py-10">
        <QueryError
          message="Não foi possível carregar o carrinho."
          retry={() => void cart.refetch()}
        />
      </section>
    );

  const data = cart.data;
  const busy = mutation.isPending;
  const itemGroups = (Object.keys(networkLabels) as Network[])
    .map((network) => ({
      network,
      items: data.items.filter((item) => item.network === network),
      totals: data.networkTotals[network],
    }))
    .filter((group) => group.items.length > 0);
  return (
    <section
      className={`cart-page py-6 md:py-6 ${data.items.length ? "pb-[65dvh] md:pb-6" : ""}`}
      aria-label="Carrinho de NFTs"
    >
      <div className="mb-5 grid grid-cols-[40px_1fr_40px] items-center md:hidden">
        <Link
          to="/"
          search={defaultCatalog}
          hash="colecoes"
          aria-label="Voltar ao mercado"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border text-primary"
        >
          <ArrowLeft aria-hidden="true" size={19} />
        </Link>
        <h1 id="cart-title" className="text-center text-xl font-semibold">
          Carrinho de NFTs
        </h1>
        <span aria-hidden="true" />
      </div>
      <nav
        aria-label="Caminho da página"
        className="mb-5 hidden text-sm font-semibold md:block"
      >
        <Link to="/" search={defaultCatalog} className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          to="/"
          search={defaultCatalog}
          hash="colecoes"
          className="hover:text-primary"
        >
          Mercado
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="sr-only hidden md:block">Carrinho de NFTs</h1>
      {operationError && (
        <p
          className="mb-5 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {operationError}
        </p>
      )}
      {data.notices.map((notice) => (
        <p
          key={notice.code}
          className="mb-4 rounded-md border border-primary/40 p-3 text-sm"
          role="status"
        >
          {notice.message}
        </p>
      ))}
      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <ShoppingCart
            className="mx-auto mb-4 text-primary"
            aria-hidden="true"
            size={34}
          />
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore o catálogo e encontre sua próxima obra.
          </p>
          <Button asChild className="mt-6">
            <Link to="/" search={defaultCatalog} hash="colecoes">
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,782px)_332px] xl:justify-between">
          <div className="min-w-0">
            {itemGroups.length > 1 && <p className="mb-4 rounded-lg border border-primary/30 p-3 text-sm text-secondary">Seu carrinho tem NFTs em redes diferentes. Finalize cada rede separadamente; os outros grupos permanecem no carrinho.</p>}
            <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px_100px_32px] gap-4 border-b border-border pb-2 text-sm font-semibold md:grid">
              <span>NFTs</span>
              <span className="text-right">Preço</span>
              <span className="text-center">Edições</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            <div className="mt-3 space-y-7">
              {itemGroups.map(({ network, items, totals }) => (
                <section key={network} aria-labelledby={`cart-network-${network}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
                    <h2 id={`cart-network-${network}`} className="text-sm font-semibold text-primary">
                      NFTs na rede {networkLabels[network]} <span className="font-normal text-secondary">({items.length})</span>
                    </h2>
                    <span className="shrink-0 text-sm font-semibold">{formatEth(totals?.total ?? "0")}</span>
                  </div>
                  <ul className="space-y-5 md:space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="relative grid min-h-[100px] grid-cols-[100px_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-2xl bg-card pr-3 md:min-h-0 md:grid-cols-[minmax(0,1fr)_100px_120px_100px_32px] md:gap-4 md:overflow-visible md:rounded-none md:pr-0 md:py-1.5"
                >
                  <div className="contents md:flex md:min-w-0 md:items-center md:gap-3">
                    <Link
                      to="/nfts/$nftId"
                      params={{ nftId: item.nftId }}
                      aria-label={`Ver ${item.name}`}
                      className="row-span-2 size-[100px] shrink-0 overflow-hidden md:row-span-1 md:size-[72px] md:rounded-lg"
                    >
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 py-2 md:py-0">
                      <Link
                        to="/nfts/$nftId"
                        params={{ nftId: item.nftId }}
                        className="block truncate text-sm font-semibold leading-tight hover:text-primary"
                      >
                        {item.name} #{item.tokenId}
                      </Link>
                      <p
                        data-testid="cart-item-edition"
                        className="md: hidden mt-1 text-sm font-medium text-secondary"
                      >
                        Edição: {item.editionLabel}
                      </p>
                      <p className="mt-1 text-base font-bold text-primary md:hidden">
                        {formatEth(lineTotal(item.unitPrice, item.quantity))}
                      </p>
                      <p className="mt-1 hidden text-sm text-muted-foreground md:block">
                        ID do token: #{item.tokenId}
                      </p>
                      {item.availability !== "available" && (
                        <p
                          className="mt-1 text-xs text-destructive md:text-sm"
                          role="status"
                        >
                          {item.availability === "unavailable"
                            ? "Edição esgotada."
                            : `Estoque atualizado: ${item.available} disponíveis.`}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="hidden text-right text-sm text-muted-foreground md:block">
                    {formatEth(item.unitPrice)}
                  </p>
                  <div className="flex items-center justify-between md:contents">
                    <div
                      className="flex items-center justify-start gap-1 md:justify-center md:gap-2"
                      role="group"
                      aria-label={`Quantidade de ${item.name}`}
                    >
                      <Button
                        size="stepper"
                        className="h-8 w-5 text-xs md:h-8 md:w-5"
                        aria-label={`Diminuir ${item.name}`}
                        disabled={busy || item.quantity <= 1}
                        onClick={() =>
                          mutation.mutate({
                            kind: "quantity",
                            id: item.id,
                            quantity: item.quantity - 1,
                          })
                        }
                      >
                        −
                      </Button>
                      <output
                        aria-label={`Quantidade de ${item.name} selecionada`}
                        className="min-w-6 text-center"
                      >
                        {item.quantity}
                      </output>
                      <Button
                        size="stepper"
                        className="h-8 w-5 text-xs md:h-8 md:w-5"
                        aria-label={`Aumentar ${item.name}`}
                        disabled={busy || item.quantity >= item.available}
                        onClick={() =>
                          mutation.mutate({
                            kind: "quantity",
                            id: item.id,
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      aria-label={`Remover ${item.name}`}
                      disabled={busy}
                      onClick={() =>
                        mutation.mutate({ kind: "remove", id: item.id })
                      }
                      className="h-9 gap-1 px-2 text-sm text-muted-foreground md:hidden"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                      Remover
                    </Button>
                  </div>
                  <p className="hidden text-right font-semibold text-primary md:block">
                    {formatEth(lineTotal(item.unitPrice, item.quantity))}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover ${item.name}`}
                    disabled={busy}
                    onClick={() =>
                      mutation.mutate({ kind: "remove", id: item.id })
                    }
                    className="hidden size-8 justify-self-end p-0 text-primary md:inline-flex"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                  </Button>
                </li>
              ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
          <aside
            aria-labelledby="summary-title"
            className="fixed inset-x-0 bottom-0 z-30 max-h-[65dvh] overflow-y-auto rounded-t-[2rem] border-t border-border bg-card px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:static md:z-auto md:max-h-none md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0"
          >
            <h2
              id="summary-title"
              className="sr-only border-b border-border pb-2 text-lg font-semibold md:not-sr-only md:block"
            >
              Resumo da carteira
            </h2>
            <form onSubmit={submitCoupon} className="mb-3 mt-0 md:mb-6 md:mt-5">
              <label
                htmlFor="cart-coupon"
                className="sr-only mb-2 text-sm font-semibold md:mb-3 md:not-sr-only md:block"
              >
                Código promocional
              </label>
              <div className="flex gap-2">
                <Input
                  id="cart-coupon"
                  className="min-w-0"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Digite o cupom"
                  disabled={busy}
                />
                <Button
                  type="submit"
                  className="h-12 min-h-12 shrink-0 px-5 md:h-10 md:min-h-10 md:px-4"
                  disabled={busy || !coupon.trim()}
                >
                  Aplicar
                </Button>
              </div>
            </form>
            {data.couponCode && (
              <div className="mb-5 flex items-center justify-between text-sm">
                <span>
                  Cupom <strong>{data.couponCode}</strong>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => mutation.mutate({ kind: "remove-coupon" })}
                >
                  Remover
                </Button>
              </div>
            )}
            <dl className="space-y-2 text-sm md:space-y-3">
              <div className="flex justify-between gap-3">
                <dt>Subtotal</dt>
                <dd>{formatEth(data.totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Desconto do lançamento</dt>
                <dd>(−) {formatEth(data.totals.discount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Taxa de rede</dt>
                <dd className="text-right">
                  {formatEth(data.totals.networkFee)}
                  <span className="block text-[10px] font-medium text-primary">
                    Taxa estimada
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3 pt-1 text-base font-semibold md:border-t md:border-border md:pt-4">
                <dt>Total</dt>
                <dd className="text-primary">{formatEth(data.totals.total)}</dd>
              </div>
            </dl>
            <div className="mt-5 space-y-2" aria-label="Finalização por rede">
              {itemGroups.map(({ network, items }) => (
                items.some((item) => item.availability !== "available") ? (
                  <Button key={network} className="min-h-11 w-full rounded-full text-sm md:rounded-md" disabled>
                    Estoque indisponível · {networkLabels[network]}
                  </Button>
                ) : (
                  <Button key={network} asChild className="min-h-11 w-full rounded-full text-sm md:rounded-md">
                    <Link to="/checkout" search={{ network }}>
                      Finalizar {networkLabels[network]} ({items.length})
                    </Link>
                  </Button>
                )
              ))}
            </div>
            <Link
              to="/"
              search={defaultCatalog}
              hash="colecoes"
              className="mt-3 hidden justify-center text-sm text-primary hover:underline md:flex"
            >
              Continuar explorando
            </Link>
          </aside>
        </div>
      )}
      {data.items.length > 0 && (
        <section
          className="mt-20 hidden md:block"
          aria-labelledby="cart-recommendations-title"
        >
          <h2
            id="cart-recommendations-title"
            className="border-b border-border pb-2 text-lg font-semibold text-primary"
          >
            Colecionadores também viram
          </h2>
          {recommendations.isPending ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="aspect-square" />
              ))}
            </div>
          ) : recommendations.isError ? (
            <div className="mt-5">
              <QueryError retry={() => void recommendations.refetch()} />
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-5">
                {recommendations.data.items
                  .filter(
                    (nft) => !data.items.some((item) => item.nftId === nft.id),
                  )
                  .slice(0, 5)
                  .map((nft) => (
                    <NftCard key={nft.id} nft={nft} />
                  ))}
              </div>
              <nav
                aria-label="Páginas de recomendações"
                className="mt-5 flex justify-center gap-2"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Página ${index + 1} de recomendações`}
                    aria-current={
                      recommendationPage === index + 1 ? "page" : undefined
                    }
                    onClick={() => setRecommendationPage(index + 1)}
                    className={`size-3 rounded-full border border-primary ${recommendationPage === index + 1 ? "bg-primary" : "bg-transparent"}`}
                  />
                ))}
              </nav>
            </>
          )}
        </section>
      )}
    </section>
  );
}
