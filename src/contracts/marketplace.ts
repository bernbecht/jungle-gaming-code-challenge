/** Transport DTOs. ETH is always decimal text; resource versions are integers. */
export type Money = string
export type Network = 'ethereum' | 'polygon' | 'solana'
export type ApiError = { error: { code: string; message: string; fieldErrors?: Record<string, string[]>; details?: Record<string, unknown> } }
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number }
export type Edition = { id: string; label: string; unitPrice: Money; available: number }
export type Nft = {
  id: string; version: number; name: string; description: string; creator: string
  collection: string; category: string; network: Network; tokenId: string
  createdAt: string; featured: boolean; trending: boolean
  rating: { average: number; count: number }; attributes: { name: string; value: string }[]
  images: { url: string; alt: string }[]; editions: Edition[]
}
export type CatalogSort = 'featured' | 'recent' | 'price-asc' | 'price-desc' | 'name'
export type CatalogParams = {
  q: string; category: string[]; collection: string[]; creator: string[]; network: Network[]
  minPrice?: Money; maxPrice?: Money; availableOnly: boolean
  tab: 'all' | 'new' | 'trending'; sort: CatalogSort; page: number; pageSize: number
}
export type Profile = {
  id: string; version: number; username: string; displayName: string; email: string
  ensName: string | null; avatarUrl: string | null
}
export type Session = { id: string; user: Profile; expiresAt: string }
export type LoginInput = { email: string; password: string }
export type RegisterInput = { username: string; displayName: string; email: string; password: string }
export type AuthResponse = { token: string; session: Session }
export type Favorites = { userId: string; nftIds: string[] }
export type Wallet = {
  id: string; version: number; slot: 'primary' | 'secondary'; nickname: string
  profileName: string; address: string; network: Network
  provider: 'metamask' | 'walletconnect' | 'coinbase'; ensName: string | null; referralCode: string | null
}
export type Collector = {
  displayName: string; username: string; email: string; profileName: string
  ensName: string | null; referralCode: string | null; note: string
}
export type CartLine = {
  id: string; nftId: string; editionId: string; quantity: number; name: string
  imageUrl: string; unitPrice: Money; available: number
  availability: 'available' | 'insufficient' | 'unavailable'
}
export type Totals = { subtotal: Money; discount: Money; networkFee: Money; total: Money }
export type Cart = {
  id: string; version: number; items: CartLine[]; couponCode: string | null
  totals: Totals; notices: { code: string; message: string }[]
}
export type Quote = {
  id: string; version: number; cartId: string; cartVersion: number; network: Network
  couponCode: string | null; expiresAt: string; items: CartLine[]; totals: Totals
}
export type OrderInput = {
  quoteId: string; quoteVersion: number; walletId: string; network: Network
  connectionId: string; collector: Collector
}
export type Order = {
  id: string; userId: string; version: number; status: 'pending' | 'confirmed' | 'declined'
  createdAt: string; updatedAt: string; declineReason: string | null
  snapshot: { items: CartLine[]; totals: Totals; collector: Collector; walletAddress: string; network: Network; couponCode: string | null }
  transaction: { reference: string; simulated: true; explorerUrl: string | null } | null
}
export type ResourceEvent<T> = {
  eventId: string; resourceId: string; version: number; occurredAt: string; data: T
}
export type NftUpdated = ResourceEvent<{ nft: Nft }>
export type OrderUpdated = ResourceEvent<{ order: Order }> & { userId: string; sessionId: string }

export type CatalogFacets = {
  category: string[]
  collection: string[]
  creator: string[]
  network: string[]
  counts: { category: Record<string, number>; network: Record<string, number> }
  priceRange: { min: Money; max: Money }
}
