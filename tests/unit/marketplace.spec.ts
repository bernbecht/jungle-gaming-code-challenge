import { expect, test } from '@playwright/test'
import type { OrderInput, Quote } from '../../src/contracts/marketplace'
import { calculateTotals, fromWei, toWei } from '../../src/lib/money'
import { catalogFacets, listNfts, parseCatalogParams, readNft } from '../../src/mocks/catalog'
import { addCartItem, advanceClock, createQuote, getStoredCart, mergeGuestCart, readCart, readOrder, removeCartItem, setCartCoupon, setCartQuantity, settleOrder, submitOrder } from '../../src/mocks/commerce'
import { createFixtures } from '../../src/mocks/fixtures'
import { BASE_TIME } from '../../src/mocks/state'
import type { DatabaseState } from '../../src/mocks/state'

const collector = { displayName: 'Collector A', username: 'collector-a', email: 'collector-a@example.test', profileName: 'Principal', ensName: null, referralCode: null, note: '' }

function connect(state: DatabaseState, userId = 'user-a') {
  const walletId = userId === 'user-a' ? 'wallet-a-main' : 'wallet-b-main'
  state.connections[`connection-${userId}`] = { id: `connection-${userId}`, userId, walletId, network: 'ethereum', active: true }
  return { walletId, connectionId: `connection-${userId}` }
}

async function purchase() {
  const state = await createFixtures()
  const connection = connect(state)
  addCartItem(state, 'user:user-a', { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 2, expectedVersion: 1 })
  const quote = createQuote(state, 'user-a', { cartVersion: 2, network: 'ethereum' })
  const input: OrderInput = { quoteId: quote.id, quoteVersion: quote.version, network: 'ethereum', collector, ...connection }
  return { state, input, quote }
}

test('calculates ETH exactly down to one wei and floors basis-point discounts', () => {
  expect(toWei('0.000000000000000001')).toBe(1n)
  expect(fromWei(1000000000000000001n)).toBe('1.000000000000000001')
  expect(calculateTotals([{ unitPrice: '0.1', quantity: 3 }, { unitPrice: '0.2', quantity: 1 }], '0.001', 1000)).toEqual({ subtotal: '0.5', discount: '0.05', networkFee: '0.001', total: '0.451' })
  expect(calculateTotals([{ unitPrice: '0.000000000000000003', quantity: 1 }], '0', 3333).discount).toBe('0')
  for (const invalid of ['-1', '1e-3', 'NaN', '01', '1.', '0.0000000000000000001']) expect(() => toWei(invalid)).toThrow()
  expect(() => calculateTotals([{ unitPrice: '1', quantity: 1.5 }], '0')).toThrow()
})

test('fixtures have stable IDs, distinct private resources and no stored plaintext password', async () => {
  const state = await createFixtures()
  expect(state.nfts).toHaveLength(36)
  expect(new Set(state.nfts.map(nft => nft.id)).size).toBe(36)
  expect(state.users).toHaveLength(2)
  expect(state.favorites['user-a']).not.toEqual(state.favorites['user-b'])
  expect(JSON.stringify(state)).not.toContain('DemoNft!2026')
  expect(state.users[0]!.password.verifier).not.toBe(state.users[1]!.password.verifier)
})

test('catalog combines dimensions, paginates, sorts and returns an empty result', async () => {
  const state = await createFixtures()
  const params = parseCatalogParams(new URLSearchParams('network=ethereum&category=Arte+digital&availableOnly=true&sort=price-asc&pageSize=2'))
  const page = listNfts(state, params)
  expect(page.total).toBeGreaterThan(2)
  expect(page.items).toHaveLength(2)
  expect(page.items.every(nft => nft.network === 'ethereum' && nft.category === 'Arte digital')).toBe(true)
  const second = listNfts(state, { ...params, page: 2 })
  expect(second.items[0]!.id).not.toBe(page.items[0]!.id)
  expect(listNfts(state, { ...params, q: 'absent-collection' }).total).toBe(0)
  expect(listNfts(state, { ...params, page: 100 }).items).toEqual([])
  expect(() => parseCatalogParams(new URLSearchParams('minPrice=2&maxPrice=1'))).toThrow()
  expect(() => parseCatalogParams(new URLSearchParams('pageSize=49'))).toThrow()
  expect(() => parseCatalogParams(new URLSearchParams('network=unknown'))).toThrow()
  expect(() => readNft(state, 'absent')).toThrow()
})

test('order replay ignores its own reservation and canonicalizes object field order', async () => {
  const { state, input } = await purchase()
  const first = submitOrder(state, 'user-a', '__proto__', input)
  const again = submitOrder(state, 'user-a', '__proto__', { ...input, collector: { note: '', referralCode: null, ensName: null, profileName: 'Principal', email: collector.email, username: collector.username, displayName: collector.displayName } })
  expect('order' in first && 'order' in again && first.order.id === again.order.id).toBe(true)
  expect('replayed' in again && again.replayed).toBe(true)
  expect(Object.keys(state.orders)).toHaveLength(1)
  expect(readNft(state, 'nft-001').editions[1]!.available).toBe(8)
  const different = submitOrder(state, 'user-a', '__proto__', { ...input, collector: { ...collector, note: 'changed' } })
  expect('body' in different && different.body.error.code).toBe('IDEMPOTENCY_CONFLICT')
})

test('changed fee requires a new quote and persists the failed attempt', async () => {
  const { state, input } = await purchase()
  state.networkFees.ethereum = '0.002'
  const conflict = submitOrder(state, 'user-a', 'attempt-1', input)
  expect('body' in conflict && conflict.body.error.code).toBe('QUOTE_CHANGED')
  expect(Object.keys(state.orders)).toHaveLength(0)
  expect(submitOrder(state, 'user-a', 'attempt-1', input)).toEqual(conflict)
  const replacement = ('body' in conflict ? conflict.body.error.details?.quote : undefined) as Quote
  expect(replacement.totals.networkFee).toBe('0.002')
  const accepted = submitOrder(state, 'user-a', 'attempt-2', { ...input, quoteId: replacement.id, quoteVersion: replacement.version })
  expect('order' in accepted).toBe(true)
})

test('price and availability changes require another explicit quote review', async () => {
  for (const change of ['price', 'availability']) {
    const { state, input } = await purchase()
    const edition = state.nfts[0]!.editions[1]!
    if (change === 'price') edition.unitPrice = '0.02'
    else edition.available = 9
    const result = submitOrder(state, 'user-a', change, input)
    expect('body' in result && result.body.error.code).toBe('QUOTE_CHANGED')
    expect(Object.keys(state.orders)).toHaveLength(0)
  }
})

test('expired quotes and disconnected wallets cannot create an order', async () => {
  const { state, input } = await purchase()
  state.connections[input.connectionId]!.active = false
  const disconnected = submitOrder(state, 'user-a', 'disconnected', input)
  expect('body' in disconnected && disconnected.body.error.code).toBe('CONNECTION_REJECTED')
  state.connections[input.connectionId]!.active = true
  advanceClock(state, 300_000)
  const expired = submitOrder(state, 'user-a', 'expired', input)
  expect('body' in expired && expired.body.error.code).toBe('QUOTE_CHANGED')
  expect(Object.keys(state.orders)).toHaveLength(0)
})

test('confirmation removes captured quantities once and preserves later additions', async () => {
  const { state, input } = await purchase()
  const submitted = submitOrder(state, 'user-a', 'confirm', input)
  if (!('order' in submitted)) throw new Error('Expected order')
  addCartItem(state, 'user:user-a', { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 1, expectedVersion: 2 })
  expect(advanceClock(state, 2_000)).toHaveLength(1)
  expect(readCart(state, 'user:user-a').items[0]!.quantity).toBe(1)
  const confirmed = readOrder(state, 'user-a', submitted.order.id)
  expect(confirmed.status).toBe('confirmed')
  expect(confirmed.transaction?.simulated).toBe(true)
  expect(settleOrder(state, confirmed.id)).toEqual(confirmed)
  expect(advanceClock(state, 10_000)).toEqual([])
  expect(readNft(state, 'nft-001').editions[1]!.available).toBe(8)
  state.nfts[0]!.editions[1]!.unitPrice = '5'
  expect(readOrder(state, 'user-a', confirmed.id).snapshot.totals).toEqual(confirmed.snapshot.totals)
  expect(() => readOrder(state, 'user-b', confirmed.id)).toThrow()
})

test('removing and re-adding a line during pending keeps the new line', async () => {
  const { state, input } = await purchase()
  submitOrder(state, 'user-a', 'removed-line', input)
  const cart = getStoredCart(state, 'user:user-a')
  cart.items = []
  cart.version += 1
  addCartItem(state, 'user:user-a', { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 1, expectedVersion: 3 })
  advanceClock(state, 2_000)
  expect(readCart(state, 'user:user-a').items[0]!.quantity).toBe(1)
})

test('declining preserves the cart and releases reserved inventory only once', async () => {
  const { state, input } = await purchase()
  const result = submitOrder(state, 'user-a', 'decline', input, 'declined')
  if (!('order' in result)) throw new Error('Expected order')
  advanceClock(state, 2_000)
  expect(readCart(state, 'user:user-a').items[0]!.quantity).toBe(2)
  expect(readNft(state, 'nft-001').editions[1]!.available).toBe(10)
  const order = readOrder(state, 'user-a', result.order.id)
  expect(order.status).toBe('declined')
  expect(order.transaction).toBeNull()
  expect(settleOrder(state, order.id)).toEqual(order)
})

test('two buyers cannot reserve the last edition at the same time', async () => {
  const state = await createFixtures()
  const inputs: OrderInput[] = []
  for (const userId of ['user-a', 'user-b']) {
    const connection = connect(state, userId)
    addCartItem(state, `user:${userId}`, { nftId: 'nft-001', editionId: 'nft-001-unique', quantity: 1, expectedVersion: 1 })
    const quote = createQuote(state, userId, { cartVersion: 2, network: 'ethereum' })
    inputs.push({ quoteId: quote.id, quoteVersion: 1, network: 'ethereum', collector, ...connection })
  }
  expect('order' in submitOrder(state, 'user-a', 'last-unit-a', inputs[0]!)).toBe(true)
  const failed = submitOrder(state, 'user-b', 'last-unit-b', inputs[1]!)
  expect('body' in failed && failed.body.error.code).toBe('STOCK_CONFLICT')
  expect(Object.keys(state.orders)).toHaveLength(1)
  expect(readNft(state, 'nft-001').editions[0]!.available).toBe(0)
})

test('expired or unknown coupon is rejected by quote creation without changing the cart', async () => {
  const { state } = await purchase()
  const cart = getStoredCart(state, 'user:user-a')
  for (const code of ['EXPIRED', 'UNKNOWN', 'toString']) {
    cart.couponCode = code
    expect(() => createQuote(state, 'user-a', { cartVersion: cart.version, network: 'ethereum' })).toThrow()
    expect(readCart(state, 'user:user-a').totals.discount).toBe('0')
  }
  expect(state.now).toBe(BASE_TIME)
})

test('cart quantity changes respect stock, exact coupons, removal and optimistic versions', async () => {
  const state = await createFixtures()
  addCartItem(state, 'guest:guest-test-0001', { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 2, expectedVersion: 1 })
  const cart = readCart(state, 'guest:guest-test-0001')
  expect(cart.items[0]!.quantity).toBe(2)
  const updated = setCartQuantity(state, 'guest:guest-test-0001', cart.items[0]!.id, 4, cart.version)
  const staleVersion = updated.version
  expect(readCart(state, 'guest:guest-test-0001').items[0]!.quantity).toBe(4)
  expect(() => setCartQuantity(state, 'guest:guest-test-0001', cart.items[0]!.id, 11, updated.version)).toThrow(/Quantidade indisponível/)
  const discounted = setCartCoupon(state, 'guest:guest-test-0001', 'NFT10', updated.version)
  expect(readCart(state, 'guest:guest-test-0001').totals.discount).toBe('0.004')
  expect(() => setCartCoupon(state, 'guest:guest-test-0001', 'EXPIRED', discounted.version)).toThrow(/Cupom expirado/)
  expect(() => removeCartItem(state, 'guest:guest-test-0001', cart.items[0]!.id, staleVersion)).toThrow(/atualizado/)
  const discountedVersion = discounted.version
  const removed = removeCartItem(state, 'guest:guest-test-0001', cart.items[0]!.id, discounted.version)
  expect(readCart(state, 'guest:guest-test-0001').items).toEqual([])
  expect(removed.version).toBe(discountedVersion + 1)
})

test('guest cart merge is idempotent and reports inventory limits', async () => {
  const state = await createFixtures()
  const guestId = 'guest-test-0001'
  addCartItem(state, `guest:${guestId}`, { nftId: 'nft-001', editionId: 'nft-001-unique', quantity: 1, expectedVersion: 1 })
  addCartItem(state, `guest:${guestId}`, { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 8, expectedVersion: 2 })
  addCartItem(state, 'user:user-a', { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 4, expectedVersion: 1 })
  const merged = mergeGuestCart(state, 'user-a', guestId, 3)
  expect(merged.items.find((item) => item.editionId.endsWith('limited'))?.quantity).toBe(10)
  expect(merged.notices.some((notice) => notice.code === 'STOCK_CONFLICT')).toBe(true)
  const repeated = mergeGuestCart(state, 'user-a', guestId, 3)
  expect(repeated.items.find((item) => item.editionId.endsWith('limited'))?.quantity).toBe(10)
  expect(repeated.notices[0]?.code).toBe('GUEST_CART_ALREADY_MERGED')
  expect(readCart(state, `guest:${guestId}`).items).toEqual([])
})

test('facet counts represent NFTs once and follow changes to catalog categories and networks', async () => {
  const state = await createFixtures()
  const initial = catalogFacets(state)
  expect(initial.counts.category).toEqual({ 'Arte digital': 12, Fotografia: 12, Generativa: 12 })
  expect(initial.counts.network).toEqual({ ethereum: 12, polygon: 12, solana: 12 })
  state.nfts[0]!.network = 'polygon'
  state.nfts[0]!.category = 'Fotografia'
  const updated = catalogFacets(state)
  expect(updated.counts.network).toEqual({ ethereum: 11, polygon: 13, solana: 12 })
  expect(updated.counts.category).toEqual({ 'Arte digital': 11, Fotografia: 13, Generativa: 12 })
  expect(Object.values(updated.counts.category).reduce((sum, count) => sum + count, 0)).toBe(36)
})
