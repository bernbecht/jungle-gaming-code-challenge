import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

type ObservedEvent = {
  name: string
  payload: { eventId: string; resourceId: string; version: number; userId?: string; sessionId?: string; data: { nft?: { id: string; version: number; editions: { available: number }[] }; order?: { id: string; version: number; status: string } } }
  persisted: { id: string; version: number; status?: string; editions?: { available: number }[] }
}

test('NFT and private order events are emitted after their IndexedDB changes commit', async ({ page }) => {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  const socketClientScript = await readFile(new URL('../../node_modules/socket.io-client/dist/socket.io.js', import.meta.url), 'utf8')
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!reset.ok) throw new Error(`Could not reset the domain-event scenario (${reset.status}): ${await reset.text()}`)
  })
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill('collector-a@example.test')
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  await page.addScriptTag({ content: socketClientScript })

  await page.evaluate(async () => {
    const token = sessionStorage.getItem('kurio-session-token')
    if (!token) throw new Error('The authenticated session token is missing')
    type EventWindow = Window & { __domainEvents?: ObservedEvent[]; __domainSocket?: import('socket.io-client').Socket }
    const target = window as EventWindow
    target.__domainEvents = []
    const io = (window as Window & { io?: typeof import('socket.io-client').io }).io
    if (!io) throw new Error('Socket.IO browser bundle was not loaded')
    const socket = io(window.location.origin, { path: '/socket.io/', transports: ['websocket'] })
    target.__domainSocket = socket
    const observe = (name: string) => (payload: ObservedEvent['payload']) => {
      void fetch(`/api/${name === 'nft.updated' ? `nfts/${payload.resourceId}` : `orders/${payload.resourceId}`}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => response.json())
        .then(persisted => target.__domainEvents!.push({ name, payload, persisted }))
    }
    socket.on('nft.updated', observe('nft.updated'))
    socket.on('order.updated', observe('order.updated'))
    await new Promise<void>((resolve, reject) => {
      let stage = 'connect'
      const timeout = window.setTimeout(() => reject(new Error(`Socket timed out during ${stage}`)), 5000)
      socket.once('session.authenticated', () => { window.clearTimeout(timeout); resolve() })
      socket.once('session.authenticationFailed', (payload: { code?: string }) => {
        window.clearTimeout(timeout)
        reject(new Error(`Socket authentication rejected (${payload.code ?? 'unknown'})`))
      })
      socket.once('connect_error', error => { window.clearTimeout(timeout); reject(new Error(`Socket connection failed (${error.message})`)) })
      socket.once('connect', () => {
        stage = 'proof response'
        socket.once('proof.event', () => {
          stage = 'session authentication'
          socket.emit('session.authenticate', { token })
        })
        socket.emit('proof.request')
      })
    })
  })

  const orderId = await page.evaluate(async () => {
    const token = sessionStorage.getItem('kurio-session-token')!
    const request = async (path: string, method = 'GET', body?: unknown, extraHeaders: Record<string, string> = {}) => {
      const response = await fetch(`/api/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extraHeaders },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(result)}`)
      return result
    }

    await request('__mock/payment', 'POST', { outcome: 'confirmed', delayMs: 500 })
    const cart = await request('cart/items', 'POST', { nftId: 'nft-001', editionId: 'nft-001-limited', quantity: 1, expectedVersion: 1 })
    const connection = await request('wallet-connections', 'POST', { walletId: 'wallet-a-main', network: 'ethereum', provider: 'metamask' })
    const quote = await request('quotes', 'POST', { cartVersion: cart.version, network: 'ethereum' })
    const order = await request('orders', 'POST', {
      quoteId: quote.id,
      quoteVersion: quote.version,
      walletId: 'wallet-a-main',
      network: 'ethereum',
      connectionId: connection.id,
      collector: { displayName: 'Collector A', username: 'collector-a', email: 'collector-a@example.test', profileName: 'Principal', ensName: null, referralCode: null, note: '' },
    }, { 'Idempotency-Key': 'domain-event-order' })
    return order.id as string
  })
  expect(orderId).toMatch(/^order-/)
  await expect.poll(async () => page.evaluate(() => (window as Window & { __domainEvents?: ObservedEvent[] }).__domainEvents?.filter(event => event.name === 'order.updated' && event.payload.data.order?.status === 'confirmed').length ?? 0)).toBe(1)
  const events = await page.evaluate(() => (window as Window & { __domainEvents?: ObservedEvent[] }).__domainEvents ?? [])
  const pendingOrder = events.find(event => event.name === 'order.updated' && event.payload.data.order?.status === 'pending')
  const confirmedOrder = events.find(event => event.name === 'order.updated' && event.payload.data.order?.status === 'confirmed')
  expect(pendingOrder?.payload).toMatchObject({ userId: 'user-a', sessionId: expect.any(String), version: 1, data: { order: { status: 'pending' } } })
  expect(pendingOrder?.persisted).toMatchObject({ id: pendingOrder?.payload.resourceId, version: 1, status: 'pending' })
  expect(confirmedOrder?.payload).toMatchObject({ userId: 'user-a', sessionId: pendingOrder?.payload.sessionId, version: 2, data: { order: { status: 'confirmed' } } })
  expect(confirmedOrder?.persisted).toMatchObject({ id: confirmedOrder?.payload.resourceId, version: 2, status: 'confirmed' })

  const nftEvents = events.filter(event => event.name === 'nft.updated' && event.payload.resourceId === 'nft-001')
  expect(nftEvents.length).toBeGreaterThanOrEqual(2)
  for (const event of nftEvents) {
    expect(event.payload.eventId).toBe(`nft:${event.payload.resourceId}:v${event.payload.version}`)
    expect(event.payload.data.nft).toMatchObject({ id: 'nft-001', version: event.payload.version })
    expect(event.persisted).toMatchObject({ id: 'nft-001', version: event.payload.version })
  }
  await page.goto(`/orders/${orderId}`)
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await page.evaluate(() => (window as Window & { __domainSocket?: import('socket.io-client').Socket }).__domainSocket?.disconnect())
})
