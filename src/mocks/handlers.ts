import { toSocketIo } from '@mswjs/socket.io-binding'
import { delay, http, HttpResponse, ws } from 'msw'
import { catalogFacets, listNfts, parseCatalogParams, readNft } from './catalog'
import { advanceClock } from './commerce'
import { resetDatabase, transact } from './database'
import { invalid, MockError } from './errors'
import { login, logout, PASSWORD_ITERATIONS, passwordVerifier, readFavorites, register, requireSession, setFavorite } from './auth'

// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching ws.link.
const socket = ws.link(window.location.origin.replace(/^http/, 'ws'))
let catalogNetwork = { delayMs: 0, failuresRemaining: 0 }
let favoriteNetwork = { delayMs: 0, failuresRemaining: 0 }
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

function readToken(request: Request) {
  const authorization = request.headers.get('Authorization')
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
}

function stringField(body: Record<string, unknown>, name: string) {
  if (typeof body[name] !== 'string') invalid(`Campo ${name} inválido.`)
  return body[name] as string
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const input = { email: stringField(body, 'email'), password: stringField(body, 'password') }
    const user = await transact(state => state.users.find(candidate => candidate.profile.email.toLowerCase() === input.email.trim().toLowerCase()))
    const verifier = user ? await passwordVerifier(input.password, user.password.salt, user.password.iterations) : ''
    return transact(state => login(state, input, verifier))
  })),
  http.post('/api/auth/register', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const input = { username: stringField(body, 'username'), displayName: stringField(body, 'displayName'), email: stringField(body, 'email'), password: stringField(body, 'password') }
    const salt = crypto.randomUUID()
    const password = { salt, verifier: await passwordVerifier(input.password, salt, PASSWORD_ITERATIONS), iterations: PASSWORD_ITERATIONS }
    return transact(state => register(state, input, password))
  })),
  http.get('/api/auth/session', ({ request }) => respond(() => transact(state => requireSession(state, readToken(request)).session))),
  http.post('/api/auth/logout', ({ request }) => respond(() => transact(state => logout(state, readToken(request))))),
  http.get('/api/me/favorites', ({ request }) => respond(() => transact(state => {
    const { userId } = requireSession(state, readToken(request))
    return readFavorites(state, userId)
  }))),
  http.put('/api/me/favorites/:nftId', async ({ request, params }) => respond(async () => {
    const body = await readBody(request)
    if (typeof body.favorite !== 'boolean') invalid('Favorito inválido.')
    const token = readToken(request)
    const { userId } = await transact(state => requireSession(state, token))
    const fail = favoriteNetwork.failuresRemaining > 0
    if (fail) favoriteNetwork.failuresRemaining--
    if (favoriteNetwork.delayMs) await delay(favoriteNetwork.delayMs)
    if (fail) {
      throw new MockError(503, 'TRANSIENT_FAILURE', 'Falha temporária ao atualizar favoritos.')
    }
    return transact(state => {
      requireSession(state, token)
      return setFavorite(state, userId, String(params.nftId), body.favorite as boolean)
    })
  })),
  http.post('/api/__mock/catalog-network', ({ request }) => respond(async () => {
    const body = await readBody(request)
    const delayMs = body.delayMs ?? 0, failuresRemaining = body.failuresRemaining ?? 0
    if (typeof delayMs !== 'number' || !Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 10000) invalid('Latência inválida (0–10000 ms).')
    if (typeof failuresRemaining !== 'number' || !Number.isSafeInteger(failuresRemaining) || failuresRemaining < 0 || failuresRemaining > 10) invalid('Quantidade de falhas inválida (0–10).')
    catalogNetwork = { delayMs, failuresRemaining }
    return { ...catalogNetwork }
  })),
  http.post('/api/__mock/favorite-network', ({ request }) => respond(async () => {
    const body = await readBody(request)
    const delayMs = body.delayMs ?? 0
    const failuresRemaining = body.failuresRemaining ?? 0
    if (typeof delayMs !== 'number' || !Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 10000) invalid('Latência inválida (0–10000 ms).')
    if (typeof failuresRemaining !== 'number' || !Number.isSafeInteger(failuresRemaining) || failuresRemaining < 0 || failuresRemaining > 10) invalid('Quantidade de falhas inválida (0–10).')
    favoriteNetwork = { delayMs, failuresRemaining }
    return { ...favoriteNetwork }
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
  http.get('/api/nfts/facets', () => respond(() => transact(catalogFacets))),
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
    favoriteNetwork = { delayMs: 0, failuresRemaining: 0 }
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
