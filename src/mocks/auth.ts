import type { AuthResponse, Favorites, LoginInput, Profile, RegisterInput, Session, UpdateProfileInput } from '../contracts/marketplace'
import { MockError } from './errors'
import type { DatabaseState, StoredUser } from './state'
import { nextId } from './state'
import { USERNAME_PATTERN } from '../lib/validation'

const SESSION_LIFETIME_MS = 24 * 60 * 60_000
export const PASSWORD_ITERATIONS = 100_000

export async function passwordVerifier(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('')
}

function issueSession(state: DatabaseState, user: StoredUser): AuthResponse {
  const id = nextId(state, 'session')
  const expiresAt = state.now + SESSION_LIFETIME_MS
  state.sessions[id] = { id, userId: user.profile.id, expiresAt }
  return { token: id, session: { id, user: user.profile, expiresAt: new Date(expiresAt).toISOString() } }
}

export function login(state: DatabaseState, input: LoginInput, verifier: string): AuthResponse {
  const email = input.email.trim().toLowerCase()
  const user = state.users.find(candidate => candidate.profile.email.toLowerCase() === email)
  if (!user || verifier !== user.password.verifier)
    throw new MockError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
  return issueSession(state, user)
}

export function register(state: DatabaseState, input: RegisterInput, password: StoredUser['password']): AuthResponse {
  const username = input.username.trim().toLowerCase()
  const displayName = input.displayName.trim()
  const email = input.email.trim().toLowerCase()
  const fieldErrors: Record<string, string[]> = {}
  if (!USERNAME_PATTERN.test(username)) fieldErrors.username = ['Use de 3 a 24 letras, números, hífen ou _.']
  if (displayName.length < 2 || displayName.length > 60) fieldErrors.displayName = ['Informe um nome entre 2 e 60 caracteres.']
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ['Informe um e-mail válido.']
  if (input.password.length < 8) fieldErrors.password = ['Use ao menos 8 caracteres.']
  if (Object.keys(fieldErrors).length) {
    const error = new MockError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.')
    error.body.error.fieldErrors = fieldErrors
    throw error
  }
  if (state.users.some(user => user.profile.email.toLowerCase() === email || user.profile.username.toLowerCase() === username))
    throw new MockError(409, 'ACCOUNT_EXISTS', 'Já existe uma conta com esse e-mail ou nome de usuário.')
  const id = nextId(state, 'user')
  const profile: Profile = { id, version: 1, username, displayName, email, ensName: null, avatarUrl: null }
  const user: StoredUser = { profile, password }
  state.users.push(user)
  state.favorites[id] = []
  state.wallets[id] = []
  state.carts[`user:${id}`] = { id: nextId(state, 'cart'), version: 1, items: [], couponCode: null }
  return issueSession(state, user)
}

export function updateProfile(state: DatabaseState, userId: string, input: UpdateProfileInput): Profile {
  const user = state.users.find(candidate => candidate.profile.id === userId)
  if (!user) throw new MockError(404, 'NOT_FOUND', 'Perfil não encontrado.')
  if (user.profile.version !== input.expectedVersion)
    throw new MockError(409, 'VERSION_CONFLICT', 'Este perfil foi alterado em outra sessão. Recarregue os dados e tente novamente.')

  const username = input.username.trim().toLowerCase()
  const displayName = input.displayName.trim()
  const email = input.email.trim().toLowerCase()
  const ensName = input.ensName?.trim().toLowerCase() || null
  const fieldErrors: Record<string, string[]> = {}
  if (!USERNAME_PATTERN.test(username)) fieldErrors.username = ['Use de 3 a 24 letras, números, hífen ou _.']
  if (displayName.length < 2 || displayName.length > 60) fieldErrors.displayName = ['Informe um nome entre 2 e 60 caracteres.']
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ['Informe um e-mail válido.']
  if (ensName && !/^(?=.{3,255}$)[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth$/.test(ensName)) fieldErrors.ensName = ['Informe um nome ENS válido terminado em .eth.']
  if (Object.keys(fieldErrors).length) {
    const error = new MockError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.')
    error.body.error.fieldErrors = fieldErrors
    throw error
  }
  const duplicate = state.users.find(candidate => candidate.profile.id !== userId &&
    (candidate.profile.email.toLowerCase() === email || candidate.profile.username.toLowerCase() === username))
  if (duplicate) {
    const error = new MockError(409, 'ACCOUNT_EXISTS', 'Já existe uma conta com esse e-mail ou nome de usuário.')
    error.body.error.fieldErrors = {
      ...(duplicate.profile.email.toLowerCase() === email ? { email: ['Este e-mail já está em uso.'] } : {}),
      ...(duplicate.profile.username.toLowerCase() === username ? { username: ['Este nome de usuário já está em uso.'] } : {}),
    }
    throw error
  }
  user.profile = { ...user.profile, username, displayName, email, ensName, version: user.profile.version + 1 }
  return user.profile
}

export function requireSession(state: DatabaseState, token: string | null): { userId: string; session: Session } {
  const record = token ? state.sessions[token] : undefined
  if (!record || record.expiresAt <= state.now) {
    if (record) delete state.sessions[record.id]
    throw new MockError(401, 'SESSION_INVALID', 'Sua sessão expirou. Entre novamente.')
  }
  const user = state.users.find(candidate => candidate.profile.id === record.userId)
  if (!user) throw new MockError(401, 'SESSION_INVALID', 'Sua sessão expirou. Entre novamente.')
  return { userId: user.profile.id, session: { id: record.id, user: user.profile, expiresAt: new Date(record.expiresAt).toISOString() } }
}

export function logout(state: DatabaseState, token: string | null) {
  if (token) delete state.sessions[token]
  return { loggedOut: true }
}

export function readFavorites(state: DatabaseState, userId: string): Favorites {
  return { userId, nftIds: [...(state.favorites[userId] ?? [])] }
}

export function setFavorite(state: DatabaseState, userId: string, nftId: string, favorite: boolean): Favorites {
  if (!state.nfts.some(nft => nft.id === nftId)) throw new MockError(404, 'NOT_FOUND', 'NFT não encontrado.')
  const ids = state.favorites[userId] ?? (state.favorites[userId] = [])
  state.favorites[userId] = favorite ? [...new Set([...ids, nftId])] : ids.filter(id => id !== nftId)
  return readFavorites(state, userId)
}
