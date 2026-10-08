import type {
  Cart,
  CartLine,
  Network,
  Order,
  OrderInput,
  Quote,
} from "../contracts/marketplace";
import { assertQuantity, calculateTotals, fromWei, toWei } from "../lib/money";
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

export function setCartQuantity(
  state: DatabaseState,
  owner: string,
  lineId: string,
  quantity: number,
  expectedVersion: number,
): StoredCart {
  try { assertQuantity(quantity) } catch { invalid("Quantidade inválida.") }
  const cart = getStoredCart(state, owner)
  assertCartVersion(cart, expectedVersion)
  const line = cart.items.find((item) => item.id === lineId)
  if (!line) throw new MockError(404, "NOT_FOUND", "Item não encontrado no carrinho.")
  const nft = readNft(state, line.nftId)
  const edition = nft.editions.find((item) => item.id === line.editionId)
  if (!edition) throw new MockError(404, "NOT_FOUND", "Edição não encontrada.")
  if (quantity > edition.available)
    throw new MockError(409, "STOCK_CONFLICT", "Quantidade indisponível.")
  const current = line.lots.reduce((sum, lot) => sum + lot.quantity, 0)
  if (quantity < current) {
    let toRemove = current - quantity
    for (let index = line.lots.length - 1; index >= 0 && toRemove > 0; index--) {
      const lot = line.lots[index]!
      const removed = Math.min(lot.quantity, toRemove)
      lot.quantity -= removed
      toRemove -= removed
    }
    line.lots = line.lots.filter((lot) => lot.quantity > 0)
  } else if (quantity > current) {
    line.lots.push({ id: nextId(state, "lot"), quantity: quantity - current })
  }
  cart.version += 1
  return cart
}

export function removeCartItem(state: DatabaseState, owner: string, lineId: string, expectedVersion: number): StoredCart {
  const cart = getStoredCart(state, owner)
  assertCartVersion(cart, expectedVersion)
  const index = cart.items.findIndex((item) => item.id === lineId)
  if (index < 0) throw new MockError(404, "NOT_FOUND", "Item não encontrado no carrinho.")
  cart.items.splice(index, 1)
  cart.version += 1
  return cart
}

export function setCartCoupon(state: DatabaseState, owner: string, code: string | null, expectedVersion: number): StoredCart {
  const cart = getStoredCart(state, owner)
  assertCartVersion(cart, expectedVersion)
  if (code) discountBps(state, code)
  if (cart.couponCode !== code) {
    cart.couponCode = code
    cart.version += 1
  }
  return cart
}

export function mergeGuestCart(state: DatabaseState, userId: string, guestId: string, guestVersion: number): Cart {
  requireUser(state, userId)
  if (!/^[a-z0-9-]{8,80}$/i.test(guestId)) invalid("Identificador de visitante inválido.")
  const owner = `guest:${guestId}`
  const guest = getStoredCart(state, owner)
  const previousMerge = state.mergedGuestCarts[guestId]
  if (previousMerge && previousMerge.guestVersion === guestVersion) {
    return { ...readCart(state, `user:${userId}`), notices: [{ code: "GUEST_CART_ALREADY_MERGED", message: "O carrinho de visitante já foi combinado." }] }
  }
  assertCartVersion(guest, guestVersion)
  const userCart = getStoredCart(state, `user:${userId}`)
  const notices: Cart["notices"] = []
  let changed = false
  for (const guestLine of guest.items) {
    const nft = state.nfts.find((item) => item.id === guestLine.nftId)
    const edition = nft?.editions.find((item) => item.id === guestLine.editionId)
    if (!nft || !edition) {
      notices.push({ code: "ITEM_UNAVAILABLE", message: "Um item indisponível não foi transferido." })
      continue
    }
    const currentEdition = readNft(state, nft.id).editions.find((item) => item.id === edition.id)
    if (!currentEdition) {
      notices.push({ code: "ITEM_UNAVAILABLE", message: `A edição de ${nft.name} não está mais disponível.` })
      continue
    }
    const quantity = guestLine.lots.reduce((sum, lot) => sum + lot.quantity, 0)
    const currentLine = userCart.items.find((item) => item.nftId === nft.id && item.editionId === edition.id)
    const current = currentLine?.lots.reduce((sum, lot) => sum + lot.quantity, 0) ?? 0
    const transferable = Math.max(0, Math.min(quantity, currentEdition.available - current))
    if (transferable > 0) {
      const target = currentLine ?? { id: nextId(state, "line"), nftId: nft.id, editionId: edition.id, lots: [] }
      if (!currentLine) userCart.items.push(target)
      let remaining = transferable
      for (const lot of guestLine.lots) {
        if (remaining === 0) break
        const moved = Math.min(lot.quantity, remaining)
        if (moved > 0) target.lots.push({ id: nextId(state, "lot"), quantity: moved })
        remaining -= moved
      }
      changed = true
    }
    if (transferable < quantity) notices.push({ code: "STOCK_CONFLICT", message: `A quantidade de ${nft.name} foi limitada ao estoque disponível.` })
  }
  if (guest.couponCode) {
    if (!userCart.couponCode) {
      try {
        discountBps(state, guest.couponCode)
        userCart.couponCode = guest.couponCode
        changed = true
      } catch (error) {
        notices.push({ code: error instanceof MockError ? error.body.error.code : "COUPON_INVALID", message: "O cupom do carrinho de visitante não foi transferido." })
      }
    } else if (guest.couponCode !== userCart.couponCode) {
      notices.push({ code: "COUPON_CONFLICT", message: "O cupom do carrinho de visitante não foi aplicado porque já existe outro cupom." })
    }
  }
  if (changed) userCart.version += 1
  const originalVersion = guest.version
  guest.items = []
  guest.couponCode = null
  guest.version += 1
  state.mergedGuestCarts[guestId] = { guestVersion: originalVersion, mergedAtVersion: userCart.version }
  return { ...readCart(state, `user:${userId}`), notices }
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
      editionLabel: edition.label,
      tokenId: nft.tokenId,
      quantity,
      name: nft.name,
      imageUrl: nft.images[0]!.url,
      unitPrice: edition.unitPrice,
      available: edition.available,
      network: nft.network,
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
  const networks = [...new Set(items.map((item) => item.network))];
  const networkTotals: Cart["networkTotals"] = {};
  for (const itemNetwork of networks) {
    const fee = state.networkFees[itemNetwork];
    if (fee === undefined) invalid("Rede inválida.");
    networkTotals[itemNetwork] = calculateTotals(
      items.filter((item) => item.network === itemNetwork),
      fee,
      discount,
    );
  }
  const requestedFee = state.networkFees[network];
  if (requestedFee === undefined) invalid("Rede inválida.");
  const networkTotalValues = Object.values(networkTotals);
  const totals = {
    subtotal: fromWei(networkTotalValues.reduce((total, value) => total + toWei(value!.subtotal), 0n)),
    discount: fromWei(networkTotalValues.reduce((total, value) => total + toWei(value!.discount), 0n)),
    networkFee: fromWei(networkTotalValues.reduce((total, value) => total + toWei(value!.networkFee), 0n)),
    total: fromWei(networkTotalValues.reduce((total, value) => total + toWei(value!.total), 0n)),
  };
  return {
    id: cart.id,
    version: cart.version,
    items,
    couponCode: cart.couponCode,
    notices,
    totals,
    networkTotals,
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
  const items = cart.items.filter((item) => item.network === input.network);
  if (!items.length) invalid("Não há NFTs do carrinho nesta rede.");
  discountBps(state, cart.couponCode);
  if (items.some((line) => line.availability !== "available"))
    throw new MockError(409, "STOCK_CONFLICT", "Estoque insuficiente.");
  const totals = cart.networkTotals[input.network];
  if (!totals) invalid("Não há NFTs do carrinho nesta rede.");
  const quote: Quote = {
    id: nextId(state, "quote"),
    version: 1,
    cartId: cart.id,
    cartVersion: cart.version,
    network: input.network,
    couponCode: cart.couponCode,
    expiresAt: new Date(state.now + QUOTE_VALIDITY_MS).toISOString(),
    items,
    totals,
  };
  state.quotes[quote.id] = {
    userId,
    quote,
    lots: Object.fromEntries(
      storedCart.items
        .filter((line) => items.some((item) => item.id === line.id))
        .map((line) => [line.id, structuredClone(line.lots)]),
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
  const fullCart = readCart(state, `user:${userId}`, input.network);
  const cartItems = fullCart.items.filter((item) => item.network === input.network);
  const cartTotals = fullCart.networkTotals[input.network];
  discountBps(state, fullCart.couponCode);
  if (cartItems.some((item) => item.availability !== "available"))
    throw new MockError(409, "STOCK_CONFLICT", "Estoque insuficiente.");
  const quote = stored.quote;
  if (
    input.quoteVersion !== quote.version ||
    quote.network !== input.network ||
    Date.parse(quote.expiresAt) <= state.now ||
    fullCart.id !== quote.cartId ||
    fullCart.version !== quote.cartVersion ||
    fullCart.couponCode !== quote.couponCode ||
    fingerprint(cartItems) !== fingerprint(quote.items) ||
    fingerprint(cartTotals) !== fingerprint(quote.totals)
  ) {
    const replacement = createQuote(state, userId, {
      cartVersion: fullCart.version,
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
  const connection = state.connections[input.connectionId]!;
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
      walletProvider: connection.provider,
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
