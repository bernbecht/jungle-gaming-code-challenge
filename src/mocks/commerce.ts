import type {
  Cart,
  CartLine,
  Network,
  Order,
  OrderInput,
  Quote,
} from "../contracts/marketplace";
import { assertQuantity, calculateTotals } from "../lib/money";
import { readNft } from "./catalog";
import { invalid, MockError } from "./errors";
import type { DatabaseState, StoredCart, StoredQuote } from "./state";
import { nextId } from "./state";

export const QUOTE_VALIDITY_MS = 5 * 60_000;
export const PAYMENT_DELAY_MS = 2_000;
export type Submission =
  | { order: Order; replayed: boolean }
  | { status: number; body: MockError["body"] };

function requireUser(state: DatabaseState, userId: string) {
  if (!state.users.some((user) => user.profile.id === userId))
    throw new MockError(401, "SESSION_INVALID", "Usuário inválido.");
}

export function getStoredCart(state: DatabaseState, owner: string): StoredCart {
  state.carts[owner] ??= {
    id: nextId(state, "cart"),
    version: 1,
    items: [],
    couponCode: null,
  };
  return state.carts[owner];
}

function assertCartVersion(cart: StoredCart, expectedVersion: number) {
  if (cart.version !== expectedVersion)
    throw new MockError(
      409,
      "VERSION_CONFLICT",
      "O carrinho foi atualizado. Consulte-o novamente.",
    );
}

export function addCartItem(
  state: DatabaseState,
  owner: string,
  input: {
    nftId: string;
    editionId: string;
    quantity: number;
    expectedVersion: number;
  },
): StoredCart {
  try {
    assertQuantity(input.quantity);
  } catch {
    invalid("Quantidade inválida.");
  }
  const cart = getStoredCart(state, owner);
  assertCartVersion(cart, input.expectedVersion);
  const nft = readNft(state, input.nftId);
  const edition = nft.editions.find((item) => item.id === input.editionId);
  if (!edition) throw new MockError(404, "NOT_FOUND", "Edição não encontrada.");
  let line = cart.items.find(
    (item) => item.nftId === input.nftId && item.editionId === input.editionId,
  );
  const current = line?.lots.reduce((sum, lot) => sum + lot.quantity, 0) ?? 0;
  if (current + input.quantity > edition.available)
    throw new MockError(409, "STOCK_CONFLICT", "Quantidade indisponível.");
  if (!line) {
    line = {
      id: nextId(state, "line"),
      nftId: nft.id,
      editionId: edition.id,
      lots: [],
    };
    cart.items.push(line);
  }
  line.lots.push({ id: nextId(state, "lot"), quantity: input.quantity });
  cart.version += 1;
  return cart;
}

function discountBps(state: DatabaseState, code: string | null): number {
  if (!code) return 0;
  const coupon = Object.hasOwn(state.coupons, code)
    ? state.coupons[code]
    : undefined;
  if (!coupon) throw new MockError(422, "COUPON_INVALID", "Cupom inválido.");
  if (coupon.expiresAt <= state.now)
    throw new MockError(422, "COUPON_EXPIRED", "Cupom expirado.");
  return coupon.discountBps;
}

export function readCart(
  state: DatabaseState,
  owner: string,
  network: Network = "ethereum",
): Cart {
  const cart = getStoredCart(state, owner);
  const items: CartLine[] = cart.items.map((line) => {
    const nft = readNft(state, line.nftId);
    const edition = nft.editions.find((item) => item.id === line.editionId);
    if (!edition)
      throw new MockError(404, "NOT_FOUND", "Edição não encontrada.");
    const quantity = line.lots.reduce((sum, lot) => sum + lot.quantity, 0);
    return {
      id: line.id,
      nftId: nft.id,
      editionId: edition.id,
      quantity,
      name: nft.name,
      imageUrl: nft.images[0]!.url,
      unitPrice: edition.unitPrice,
      available: edition.available,
      availability:
        edition.available === 0
          ? "unavailable"
          : edition.available < quantity
            ? "insufficient"
            : "available",
    };
  });
  const notices: Cart["notices"] = [];
  let discount = 0;
  try {
    discount = discountBps(state, cart.couponCode);
  } catch (error) {
    if (!(error instanceof MockError)) throw error;
    notices.push({ code: error.body.error.code, message: error.message });
  }
  const fee = state.networkFees[network];
  if (fee === undefined) invalid("Rede inválida.");
  return {
    id: cart.id,
    version: cart.version,
    items,
    couponCode: cart.couponCode,
    notices,
    totals: calculateTotals(items, fee, discount),
  };
}

export function createQuote(
  state: DatabaseState,
  userId: string,
  input: { cartVersion: number; network: Network },
): Quote {
  requireUser(state, userId);
  const storedCart = getStoredCart(state, `user:${userId}`);
  if (storedCart.version !== input.cartVersion)
    throw new MockError(409, "CART_CHANGED", "O carrinho foi atualizado.");
  const cart = readCart(state, `user:${userId}`, input.network);
  if (!cart.items.length) invalid("O carrinho está vazio.");
  discountBps(state, cart.couponCode);
  if (cart.items.some((line) => line.availability !== "available"))
    throw new MockError(409, "STOCK_CONFLICT", "Estoque insuficiente.");
  if (
    cart.items.some(
      (line) => readNft(state, line.nftId).network !== input.network,
    )
  )
    invalid("Todos os itens devem pertencer à rede selecionada.");
  const quote: Quote = {
    id: nextId(state, "quote"),
    version: 1,
    cartId: cart.id,
    cartVersion: cart.version,
    network: input.network,
    couponCode: cart.couponCode,
    expiresAt: new Date(state.now + QUOTE_VALIDITY_MS).toISOString(),
    items: cart.items,
    totals: cart.totals,
  };
  state.quotes[quote.id] = {
    userId,
    quote,
    lots: Object.fromEntries(
      storedCart.items.map((line) => [line.id, structuredClone(line.lots)]),
    ),
  };
  return structuredClone(quote);
}

/** Sort keys recursively so identical requests with different object key order replay. */
function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${fingerprint(item)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}

function validatePurchase(
  state: DatabaseState,
  userId: string,
  input: OrderInput,
): StoredQuote {
  const stored = state.quotes[input.quoteId];
  if (!stored) throw new MockError(404, "NOT_FOUND", "Cotação não encontrada.");
  if (stored.userId !== userId)
    throw new MockError(403, "FORBIDDEN", "Cotação de outro usuário.");
  const wallet = state.wallets[userId]?.find(
    (item) => item.id === input.walletId,
  );
  if (!wallet)
    throw new MockError(403, "FORBIDDEN", "Carteira não pertence ao usuário.");
  const connection = state.connections[input.connectionId];
  if (
    !connection?.active ||
    connection.userId !== userId ||
    connection.walletId !== wallet.id ||
    connection.network !== input.network ||
    wallet.network !== input.network
  )
    throw new MockError(
      409,
      "CONNECTION_REJECTED",
      "Conecte a carteira à rede selecionada.",
    );
  const collector = input.collector;
  if (
    !collector.displayName.trim() ||
    !collector.username.trim() ||
    !collector.profileName.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collector.email) ||
    collector.note.length > 2000
  )
    invalid("Dados do colecionador inválidos.");
  const cart = readCart(state, `user:${userId}`, input.network);
  discountBps(state, cart.couponCode);
  if (cart.items.some((item) => item.availability !== "available"))
    throw new MockError(409, "STOCK_CONFLICT", "Estoque insuficiente.");
  const quote = stored.quote;
  if (
    input.quoteVersion !== quote.version ||
    quote.network !== input.network ||
    Date.parse(quote.expiresAt) <= state.now ||
    cart.id !== quote.cartId ||
    cart.version !== quote.cartVersion ||
    cart.couponCode !== quote.couponCode ||
    fingerprint(cart.items) !== fingerprint(quote.items) ||
    fingerprint(cart.totals) !== fingerprint(quote.totals)
  ) {
    const replacement = createQuote(state, userId, {
      cartVersion: cart.version,
      network: input.network,
    });
    throw new MockError(
      409,
      "QUOTE_CHANGED",
      "Revise a nova cotação antes de confirmar.",
      { quote: replacement },
    );
  }
  return stored;
}

export function submitOrder(
  state: DatabaseState,
  userId: string,
  key: string,
  input: OrderInput,
  outcome: "confirmed" | "declined" = "confirmed",
): Submission {
  requireUser(state, userId);
  if (!key.trim() || key.length > 200)
    invalid("Chave de idempotência inválida.");
  const serialized = fingerprint(input);
  const attempts = (state.attempts[userId] ??= {});
  const previous = Object.hasOwn(attempts, key) ? attempts[key] : undefined;
  if (previous) {
    if (previous.fingerprint !== serialized)
      return {
        status: 409,
        body: {
          error: {
            code: "IDEMPOTENCY_CONFLICT",
            message: "A tentativa já foi registrada com outro conteúdo.",
          },
        },
      };
    if ("orderId" in previous.result)
      return {
        order: structuredClone(state.orders[previous.result.orderId]!.order),
        replayed: true,
      };
    return structuredClone(previous.result);
  }
  let storedQuote: StoredQuote;
  try {
    storedQuote = validatePurchase(state, userId, input);
  } catch (error) {
    if (!(error instanceof MockError)) throw error;
    const result = { status: error.status, body: error.body };
    Object.defineProperty(attempts, key, {
      value: { fingerprint: serialized, result },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    return structuredClone(result);
  }
  const quote = storedQuote.quote;
  const wallet = state.wallets[userId]!.find(
    (item) => item.id === input.walletId,
  )!;
  const now = new Date(state.now).toISOString();
  const order: Order = {
    id: nextId(state, "order"),
    userId,
    version: 1,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    declineReason: null,
    snapshot: structuredClone({
      items: quote.items,
      totals: quote.totals,
      collector: input.collector,
      walletAddress: wallet.address,
      network: input.network,
      couponCode: quote.couponCode,
    }),
    transaction: null,
  };
  state.orders[order.id] = {
    order,
    resolveAt: state.now + PAYMENT_DELAY_MS,
    outcome,
    cartId: quote.cartId,
    lots: structuredClone(storedQuote.lots),
    effectsApplied: false,
  };
  state.reservations[order.id] = quote.items.map((line) => ({
    nftId: line.nftId,
    editionId: line.editionId,
    quantity: line.quantity,
  }));
  for (const id of new Set(quote.items.map((line) => line.nftId)))
    state.nfts.find((nft) => nft.id === id)!.version += 1;
  Object.defineProperty(attempts, key, {
    value: { fingerprint: serialized, result: { orderId: order.id } },
    enumerable: true,
    configurable: true,
    writable: true,
  });
  return { order: structuredClone(order), replayed: false };
}

export function readOrder(
  state: DatabaseState,
  userId: string,
  id: string,
): Order {
  requireUser(state, userId);
  const stored = state.orders[id];
  if (!stored) throw new MockError(404, "NOT_FOUND", "Pedido não encontrado.");
  if (stored.order.userId !== userId)
    throw new MockError(403, "FORBIDDEN", "Pedido de outro usuário.");
  return structuredClone(stored.order);
}

export function settleOrder(state: DatabaseState, id: string): Order {
  const stored = state.orders[id];
  if (!stored) throw new MockError(404, "NOT_FOUND", "Pedido não encontrado.");
  if (stored.effectsApplied || stored.order.status !== "pending")
    return structuredClone(stored.order);
  const reservations = state.reservations[id] ?? [];
  if (stored.outcome === "confirmed") {
    for (const reserved of reservations) {
      const edition = state.nfts
        .find((nft) => nft.id === reserved.nftId)!
        .editions.find((item) => item.id === reserved.editionId)!;
      edition.available -= reserved.quantity;
    }
    const cart = state.carts[`user:${stored.order.userId}`];
    if (cart?.id === stored.cartId) {
      for (const line of cart.items) {
        const purchased = stored.lots[line.id] ?? [];
        for (const lot of line.lots)
          lot.quantity = Math.max(
            0,
            lot.quantity -
              (purchased.find((item) => item.id === lot.id)?.quantity ?? 0),
          );
        line.lots = line.lots.filter((lot) => lot.quantity > 0);
      }
      cart.items = cart.items.filter((line) => line.lots.length > 0);
      cart.version += 1;
    }
    stored.order.transaction = {
      reference: `simulated-${id}`,
      simulated: true,
      explorerUrl: null,
    };
  } else stored.order.declineReason = "Pagamento recusado na simulação.";
  delete state.reservations[id];
  for (const nftId of new Set(reservations.map((item) => item.nftId)))
    state.nfts.find((nft) => nft.id === nftId)!.version += 1;
  stored.effectsApplied = true;
  stored.order.status = stored.outcome;
  stored.order.version += 1;
  stored.order.updatedAt = new Date(state.now).toISOString();
  return structuredClone(stored.order);
}

export function advanceClock(state: DatabaseState, advanceMs: number): Order[] {
  if (
    !Number.isSafeInteger(advanceMs) ||
    advanceMs < 0 ||
    !Number.isSafeInteger(state.now + advanceMs) ||
    state.now + advanceMs > 8_640_000_000_000_000
  )
    invalid("Avanço de relógio inválido.");
  state.now += advanceMs;
  return Object.values(state.orders)
    .filter(
      (stored) =>
        stored.order.status === "pending" && stored.resolveAt <= state.now,
    )
    .map((stored) => settleOrder(state, stored.order.id));
}
