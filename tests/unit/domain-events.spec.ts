import { expect, test } from '@playwright/test'
import type { Order, OrderUpdated } from '../../src/contracts/marketplace'
import { createFixtures } from '../../src/mocks/fixtures'
import { nftUpdatedEvent, orderUpdatedEvent } from '../../src/mocks/domain-events'
import { QueryClient } from '@tanstack/react-query'
import { clearPrivateQueriesForUser, isNftUpdatedEvent, isOrderUpdatedEvent, isPrivateQueryForUser, shouldApplyNftEvent, shouldApplyOrderEvent } from '../../src/features/realtime/domain-event-consumer'

const pendingOrder: Order = {
  id: 'order-event-test',
  userId: 'user-a',
  version: 1,
  status: 'pending',
  createdAt: '2026-01-15T12:00:00.000Z',
  updatedAt: '2026-01-15T12:00:00.000Z',
  declineReason: null,
  snapshot: {
    items: [],
    totals: { subtotal: '0', discount: '0', networkFee: '0', total: '0' },
    collector: { displayName: 'A', username: 'a', email: 'a@example.test', profileName: 'Main', ensName: null, referralCode: null, note: '' },
    walletAddress: `0x${'a'.repeat(40)}`,
    walletProvider: 'metamask',
    network: 'ethereum',
    couponCode: null,
  },
  transaction: null,
}

test('NFT event consumer validates coherent snapshots and only accepts newer versions', async () => {
  const state = await createFixtures()
  const nft = state.nfts[0]!
  const event = nftUpdatedEvent({ ...nft, version: nft.version + 1 }, new Date(state.now).toISOString())

  expect(isNftUpdatedEvent(event)).toBe(true)
  expect(isNftUpdatedEvent({ ...event, data: { nft: { ...event.data.nft, version: 9 } } })).toBe(false)
  expect(shouldApplyNftEvent(event, nft.version)).toBe(true)
  expect(shouldApplyNftEvent(event, event.version)).toBe(false)
  expect(shouldApplyNftEvent(event, event.version + 1)).toBe(false)
})

test('order event consumer enforces session identity, version order and terminal state', () => {
  const pending = orderUpdatedEvent(pendingOrder, 'session-a')
  const confirmedOrder = { ...pendingOrder, version: 2, status: 'confirmed' as const, updatedAt: '2026-01-15T12:00:01.000Z' }
  const confirmed: OrderUpdated = {
    ...pending,
    eventId: `order:${pending.resourceId}:v2`,
    version: 2,
    occurredAt: confirmedOrder.updatedAt,
    data: { order: confirmedOrder },
  }

  expect(isOrderUpdatedEvent(pending)).toBe(true)
  expect(shouldApplyOrderEvent(pending, undefined, 'user-a', 'session-a')).toBe(true)
  expect(shouldApplyOrderEvent(pending, undefined, 'user-b', 'session-a')).toBe(false)
  expect(shouldApplyOrderEvent(pending, undefined, 'user-a', 'session-b')).toBe(false)
  expect(shouldApplyOrderEvent(confirmed, pendingOrder, 'user-a', 'session-a')).toBe(true)
  expect(shouldApplyOrderEvent(pending, confirmedOrder, 'user-a', 'session-a')).toBe(false)
  expect(shouldApplyOrderEvent({ ...confirmed, version: 3 }, confirmedOrder, 'user-a', 'session-a')).toBe(false)
})

test('session cleanup targets only private query caches and preserves public catalog and guest cart', () => {
  expect(isPrivateQueryForUser(['cart', 'user:user-a'], 'user-a')).toBe(true)
  expect(isPrivateQueryForUser(['favorites', 'user-a'], 'user-a')).toBe(true)
  expect(isPrivateQueryForUser(['profile', 'user-a'], 'user-a')).toBe(true)
  expect(isPrivateQueryForUser(['wallets', 'user-a'], 'user-a')).toBe(true)
  expect(isPrivateQueryForUser(['orders', 'order-1'], 'user-a')).toBe(true)
  expect(isPrivateQueryForUser(['domain-events', 'order', 'order-1'], 'user-a')).toBe(true)
  expect(isPrivateQueryForUser(['cart', 'guest:guest-a'], 'user-a')).toBe(false)
  expect(isPrivateQueryForUser(['favorites', 'user-b'], 'user-a')).toBe(false)
  expect(isPrivateQueryForUser(['nfts', 'detail', 'nft-1'], 'user-a')).toBe(false)
  expect(isPrivateQueryForUser(['domain-events', 'nft', 'nft-1'], 'user-a')).toBe(false)
  expect(isPrivateQueryForUser(['orders', 'order-1'], '')).toBe(false)
})

test('session cleanup cancels and removes only the previous user private cache', () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(['cart', 'user:user-a'], { total: '1' })
  queryClient.setQueryData(['favorites', 'user-a'], { nftIds: ['nft-1'] })
  queryClient.setQueryData(['profile', 'user-a'], { displayName: 'A' })
  queryClient.setQueryData(['wallets', 'user-a'], [{ id: 'wallet-a' }])
  queryClient.setQueryData(['orders', 'order-a'], { userId: 'user-a' })
  queryClient.setQueryData(['domain-events', 'order', 'order-a'], { userId: 'user-a' })
  queryClient.setQueryData(['cart', 'user:user-b'], { total: '2' })
  queryClient.setQueryData(['cart', 'guest:guest-a'], { total: '3' })
  queryClient.setQueryData(['nfts', 'detail', 'nft-1'], { id: 'nft-1' })
  queryClient.setQueryData(['domain-events', 'nft', 'nft-1'], { resourceId: 'nft-1' })

  clearPrivateQueriesForUser(queryClient, 'user-a')

  expect(queryClient.getQueryData(['cart', 'user:user-a'])).toBeUndefined()
  expect(queryClient.getQueryData(['favorites', 'user-a'])).toBeUndefined()
  expect(queryClient.getQueryData(['profile', 'user-a'])).toBeUndefined()
  expect(queryClient.getQueryData(['wallets', 'user-a'])).toBeUndefined()
  expect(queryClient.getQueryData(['orders', 'order-a'])).toBeUndefined()
  expect(queryClient.getQueryData(['domain-events', 'order', 'order-a'])).toBeUndefined()
  expect(queryClient.getQueryData(['cart', 'user:user-b'])).toEqual({ total: '2' })
  expect(queryClient.getQueryData(['cart', 'guest:guest-a'])).toEqual({ total: '3' })
  expect(queryClient.getQueryData(['nfts', 'detail', 'nft-1'])).toEqual({ id: 'nft-1' })
  expect(queryClient.getQueryData(['domain-events', 'nft', 'nft-1'])).toEqual({ resourceId: 'nft-1' })
})
