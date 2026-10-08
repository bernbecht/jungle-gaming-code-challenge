import type { Nft, NftUpdated, Order, OrderUpdated } from '../../contracts/marketplace'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasEnvelope(value: unknown): value is Record<string, unknown> & {
  eventId: string
  resourceId: string
  version: number
  occurredAt: string
  data: Record<string, unknown>
} {
  return isRecord(value)
    && typeof value.eventId === 'string'
    && typeof value.resourceId === 'string'
    && Number.isSafeInteger(value.version) && Number(value.version) > 0
    && typeof value.occurredAt === 'string'
    && isRecord(value.data)
}

export function isNftUpdatedEvent(value: unknown): value is NftUpdated {
  if (!hasEnvelope(value) || !isRecord(value.data.nft)) return false
  const nft = value.data.nft as Partial<Nft>
  return value.eventId === `nft:${value.resourceId}:v${value.version}`
    && nft.id === value.resourceId && nft.version === value.version
    && Array.isArray(nft.editions)
    && nft.editions.every((edition: unknown) => isRecord(edition) && Number.isSafeInteger(edition.available))
}

export function isOrderUpdatedEvent(value: unknown): value is OrderUpdated {
  if (!hasEnvelope(value) || !isRecord(value.data.order)) return false
  const order = value.data.order as Partial<Order>
  return value.eventId === `order:${value.resourceId}:v${value.version}`
    && typeof value.userId === 'string' && typeof value.sessionId === 'string'
    && order.id === value.resourceId && order.version === value.version
    && order.userId === value.userId
    && (order.status === 'pending' || order.status === 'confirmed' || order.status === 'declined')
}

export function shouldApplyNftEvent(event: NftUpdated, currentVersion: number) {
  return event.version > currentVersion
}

export function shouldApplyOrderEvent(
  event: OrderUpdated,
  current: Order | undefined,
  userId: string,
  sessionId: string,
) {
  if (event.userId !== userId || event.sessionId !== sessionId) return false
  if (event.data.order.id !== event.resourceId || event.data.order.version !== event.version) return false
  if (!current) return true
  if (current.userId !== userId || current.version >= event.version) return false
  if (current.status !== 'pending' && current.status !== event.data.order.status) return false
  return true
}
