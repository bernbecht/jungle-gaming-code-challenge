import { toSocketIo } from '@mswjs/socket.io-binding'
import { delay, http, HttpResponse, ws } from 'msw'
import { catalogFacets, listNfts, parseCatalogParams, readNft } from './catalog'
import { addCartItem, advanceClock, createQuote, mergeGuestCart, readCart, readOrder, removeCartItem, setCartCoupon, setCartQuantity, settleOrder, submitOrder, PAYMENT_DELAY_MS } from './commerce'
import { resetDatabase, transact } from './database'
import { invalid, MockError } from './errors'
import { AVATAR_MAX_BYTES, AVATAR_TYPES, changePassword, login, logout, PASSWORD_ITERATIONS, passwordVerifier, readFavorites, register, requireSession, setFavorite, updateAvatar, updateProfile } from './auth'
import type { Network, OrderInput } from '../contracts/marketplace'

const scheduledOrders = new Set<string>()

function scheduleOrderResolution(orderId: string, delayMs: number) {
  if (scheduledOrders.has(orderId)) return
  scheduledOrders.add(orderId)
  setTimeout(() => {
    void transact(state => settleOrder(state, orderId)).catch(() => undefined).finally(() => scheduledOrders.delete(orderId))
  }, delayMs)
}

function validNetwork(value: unknown): value is Network {
  return value === 'ethereum' || value === 'polygon' || value === 'solana'
}

function parseOrderInput(body: Record<string, unknown>): OrderInput {
  const collector = body.collector
  if (!collector || typeof collector !== 'object' || Array.isArray(collector)) invalid('Dados do colecionador inválidos.')
  const data = collector as Record<string, unknown>
  const optionalText = (value: unknown, field: string) => {
    if (value === null || value === undefined) return null
    if (typeof value !== 'string') invalid(`Campo ${field} inválido.`)
    return value
  }
  if (!validNetwork(body.network)) invalid('Rede inválida.')
  return {
    quoteId: stringField(body, 'quoteId'),
    quoteVersion: numberField(body, 'quoteVersion'),
    walletId: stringField(body, 'walletId'),
    network: body.network,
    connectionId: stringField(body, 'connectionId'),
    collector: {
      displayName: stringField(data, 'displayName'),
      username: stringField(data, 'username'),
      email: stringField(data, 'email'),
      profileName: stringField(data, 'profileName'),
      ensName: optionalText(data.ensName, 'ensName'),
      referralCode: optionalText(data.referralCode, 'referralCode'),
      note: typeof data.note === 'string' ? data.note : '',
    },
  }
}

// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching ws.link.
const socket = ws.link(window.location.origin.replace(/^http/, 'ws'))
let catalogNetwork = { delayMs: 0, failuresRemaining: 0 }
let favoriteNetwork = { delayMs: 0, failuresRemaining: 0 }
const closeSockets = new Set<() => void>()

async function respond<T extends object>(operation: () => Promise<T | Response>) {
  try {
    const result = await operation()
    return result instanceof Response ? result : HttpResponse.json(result)
  } catch (error) {
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

function numberField(body: Record<string, unknown>, name: string) {
  if (typeof body[name] !== 'number' || !Number.isSafeInteger(body[name])) invalid(`Campo ${name} inválido.`)
  return body[name] as number
}

function matchesImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mimeType === 'image/webp') return String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  return false
}

function guestOwner(request: Request) {
  const guestId = request.headers.get('X-Guest-Id')
  if (!guestId || !/^[a-z0-9-]{8,80}$/i.test(guestId)) throw new MockError(400, 'GUEST_ID_REQUIRED', 'Identificador do visitante ausente ou inválido.')
  return `guest:${guestId}`
}

function versionHeader(request: Request) {
  const value = request.headers.get('If-Match')?.replace(/^W\//, '').replace(/^"|"$/g, '')
  const version = Number(value)
  if (!Number.isSafeInteger(version) || version < 1) throw new MockError(400, 'VERSION_REQUIRED', 'Informe a versão atual do carrinho em If-Match.')
  return version
}

export const handlers = [
  http.get('/api/cart', ({ request }) => respond(() => transact(state => {
    const token = readToken(request)
    const owner = token ? `user:${requireSession(state, token).userId}` : guestOwner(request)
    return readCart(state, owner)
  }))),
  http.post('/api/cart/items', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const input = { nftId: stringField(body, 'nftId'), editionId: stringField(body, 'editionId'), quantity: numberField(body, 'quantity'), expectedVersion: numberField(body, 'expectedVersion') }
    return transact(state => {
      const token = readToken(request)
      const owner = token ? `user:${requireSession(state, token).userId}` : guestOwner(request)
      addCartItem(state, owner, input)
      return readCart(state, owner)
    })
  })),
  http.patch('/api/cart/items/:id', async ({ request, params }) => respond(async () => {
    const body = await readBody(request)
    return transact(state => {
      const token = readToken(request)
      const owner = token ? `user:${requireSession(state, token).userId}` : guestOwner(request)
      setCartQuantity(state, owner, String(params.id), numberField(body, 'quantity'), numberField(body, 'expectedVersion'))
      return readCart(state, owner)
    })
  })),
  http.delete('/api/cart/items/:id', ({ request, params }) => respond(() => transact(state => {
    const token = readToken(request)
    const owner = token ? `user:${requireSession(state, token).userId}` : guestOwner(request)
    removeCartItem(state, owner, String(params.id), versionHeader(request))
    return readCart(state, owner)
  }))),
  http.put('/api/cart/coupon', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    return transact(state => {
      const token = readToken(request)
      const owner = token ? `user:${requireSession(state, token).userId}` : guestOwner(request)
      setCartCoupon(state, owner, stringField(body, 'code').trim().toUpperCase(), numberField(body, 'expectedVersion'))
      return readCart(state, owner)
    })
  })),
  http.delete('/api/cart/coupon', ({ request }) => respond(() => transact(state => {
    const token = readToken(request)
    const owner = token ? `user:${requireSession(state, token).userId}` : guestOwner(request)
    setCartCoupon(state, owner, null, versionHeader(request))
    return readCart(state, owner)
  }))),
  http.post('/api/cart/merge', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const guestId = stringField(body, 'guestId')
    const guestVersion = numberField(body, 'guestVersion')
    return transact(state => mergeGuestCart(state, requireSession(state, readToken(request)).userId, guestId, guestVersion))
  })),
  http.get('/api/wallets', ({ request }) => respond(() => transact(state => {
    const { userId } = requireSession(state, readToken(request))
    return { items: state.wallets[userId] ?? [] }
  }))),
  http.post('/api/wallet-connections', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const walletId = stringField(body, 'walletId')
    const networkValue = body.network
    if (!validNetwork(networkValue)) invalid('Rede inválida.')
    const provider = body.provider ?? 'metamask'
    if (provider !== 'metamask' && provider !== 'walletconnect' && provider !== 'coinbase') invalid('Provedor de carteira inválido.')
    return transact(state => {
      const { userId } = requireSession(state, readToken(request))
      const wallet = state.wallets[userId]?.find(item => item.id === walletId)
      if (!wallet) throw new MockError(403, 'FORBIDDEN', 'Carteira não pertence ao usuário.')
      if (wallet.network !== networkValue) throw new MockError(409, 'NETWORK_MISMATCH', 'A carteira não está cadastrada nesta rede.')
      const id = `connection-${crypto.randomUUID()}`
      state.connections[id] = { id, userId, walletId, network: networkValue, provider, active: true }
      return { id, status: 'connected' as const, walletId, network: networkValue, provider }
    })
  })),
  http.delete('/api/wallet-connections/:id', ({ request, params }) => respond(() => transact(state => {
    const { userId } = requireSession(state, readToken(request))
    const connection = state.connections[String(params.id)]
    if (!connection || connection.userId !== userId) throw new MockError(404, 'NOT_FOUND', 'Conexão não encontrada.')
    connection.active = false
    return { disconnected: true }
  }))),
  http.post('/api/quotes', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const cartVersion = numberField(body, 'cartVersion')
    if (!validNetwork(body.network)) invalid('Rede inválida.')
    return transact(state => {
      const { userId } = requireSession(state, readToken(request))
      return createQuote(state, userId, { cartVersion, network: body.network as Network })
    })
  })),
  http.post('/api/orders', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const input = parseOrderInput(body)
    const key = request.headers.get('Idempotency-Key') ?? ''
    const { userId } = await transact(state => ({ userId: requireSession(state, readToken(request)).userId }))
    const result = await transact(state => submitOrder(state, userId, key, input, state.paymentSimulation.outcome, state.paymentSimulation.delayMs))
    if ('status' in result) throw new MockError(result.status, result.body.error.code, result.body.error.message, result.body.error.details)
    if (result.order.status === 'pending') scheduleOrderResolution(result.order.id, await transact(state => state.orders[result.order.id]!.delayMs))
    return HttpResponse.json(result.order, { status: result.replayed ? 200 : 201 })
  })),
  http.get('/api/orders/:id', ({ request, params }) => respond(async () => {
    const result = await transact(state => {
      const id = String(params.id)
      const order = readOrder(state, requireSession(state, readToken(request)).userId, id)
      return { order, delayMs: state.orders[id]!.delayMs }
    })
    if (result.order.status === 'pending') scheduleOrderResolution(result.order.id, result.delayMs)
    return result.order
  })),
  http.get('/api/order-attempts/:key', ({ request, params }) => respond(async () => {
    const { userId } = await transact(state => ({ userId: requireSession(state, readToken(request)).userId }))
    const result = await transact(state => {
      const attempt = state.attempts[userId]?.[String(params.key)]
      if (!attempt) throw new MockError(404, 'NOT_FOUND', 'Tentativa não encontrada.')
      if ('orderId' in attempt.result) return { order: readOrder(state, userId, attempt.result.orderId), delayMs: state.orders[attempt.result.orderId]!.delayMs }
      throw new MockError(attempt.result.status, attempt.result.body.error.code, attempt.result.body.error.message, attempt.result.body.error.details)
    })
    if (result.order.status === 'pending') scheduleOrderResolution(result.order.id, result.delayMs)
    return { order: result.order }
  })),
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
  http.get('/api/profile', ({ request }) => respond(() => transact(state => {
    const { userId } = requireSession(state, readToken(request))
    return state.users.find(user => user.profile.id === userId)!.profile
  }))),
  http.patch('/api/profile', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const input = {
      username: stringField(body, 'username'), displayName: stringField(body, 'displayName'),
      email: stringField(body, 'email'), ensName: body.ensName === null ? null : stringField(body, 'ensName'),
      expectedVersion: numberField(body, 'expectedVersion'),
    }
    return transact(state => {
      const { userId } = requireSession(state, readToken(request))
      return updateProfile(state, userId, input)
    })
  })),
  http.put('/api/profile/avatar', async ({ request }) => respond(async () => {
    let form: FormData
    try { form = await request.formData() } catch { throw new MockError(400, 'MALFORMED_REQUEST', 'Envie um arquivo de imagem válido.') }
    const file = form.get('file')
    const version = Number(form.get('expectedVersion'))
    if (!(file instanceof File)) throw new MockError(422, 'AVATAR_REQUIRED', 'Selecione uma imagem para o avatar.')
    if (!Number.isSafeInteger(version) || version < 1) throw new MockError(400, 'VERSION_REQUIRED', 'Informe a versão atual do perfil.')
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) throw new MockError(422, 'AVATAR_TYPE_INVALID', 'Use uma imagem PNG, JPG ou WebP.')
    if (!file.size || file.size > AVATAR_MAX_BYTES) throw new MockError(422, 'AVATAR_SIZE_INVALID', 'A imagem deve ter até 2 MB.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!matchesImageSignature(bytes, file.type)) throw new MockError(422, 'AVATAR_TYPE_INVALID', 'O conteúdo do arquivo não corresponde a uma imagem PNG, JPG ou WebP válida.')
    let binary = ''
    for (let index = 0; index < bytes.length; index += 0x8000)
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
    const avatarUrl = `data:${file.type};base64,${btoa(binary)}`
    return transact(state => {
      const { userId } = requireSession(state, readToken(request))
      return updateAvatar(state, userId, version, avatarUrl)
    })
  })),
  http.delete('/api/profile/avatar', ({ request }) => respond(() => transact(state => {
    const version = Number(request.headers.get('If-Match')?.replace(/^W\//, '').replace(/^"|"$/g, ''))
    if (!Number.isSafeInteger(version) || version < 1) throw new MockError(400, 'VERSION_REQUIRED', 'Informe a versão atual do perfil em If-Match.')
    const { userId } = requireSession(state, readToken(request))
    return updateAvatar(state, userId, version, null)
  }))),
  http.put('/api/profile/password', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const currentPassword = stringField(body, 'currentPassword')
    const newPassword = stringField(body, 'newPassword')
    const { userId, storedPassword } = await transact(state => {
      const { userId } = requireSession(state, readToken(request))
      const user = state.users.find(candidate => candidate.profile.id === userId)!
      return { userId, storedPassword: user.password }
    })
    const fieldErrors: Record<string, string[]> = {}
    if (newPassword.length < 8) fieldErrors.newPassword = ['Use ao menos 8 caracteres.']
    if (newPassword === currentPassword) fieldErrors.newPassword = ['Escolha uma senha diferente da atual.']
    if (Object.keys(fieldErrors).length) {
      const error = new MockError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.')
      error.body.error.fieldErrors = fieldErrors
      throw error
    }
    const attemptedCurrentVerifier = await passwordVerifier(currentPassword, storedPassword.salt, storedPassword.iterations)
    const salt = crypto.randomUUID()
    const nextPassword = { salt, verifier: await passwordVerifier(newPassword, salt, PASSWORD_ITERATIONS), iterations: PASSWORD_ITERATIONS }
    await transact(state => {
      requireSession(state, readToken(request))
      changePassword(state, userId, storedPassword.verifier, attemptedCurrentVerifier, nextPassword)
    })
    return new HttpResponse(null, { status: 204 })
  })),
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
    scheduledOrders.clear()
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
  http.post('/api/__mock/payment', async ({ request }) => respond(async () => {
    const body = await readBody(request)
    const outcome = body.outcome ?? 'confirmed'
    const delayMs = body.delayMs ?? PAYMENT_DELAY_MS
    if (outcome !== 'confirmed' && outcome !== 'declined') invalid('Resultado de pagamento inválido.')
    if (typeof delayMs !== 'number' || !Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 10_000) invalid('Latência de pagamento inválida.')
    return transact(state => {
      state.paymentSimulation = { outcome, delayMs }
      return state.paymentSimulation
    })
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
