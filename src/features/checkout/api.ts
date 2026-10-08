import { queryOptions } from "@tanstack/react-query";
import type {
  Network,
  Order,
  OrderInput,
  Quote,
  Wallet,
  WalletConnection,
} from "@/contracts/marketplace";
import { http } from "@/lib/http";

export function walletsQuery(userId: string) {
  return queryOptions({
    queryKey: ["wallets", userId],
    queryFn: async ({ signal }) =>
      (await http.get<{ items: Wallet[] }>("/wallets", { signal })).data.items,
  });
}

export async function createQuote(input: {
  cartVersion: number;
  network: Network;
}) {
  return (await http.post<Quote>("/quotes", input)).data;
}

export async function connectWallet(input: {
  walletId: string;
  network: Network;
  provider: Wallet["provider"];
}) {
  return (await http.post<WalletConnection>("/wallet-connections", input)).data;
}

export async function disconnectWallet(connectionId: string) {
  await http.delete(`/wallet-connections/${encodeURIComponent(connectionId)}`);
}

export async function submitOrder(input: OrderInput, idempotencyKey: string) {
  return (
    await http.post<Order>("/orders", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    })
  ).data;
}

export async function readOrder(orderId: string, signal?: AbortSignal) {
  return (await http.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })).data;
}

export async function readAttempt(idempotencyKey: string, signal?: AbortSignal) {
  return (
    await http.get<{ order: Order }>(
      `/order-attempts/${encodeURIComponent(idempotencyKey)}`,
      { signal },
    )
  ).data.order;
}

export function orderQuery(orderId: string) {
  return queryOptions({
    queryKey: ["orders", orderId],
    queryFn: async ({ signal }) => readOrder(orderId, signal),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 750 : false,
  });
}
