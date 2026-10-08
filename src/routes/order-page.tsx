import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Wallet } from "@/contracts/marketplace";
import { orderQuery } from "@/features/checkout/api";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, LoaderCircle, X } from "lucide-react";
import { fromWei, toWei } from "@/lib/money";
import { defaultCatalog } from "@/features/catalog/search";
import { useEffect } from "react";

function formatEth(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.length < 2 ? fraction.padEnd(2, "0") : fraction} ETH`;
}

const providerNames: Record<Wallet["provider"], string> = {
  metamask: "MetaMask",
  walletconnect: "WalletConnect",
  coinbase: "Coinbase Wallet",
};

export function OrderPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const order = useQuery(orderQuery(orderId));

  useEffect(() => {
    if (order.data && order.data.status !== "pending")
      localStorage.removeItem(`kurio-order-attempt:${order.data.userId}`);
  }, [order.data]);

  if (order.isPending)
    return (
      <section className="mx-auto max-w-2xl py-12" role="status" aria-label="Carregando pedido">
        <Skeleton className="h-[620px] w-full rounded-xl" />
      </section>
    );

  if (order.isError)
    return (
      <section className="mx-auto max-w-xl py-16 text-center" role="alert">
        <CircleAlert className="mx-auto text-destructive" size={36} />
        <h1 className="mt-4 text-2xl font-semibold">Não foi possível carregar este pedido</h1>
        <p className="mt-2 text-sm text-secondary">O pedido pode não existir ou não pertencer à sua conta.</p>
        <Button className="mt-6" onClick={() => void order.refetch()}>Tentar novamente</Button>
      </section>
    );

  const value = order.data;
  if (value.status === "pending")
    return (
      <section className="mx-auto my-8 max-w-xl rounded-2xl border border-border bg-card p-6 text-center md:my-16 md:p-10" role="status" aria-live="polite">
        <LoaderCircle className="mx-auto animate-spin text-primary" size={42} />
        <h1 className="mt-5 text-2xl font-semibold">Aguardando confirmação do pagamento</h1>
        <p className="mt-3 text-sm leading-relaxed text-secondary">Seu pedido foi registrado. Estamos aguardando o resultado da simulação; não feche esta página para acompanhar o status.</p>
        <p className="mt-5 text-xs text-muted-foreground">Pedido {value.id} · Nenhuma transação real foi enviada.</p>
      </section>
    );

  if (value.status === "declined")
    return (
      <section className="mx-auto my-8 max-w-xl rounded-2xl border border-border bg-card p-6 text-center md:my-16 md:p-10">
        <CircleAlert className="mx-auto text-destructive" size={42} />
        <h1 className="mt-5 text-2xl font-semibold">Pagamento não confirmado</h1>
        <p role="alert" className="mt-3 text-sm text-secondary">{value.declineReason ?? "A simulação recusou o pagamento."} Seus itens continuam no carrinho.</p>
        <Button asChild className="mt-6"><Link to="/cart">Voltar ao carrinho</Link></Button>
      </section>
    );

  return (
    <section className="mx-auto my-6 max-w-[580px] overflow-hidden rounded-xl border border-border border-b-[10px] border-b-primary bg-card md:my-12">
      <header className="relative px-5 pt-8 pb-5 text-center md:px-10">
        <Link to="/" search={defaultCatalog} aria-label="Fechar confirmação e voltar ao início" className="absolute top-4 right-4 text-primary hover:text-accent"><X size={18} /></Link>
        <CheckCircle2 className="mx-auto text-primary" size={50} />
        <h1 className="mt-4 text-lg font-semibold text-secondary">Compra simulada confirmada</h1>
        <p className="mt-1 text-sm text-secondary">Seu pedido foi confirmado na simulação.</p>
      </header>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-4 border-y border-primary px-5 py-4 text-sm sm:grid-cols-4 md:px-9">
        <div><dt className="text-secondary">ID do pedido</dt><dd className="mt-1 break-all font-medium">{value.id}</dd></div>
        <div><dt className="text-secondary">Data</dt><dd className="mt-1">{new Date(value.createdAt).toLocaleDateString("pt-BR")}</dd></div>
        <div><dt className="text-secondary">Total</dt><dd className="mt-1 font-semibold text-primary">{formatEth(value.snapshot.totals.total)}</dd></div>
        <div><dt className="text-secondary">Carteira</dt><dd className="mt-1">{providerNames[value.snapshot.walletProvider]}</dd></div>
      </dl>
      <div className="px-5 py-5 md:px-9">
        <h2 className="mb-3 font-semibold">Detalhes do pedido</h2>
        <div className="hidden grid-cols-[minmax(0,1fr)_auto] border-b border-border pb-2 text-sm font-semibold sm:grid"><span>NFTs</span><span>Subtotal</span></div>
        <ul className="space-y-3">
          {value.snapshot.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 border-b border-border/60 py-3 sm:border-0 sm:py-1">
              <img src={item.imageUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name} #{item.tokenId}</p><p className="text-xs text-secondary">Edição {item.editionLabel} · quantidade {item.quantity}</p></div>
              <p className="shrink-0 text-sm font-semibold text-primary">{formatEth(fromWei(toWei(item.unitPrice) * BigInt(item.quantity)))}</p>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 max-w-64 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt>Taxa de rede</dt><dd>{formatEth(value.snapshot.totals.networkFee)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold"><dt>Total</dt><dd className="text-primary">{formatEth(value.snapshot.totals.total)}</dd></div>
        </dl>
        <p className="mt-5 text-center text-sm leading-relaxed text-secondary">Este pedido foi confirmado apenas na simulação local. A referência <span className="font-medium text-foreground">{value.transaction?.reference}</span> não corresponde a uma transação em blockchain.</p>
        <Button type="button" variant="outline" disabled className="mx-auto mt-5 flex">Explorador indisponível na simulação</Button>
        <Button asChild className="mt-4 w-full"><Link to="/" search={defaultCatalog}>Continuar explorando</Link></Button>
      </div>
    </section>
  );
}
