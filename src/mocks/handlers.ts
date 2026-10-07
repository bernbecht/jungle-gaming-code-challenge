import { toSocketIo } from '@mswjs/socket.io-binding'
import { delay, http, HttpResponse, ws } from 'msw'
import { listNfts, parseCatalogParams, readNft } from './catalog'
import { advanceClock } from './commerce'
import { resetDatabase, transact } from './database'
import { invalid, MockError } from './errors'

// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching ws.link.
const socket = ws.link(window.location.origin.replace(/^http/, 'ws'))
let catalogNetwork = { delayMs: 0, failuresRemaining: 0 }
const closeSockets = new Set<() => void>()

async function respond<T extends object>(operation: () => Promise<T>) {
  try { return HttpResponse.json(await operation()) } catch (error) {
    if (error instanceof MockError) return HttpResponse.json(error.body, { status: error.status })
    console.error('Falha no mock de rede:', error)
    return HttpResponse.json({ error: { code: 'MOCK_FAILURE', message: 'Não foi possível executar a operação simulada.' } }, { status: 500 })
  }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown
  try { body = await request.json() } catch { throw new MockError(400, 'MALFORMED_REQUEST', 'JSON inválido.') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('O corpo deve ser um objeto JSON.')
  return body as Record<string, unknown>
}

export const handlers = [
  http.post('/api/__mock/catalog-network', ({ request }) => respond(async () => {
    const body = await readBody(request)
    const delayMs = body.delayMs ?? 0, failuresRemaining = body.failuresRemaining ?? 0
    if (typeof delayMs !== 'number' || !Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 10000) invalid('Latência inválida (0–10000 ms).')
    if (typeof failuresRemaining !== 'number' || !Number.isSafeInteger(failuresRemaining) || failuresRemaining < 0 || failuresRemaining > 10) invalid('Quantidade de falhas inválida (0–10).')
    catalogNetwork = { delayMs, failuresRemaining }
    return { ...catalogNetwork }
  })),
  http.get('/api/nfts', async ({ request }) => {
    const delayMs = catalogNetwork.delayMs
    const fail = catalogNetwork.failuresRemaining > 0
    if (fail) catalogNetwork.failuresRemaining--
    if (delayMs) await delay(delayMs)
    if (fail) return HttpResponse.json({ error: { code: 'TEMPORARY_FAILURE', message: 'Falha temporária do catálogo.' } }, { status: 503 })
    return respond(() => {
      const params = parseCatalogParams(new URL(request.url).searchParams)
      return transact(state => listNfts(state, params))
    })
  }),
  http.get('/api/nfts/facets', () => respond(() => transact(state => Object.fromEntries(['category', 'collection', 'creator', 'network'].map(key => [key, [...new Set(state.nfts.map(nft => nft[key as 'category' | 'collection' | 'creator' | 'network']))].sort()]))))),
  http.get('/api/nfts/:id', ({ params }) => respond(() => transact(state => readNft(state, String(params.id))))),
  http.get('/api/__mock/status', () => respond(() => transact(state => ({ schemaVersion: state.schemaVersion, scenarioId: state.scenarioId, now: new Date(state.now).toISOString(), nftCount: state.nfts.length, userCount: state.users.length })))),
  http.post('/api/__mock/reset', ({ request }) => respond(async () => {
    const body = await readBody(request)
    if (body.scenarioId !== undefined && body.scenarioId !== 'SCN-01') invalid('Somente SCN-01 está implementado nesta etapa.')
    if (body.seed !== undefined && body.seed !== 1) invalid('A fixture usa seed fixo 1.')
    const now = body.now === undefined ? undefined : typeof body.now === 'string' ? Date.parse(body.now) : NaN
    if (now !== undefined && (!Number.isFinite(now) || !Number.isSafeInteger(now))) invalid('Data de reset inválida.')
    await resetDatabase(now)
    catalogNetwork = { delayMs: 0, failuresRemaining: 0 }
    for (const close of closeSockets) close()
    closeSockets.clear()
    return { scenarioId: 'SCN-01', reset: true }
  })),
  http.post('/api/__mock/clock', ({ request }) => respond(async () => {
    const body = await readBody(request)
    const advanceMs = body.advanceMs
    if (typeof advanceMs !== 'number') invalid('Avanço de relógio inválido.')
    return transact(state => { const orders = advanceClock(state, advanceMs); return { now: new Date(state.now).toISOString(), resolvedOrderIds: orders.map(order => order.id) } })
  })),
  http.get('/api/__proof', () => HttpResponse.json({
    source: 'msw',
    transport: 'axios',
    scenario: 'SCN-01',
  })),
  socket.addEventListener('connection', (connection) => {
    const close = () => connection.client.close()
    closeSockets.add(close)
    connection.client.addEventListener('close', () => closeSockets.delete(close))
    const { client } = toSocketIo(connection)
    // The binding's `client` wrapper receives frames sent by socket.io-client
    // and sends mock frames back to that same client connection.
    client.on('proof.request', () => {
      client.emit('proof.event', { source: 'msw', transport: 'socket.io' })
    })
  }),
]
