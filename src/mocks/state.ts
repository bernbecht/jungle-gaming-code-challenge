import type { ApiError, Network, Nft, Order, Profile, Quote, Wallet } from '../contracts/marketplace'

export const SCHEMA_VERSION = 5
export const BASE_TIME = Date.parse('2026-01-15T12:00:00Z')
export const DEFAULT_PAYMENT_DELAY_MS = 2_000
export type QuantityLot = { id: string; quantity: number }
export type StoredLine = { id: string; nftId: string; editionId: string; lots: QuantityLot[] }
export type StoredCart = { id: string; version: number; items: StoredLine[]; couponCode: string | null }
export type MergedGuestCart = { guestVersion: number; mergedAtVersion: number }
export type StoredUser = { profile: Profile; password: { salt: string; verifier: string; iterations: number } }
export type Connection = { id: string; userId: string; walletId: string; network: Network; provider: Wallet['provider']; active: boolean }
export type StoredQuote = { userId: string; quote: Quote; lots: Record<string, QuantityLot[]> }
export type StoredOrder = {
  order: Order; resolveAt: number; delayMs: number; outcome: 'confirmed' | 'declined'; cartId: string; sessionId?: string
  lots: Record<string, QuantityLot[]>; effectsApplied: boolean
}
export type PaymentSimulation = { delayMs: number; outcome: 'confirmed' | 'declined'; loseResponseOnce: boolean }
export type AttemptResult = { orderId: string } | { status: number; body: ApiError }
export type DatabaseState = {
  schemaVersion: number; sequence: number; scenarioId: 'SCN-01'; now: number
  nfts: Nft[]; users: StoredUser[]; wallets: Record<string, Wallet[]>
  favorites: Record<string, string[]>; carts: Record<string, StoredCart>
  mergedGuestCarts: Record<string, MergedGuestCart>
  sessions: Record<string, { id: string; userId: string; expiresAt: number }>
  connections: Record<string, Connection>; quotes: Record<string, StoredQuote>
  orders: Record<string, StoredOrder>
  attempts: Record<string, Record<string, { fingerprint: string; result: AttemptResult }>>
  coupons: Record<string, { discountBps: number; expiresAt: number }>
  networkFees: Record<Network, string>
  reservations: Record<string, { nftId: string; editionId: string; quantity: number }[]>
  paymentSimulation: PaymentSimulation
}

export function nextId(state: DatabaseState, prefix: string): string {
  state.sequence += 1
  return `${prefix}-${state.sequence}`
}
