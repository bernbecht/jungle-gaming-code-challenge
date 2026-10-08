import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Cart,
  Collector,
  Network,
  OrderInput,
  Quote,
  Wallet,
} from "@/contracts/marketplace";
import { sessionQuery } from "@/features/auth/api";
import { cartQuery } from "@/features/cart/api";
import {
  connectWallet,
  createQuote,
  disconnectWallet,
  readAttempt,
  submitOrder,
  walletsQuery,
} from "@/features/checkout/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import axios from "axios";
import { ArrowLeft, LoaderCircle, WalletCards } from "lucide-react";
import { fromWei, toWei } from "@/lib/money";
import { defaultCatalog } from "@/features/catalog/search";
import { useEffect, useState, type FormEvent } from "react";

type Provider = Wallet["provider"];
type CheckoutStep = "data" | "wallet" | "review";
type Attempt = { key: string; input: OrderInput };

const providers: { id: Provider; label: string }[] = [
  { id: "walletconnect", label: "WalletConnect" },
  { id: "metamask", label: "MetaMask" },
  { id: "coinbase", label: "Coinbase Wallet" },
];
const networks: { id: Network; label: string }[] = [
  { id: "ethereum", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "solana", label: "Solana" },
];

function formatEth(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.length < 2 ? fraction.padEnd(2, "0") : fraction} ETH`;
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | { error?: { message?: string; code?: string; details?: { quote?: Quote } } }
      | undefined;
    return body?.error?.message ?? "Não foi possível continuar com a compra.";
  }
  return "Não foi possível continuar com a compra.";
}

function errorDetails(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data as
        | { error?: { code?: string; details?: { quote?: Quote } } }
        | undefined)?.error
    : undefined;
}

function Field({
  label,
  value,
  onChange,
  required = false,
  readOnly = false,
  type = "text",
  id,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  required?: boolean;
  readOnly?: boolean;
  type?: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 text-sm">
      <span className="mb-2 block">
        {label}
        {required && <span className="ml-1 text-primary" aria-hidden="true">*</span>}
      </span>
      <Input
        id={id}
        type={type}
        required={required}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className={readOnly ? "read-only:opacity-80" : undefined}
      />
    </label>
  );
}

function WalletChoice({
  wallet,
  selected,
  onSelect,
}: {
  wallet: Wallet;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${selected ? "border-primary bg-card" : "border-border bg-card/60 hover:border-primary/60"}`}
    >
      <span className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary" : "border-muted-foreground"}`}>
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{wallet.nickname}</span>
        <span className="mt-1 block truncate text-sm text-secondary">
          {wallet.ensName ?? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Rede {networks.find((network) => network.id === wallet.network)?.label}
        </span>
      </span>
    </button>
  );
}

function OrderSummary({ cart, quote }: { cart: Cart; quote: Quote | null }) {
  const items = quote?.items ?? cart.items;
  const totals = quote?.totals ?? cart.totals;
  return (
    <section aria-labelledby="checkout-items-title" className="min-w-0">
      <h2 id="checkout-items-title" className="mb-3 text-lg font-semibold">Seus NFTs</h2>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border pb-2 text-sm font-semibold">
        <span>NFTs</span><span>Subtotal</span>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 items-center gap-3 rounded-lg bg-card p-2">
            <img src={item.imageUrl} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.name} #{item.tokenId}</p>
              <p className="mt-1 text-xs text-secondary">Edição {item.editionLabel} · × {item.quantity}</p>
            </div>
            <p className="shrink-0 text-right font-semibold text-primary">{formatEth(fromWei(toWei(item.unitPrice) * BigInt(item.quantity)))}</p>
          </li>
        ))}
      </ul>
      <p className="my-3 text-right text-sm text-secondary">
        {cart.couponCode ? `Cupom ${cart.couponCode} aplicado` : "Tem um código promocional?"} {" "}
        {!cart.couponCode && <Link to="/cart" className="text-primary underline">Aplique no carrinho</Link>}
      </p>
      <dl className="space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{formatEth(totals.subtotal)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Desconto do lançamento</dt><dd>(−) {formatEth(totals.discount)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Taxa de rede <span className="block text-xs text-primary">Taxa estimada</span></dt><dd>{formatEth(totals.networkFee)}</dd></div>
        <div className="flex justify-between gap-3 border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd className="text-primary">{formatEth(totals.total)}</dd></div>
      </dl>
    </section>
  );
}

export function CheckoutPage() {
  const search = useSearch({ from: "/checkout" });
  const session = useQuery(sessionQuery);
  const userId = session.data?.id ?? "";
  const cart = useQuery({ ...cartQuery(`user:${userId}`), enabled: Boolean(userId) });
  const wallets = useQuery({ ...walletsQuery(userId), enabled: Boolean(userId) });
  const network = search.network ?? cart.data?.items[0]?.network ?? "ethereum";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [walletId, setWalletId] = useState(() => wallets.data?.[0]?.id ?? "");
  const [provider, setProvider] = useState<Provider>(() => wallets.data?.[0]?.provider ?? "metamask");
  const [step, setStep] = useState<CheckoutStep>("data");
  const [connected, setConnected] = useState<{ id: string; walletId: string; network: Network } | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteExpired, setQuoteExpired] = useState(false);
  const [notice, setNotice] = useState(() => userId && localStorage.getItem(`kurio-order-attempt:${userId}`) ? "Há uma tentativa de compra anterior que pode ser recuperada com segurança." : "");
  const [problem, setProblem] = useState("");
  const [recoverAvailable, setRecoverAvailable] = useState(() => Boolean(userId && localStorage.getItem(`kurio-order-attempt:${userId}`)));
  const [collector, setCollector] = useState<Collector>(() => ({
    displayName: session.data?.displayName ?? "",
    username: session.data?.username ?? "",
    email: session.data?.email ?? "",
    profileName: wallets.data?.[0]?.profileName ?? "",
    ensName: session.data?.ensName ?? wallets.data?.[0]?.ensName ?? null,
    referralCode: wallets.data?.[0]?.referralCode ?? null,
    note: "",
  }));
  const selectedWallet = wallets.data?.find((wallet) => wallet.id === walletId && wallet.network === network)
    ?? wallets.data?.find((wallet) => wallet.network === network);
  const totalsCart = cart.data;
  const busy = cart.isPending || wallets.isPending || session.isPending;

  useEffect(() => {
    if (!quote) return;
    const timer = window.setTimeout(() => setQuoteExpired(true), 5 * 60_000);
    return () => window.clearTimeout(timer);
  }, [quote]);

  const connectMutation = useMutation({
    mutationFn: connectWallet,
    onSuccess: (connection) => {
      setConnected({ id: connection.id, walletId: connection.walletId, network: connection.network });
      setProblem("");
      setNotice("Carteira conectada à rede selecionada. Conexão simulada.");
    },
    onError: (error) => setProblem(errorMessage(error)),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectWallet,
    onSuccess: () => { setConnected(null); setNotice("Carteira desconectada."); },
    onError: (error) => setProblem(errorMessage(error)),
  });

  const quoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: (nextQuote) => { setQuote(nextQuote); setQuoteExpired(false); setProblem(""); },
    onError: (error) => setProblem(errorMessage(error)),
  });

  const orderMutation = useMutation({
    mutationFn: ({ input, key }: { input: OrderInput; key: string }) => submitOrder(input, key),
    onSuccess: async (order, variables) => {
      localStorage.setItem(`kurio-order-attempt:${userId}`, JSON.stringify({ key: variables.key, input: variables.input } satisfies Attempt));
      setRecoverAvailable(false);
      queryClient.setQueryData(["orders", order.id], order);
      await queryClient.invalidateQueries({ queryKey: ["cart", `user:${userId}`] });
      await navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    },
    onError: (error, variables) => {
      const details = errorDetails(error);
      if (details?.code === "QUOTE_CHANGED" && details.details?.quote) {
        setQuote(details.details.quote);
        setQuoteExpired(false);
        setNotice("Os valores foram atualizados. Revise-os e confirme novamente.");
        setStep("review");
      }
      setProblem(errorMessage(error));
      if (!axios.isAxiosError(error) || error.response === undefined || error.response.status >= 500) {
        localStorage.setItem(`kurio-order-attempt:${userId}`, JSON.stringify({ key: variables.key, input: variables.input } satisfies Attempt));
        setNotice("O resultado ainda não foi recebido. Recupere esta mesma tentativa para evitar um pedido duplicado.");
        setRecoverAvailable(true);
      } else {
        localStorage.removeItem(`kurio-order-attempt:${userId}`);
        setRecoverAvailable(false);
      }
    },
  });

  async function connectAndReview() {
    if (!selectedWallet || !cart.data) return;
    setProblem("");
    try {
      const connection = await connectMutation.mutateAsync({ walletId: selectedWallet.id, network, provider });
      setConnected({ id: connection.id, walletId: connection.walletId, network: connection.network });
      const nextQuote = await quoteMutation.mutateAsync({ cartVersion: cart.data.version, network });
      setQuote(nextQuote);
      setQuoteExpired(false);
      setStep("review");
      setNotice("Carteira conectada e cotação atualizada. Revise os valores e confirme a compra.");
    } catch {
      // Mutations expose the localized error inline.
    }
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    if (!selectedWallet || !canPrepare || !userId) return;
    if (!connectionIsCurrent || !quote || quoteExpired) {
      await connectAndReview();
      return;
    }
    const input: OrderInput = {
      quoteId: quote.id,
      quoteVersion: quote.version,
      walletId: selectedWallet.id,
      network,
      connectionId: connected.id,
      collector: {
        ...collector,
        displayName: collector.displayName.trim(),
        username: collector.username.trim(),
        email: collector.email.trim(),
        profileName: selectedWallet.profileName.trim(),
        ensName: collector.ensName?.trim() || null,
        referralCode: collector.referralCode?.trim() || null,
      },
    };
    const key = crypto.randomUUID();
    const attempt: Attempt = { key, input };
    localStorage.setItem(`kurio-order-attempt:${userId}`, JSON.stringify(attempt));
    setProblem("");
    orderMutation.mutate({ input, key });
  }

  async function recoverAttempt() {
    const saved = localStorage.getItem(`kurio-order-attempt:${userId}`);
    if (!saved) return;
    try {
      const attempt = JSON.parse(saved) as Attempt;
      const order = await readAttempt(attempt.key);
      await navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const attempt = JSON.parse(saved) as Attempt;
        orderMutation.mutate({ input: attempt.input, key: attempt.key });
      } else setProblem(errorMessage(error));
    }
  }

  if (busy) return <section className="py-10" role="status" aria-label="Carregando pagamento"><Skeleton className="mb-8 h-10 w-64" /><div className="grid gap-8 md:grid-cols-2"><Skeleton className="h-[560px]" /><Skeleton className="h-[560px]" /></div></section>;
  if (session.isError || cart.isError || wallets.isError) return <section className="py-10" role="alert">Não foi possível carregar os dados do pagamento. <Button variant="outline" onClick={() => { void cart.refetch(); void wallets.refetch(); }}>Tentar novamente</Button></section>;
  if (!cart.data || !totalsCart || !cart.data.items.length) return <section className="py-12 text-center"><h1 className="text-2xl font-semibold">Seu carrinho está vazio</h1><p className="mt-3 text-secondary">Adicione NFTs antes de iniciar o pagamento.</p><Button asChild className="mt-6"><Link to="/" search={defaultCatalog}>Explorar NFTs</Link></Button></section>;
  const updating = connectMutation.isPending || quoteMutation.isPending || orderMutation.isPending || disconnectMutation.isPending;
  const connectionIsCurrent = connected?.walletId === selectedWallet?.id && connected?.network === network;
  const canPrepare = Boolean(selectedWallet && collector.displayName.trim() && collector.username.trim() && collector.email.trim() && selectedWallet.profileName.trim());
  const canSubmit = Boolean(canPrepare && connectionIsCurrent && quote && !quoteExpired);
  const actionLabel = canSubmit ? "Confirmar compra" : "Revisar compra";
  const setCollectorField = (field: keyof Collector, value: string) => setCollector((current) => ({ ...current, [field]: value }));
  const chooseWallet = (wallet: Wallet) => {
    if (wallet.network !== network) return;
    setWalletId(wallet.id);
    setProvider(wallet.provider);
    setConnected(null);
    setQuote(null);
    setQuoteExpired(false);
  };
  const formFields = (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <Field id="collector-display-name" label="Nome de exibição" required value={collector.displayName} onChange={(value) => setCollectorField("displayName", value)} />
      <Field id="collector-username" label="Nome de usuário" required value={collector.username} onChange={(value) => setCollectorField("username", value)} />
      <div className="hidden text-sm md:block"><span className="block">Rede da compra</span><p className="mt-2 flex min-h-10 items-center rounded-md border border-input px-3">{networks.find((item) => item.id === network)?.label}</p><span className="mt-1 block text-xs text-secondary">Definida pelos NFTs deste grupo</span></div>
      <Field id="collector-profile-name" label="Nome do perfil" required value={selectedWallet?.profileName ?? ""} readOnly />
      <Field id="collector-wallet-address" label="Endereço da carteira" required value={selectedWallet?.address ?? ""} readOnly />
      <Field id="collector-ens-secondary" label="ENS ou carteira secundária (opcional)" value={wallets.data.find((wallet) => wallet.network === network && wallet.id !== selectedWallet?.id)?.ensName ?? ""} readOnly />
      <Field id="collector-wallet-type" label="Tipo de carteira" required value={providers.find((item) => item.id === selectedWallet?.provider)?.label ?? ""} readOnly />
      <Field id="collector-referral" label="Código de indicação (opcional)" value={collector.referralCode ?? ""} onChange={(value) => setCollectorField("referralCode", value)} />
      <Field id="collector-email" label="E-mail" required type="email" value={collector.email} onChange={(value) => setCollectorField("email", value)} />
      <Field id="collector-ens" label="Nome ENS (opcional)" value={collector.ensName ?? ""} onChange={(value) => setCollectorField("ensName", value)} />
      <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={selectedWallet?.slot === "secondary"} onChange={(event) => { const next = wallets.data.find((wallet) => wallet.network === network && wallet.slot === (event.target.checked ? "secondary" : "primary")); if (next) chooseWallet(next); }} disabled={!wallets.data.some((wallet) => wallet.network === network && wallet.slot !== selectedWallet?.slot)} className="size-4 accent-primary" />Usar outra carteira?</label>
      <label htmlFor="collector-note" className="block text-sm sm:col-span-2">Observação do colecionador (opcional)<textarea id="collector-note" maxLength={2000} value={collector.note} onChange={(event) => setCollectorField("note", event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-input bg-transparent px-4 py-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></label>
    </div>
  );

  const walletOptions = (
    <section aria-labelledby="saved-wallets-title" className="space-y-3 md:hidden">
      <h2 id="saved-wallets-title" className="font-semibold">Carteiras cadastradas</h2>
      <p className="text-sm text-secondary">Compatíveis com {networks.find((item) => item.id === network)?.label}</p>
      {wallets.data.filter((wallet) => wallet.network === network).map((wallet) => <WalletChoice key={wallet.id} wallet={wallet} selected={wallet.id === selectedWallet?.id} onSelect={() => chooseWallet(wallet)} />)}
    </section>
  );

  const paymentOptions = (
    <section aria-labelledby="provider-title" className="mt-6">
      <h2 id="provider-title" className="mb-3 font-semibold">Carteira e rede</h2>
      {selectedWallet ? <div className="space-y-2">{providers.map((item) => <label key={item.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 ${provider === item.id ? "border-primary bg-card" : "border-border"}`}><input type="radio" name="provider" value={item.id} checked={provider === item.id} onChange={() => { setProvider(item.id); setConnected(null); }} className="accent-primary" /><WalletCards aria-hidden="true" size={18} className="text-primary" /><span>{item.label}</span></label>)}</div> : <p className="rounded-lg border border-primary/40 p-4 text-sm">Você não tem uma carteira cadastrada em {networks.find((item) => item.id === network)?.label}. <Link to="/wallets" className="text-primary underline">Cadastrar carteira</Link></p>}
      {connectionIsCurrent && <Button type="button" variant="ghost" className="mt-1 w-full" disabled={updating} onClick={() => disconnectMutation.mutate(connected.id)}>Desconectar</Button>}
    </section>
  );

  const checkoutItems = cart.data.items.filter((item) => item.network === network);
  const checkoutTotals = cart.data.networkTotals[network] ?? { subtotal: "0", discount: "0", networkFee: "0", total: "0" };
  const checkoutCart: Cart = { ...cart.data, items: checkoutItems, totals: checkoutTotals, networkTotals: { [network]: checkoutTotals } };
  if (!checkoutItems.length) return <section className="py-12 text-center"><h1 className="text-2xl font-semibold">Não há NFTs nesta rede</h1><p className="mt-3 text-secondary">Este grupo do carrinho foi atualizado ou já foi finalizado.</p><Button asChild className="mt-6"><Link to="/cart">Voltar ao carrinho</Link></Button></section>;
  const summary = <OrderSummary cart={checkoutCart} quote={quote} />;
  const reviewPanel = (
    <section aria-labelledby="review-title" className="rounded-2xl border border-border bg-card p-5">
      <h2 id="review-title" className="text-lg font-semibold">Revisão da compra</h2>
      <p className="mt-2 text-sm text-secondary">Confira os NFTs, os dados do colecionador e a carteira antes de confirmar.</p>
      <div className="mt-5">{summary}</div>
      <p className="mt-4 text-sm"><strong>{collector.displayName}</strong><br />{collector.email}<br />{selectedWallet?.nickname} · {networks.find((item) => item.id === network)?.label}<br />{selectedWallet?.address}</p>
    </section>
  );

  return (
    <section className="py-6 md:py-10">
      <div className="mb-6 flex items-center gap-3 md:hidden"><Link to="/cart" aria-label="Voltar ao carrinho" className="inline-flex size-9 items-center justify-center rounded-full border border-border text-primary"><ArrowLeft size={18} /></Link><h1 className="text-xl font-semibold">Pagamento com carteira</h1></div>
      <nav aria-label="Caminho da página" className="mb-8 hidden text-sm md:block"><Link to="/" search={defaultCatalog}>Início</Link> / <Link to="/" search={defaultCatalog}>Mercado</Link> / <Link to="/cart">Carrinho</Link> / <span aria-current="page">Pagamento</span></nav>
      <h1 className="mb-6 hidden text-2xl font-semibold md:block">Pagamento</h1>
      <div className="mb-5 grid grid-cols-3 text-center text-xs font-semibold md:hidden" aria-label="Etapas do pagamento"><span className={step === "data" ? "text-primary" : "text-secondary"}>1. Dados</span><span className={step === "wallet" ? "text-primary" : "text-secondary"}>2. Carteira</span><span className={step === "review" ? "text-primary" : "text-secondary"}>3. Revisão</span></div>
      {problem && <div role="alert" className="mb-5 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{problem}{recoverAvailable && <button type="button" className="ml-2 underline" onClick={() => void recoverAttempt()}>Recuperar tentativa</button>}</div>}
      {notice && <p role="status" className="mb-5 rounded-md border border-primary/40 p-3 text-sm">{notice}{recoverAvailable && <button type="button" className="ml-2 underline" onClick={() => void recoverAttempt()}>Recuperar tentativa</button>}</p>}
      <form onSubmit={(event) => void placeOrder(event)}>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(350px,.75fr)] xl:gap-8">
          <div className={`${step === "data" ? "block" : "hidden"} md:block`}>
            <section aria-labelledby="collector-title">
              <h2 id="collector-title" className="mb-4 text-lg font-semibold">Perfil do colecionador</h2>
              {formFields}
            </section>
            <div className="mt-6 flex gap-3 md:hidden"><Button type="button" variant="outline" className="w-full" asChild><Link to="/cart">Voltar</Link></Button><Button type="button" className="w-full" onClick={(event) => { if (event.currentTarget.form?.reportValidity()) { setProblem(""); setStep("wallet"); } }}>Continuar</Button></div>
          </div>
          <div className="space-y-6">
            <div className={`${step === "review" ? "block" : "hidden"} md:block`}>
              <div className="hidden md:block">{summary}</div>
              {step === "review" && <div className="md:hidden">{reviewPanel}</div>}
              {step === "review" && <div className="mt-4 md:hidden"><Button type="button" variant="outline" className="w-full" onClick={() => setStep("wallet")}>Voltar à carteira</Button></div>}
              {connected && <p className="mt-4 text-sm text-secondary">Conectada por {providers.find((item) => item.id === provider)?.label}. Esta conexão é simulada.</p>}
              {quote && <p className="mt-2 text-xs text-muted-foreground">Cotação válida por cinco minutos. Revise os valores antes de enviar.</p>}
              {quoteExpired && <p role="alert" className="mt-2 text-sm text-destructive">Cotação expirada. Atualize e revise os valores antes de confirmar.</p>}
              {connected && (!quote || quoteExpired) && <Button type="button" variant="outline" className="mt-3 w-full" disabled={updating} onClick={() => void quoteMutation.mutateAsync({ cartVersion: cart.data.version, network }).catch(() => undefined)}>Atualizar cotação</Button>}
            </div>
            <div className={`${step === "wallet" ? "block" : "hidden"} md:block`}>
              {walletOptions}
              <div className="mt-5 rounded-lg border border-border p-3 text-sm md:hidden"><span className="font-medium">Rede desta compra</span><p className="mt-1 text-secondary">{networks.find((item) => item.id === network)?.label} · definida pelos NFTs deste grupo</p></div>
              {!selectedWallet && <div className="mt-4 rounded-lg border border-primary/40 p-4 text-sm" role="status">Você não tem uma carteira cadastrada em {networks.find((item) => item.id === network)?.label}. <Link to="/wallets" className="ml-1 text-primary underline">Cadastrar carteira</Link></div>}
              {paymentOptions}
              <div className="mt-3 md:hidden"><Button type="button" variant="ghost" className="w-full" onClick={() => setStep("data")}>Voltar aos dados</Button></div>
            </div>
            <Button type="submit" className={`${step === "data" ? "hidden" : "flex"} fixed inset-x-5 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 min-h-[60px] rounded-full text-base md:static md:mt-5 md:min-h-11 md:w-full md:rounded-md md:text-sm md:flex`} disabled={!canPrepare || updating || (step === "review" && !canSubmit)}>{orderMutation.isPending || connectMutation.isPending || quoteMutation.isPending ? <><LoaderCircle className="animate-spin" />{orderMutation.isPending ? "Enviando pedido…" : "Preparando revisão…"}</> : actionLabel}</Button>
          </div>
        </div>
      </form>
    </section>
  );
}
