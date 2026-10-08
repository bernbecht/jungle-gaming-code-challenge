import type { Nft, NftUpdated, Order, OrderUpdated } from '../contracts/marketplace'

/** Event identity is stable for a given resource version, so a replay is deduplicable. */
export function nftUpdatedEvent(nft: Nft, occurredAt: string): NftUpdated {
  return {
    eventId: `nft:${nft.id}:v${nft.version}`,
    resourceId: nft.id,
    version: nft.version,
    occurredAt,
    data: { nft: structuredClone(nft) },
  }
}

export function orderUpdatedEvent(order: Order, sessionId: string): OrderUpdated {
  return {
    eventId: `order:${order.id}:v${order.version}`,
    resourceId: order.id,
    version: order.version,
    occurredAt: order.updatedAt,
    data: { order: structuredClone(order) },
    userId: order.userId,
    sessionId,
  }
}
