import type { Network, Nft, Wallet } from '../contracts/marketplace'
import { BASE_TIME, SCHEMA_VERSION } from './state'
import type { DatabaseState, StoredUser } from './state'

const networks: Network[] = ['ethereum', 'polygon', 'solana']
const names = ['Violet Nomad', 'Ivory Baron', 'Emerald Dream', 'Golden Horizon']
const assets = ['violet', 'ivory', 'emerald', 'golden']
const categories = ['Arte digital', 'Fotografia', 'Generativa']

export function createNfts(now = BASE_TIME): Nft[] {
  return Array.from({ length: 36 }, (_, index) => {
    const id = `nft-${String(index + 1).padStart(3, '0')}`
    const network = networks[index % networks.length]!
    const name = `${names[index % names.length]}${index < 4 ? '' : ` #${index + 1}`}`
    return {
      id, version: 1, name, description: `Obra digital simulada ${index + 1}. Imagens temporárias locais (DEC-17).`,
      creator: ['Luna Studio', 'Kai Art', 'Nova Collective', 'Sol Atelier'][index % 4]!,
      collection: ['Cosmic Shapes', 'Digital Nature', 'Future Visions'][index % 3]!,
      category: categories[Math.floor(index / 3) % 3]!, network, tokenId: String(1001 + index),
      createdAt: new Date(now - index * 86_400_000).toISOString(), featured: index < 4,
      trending: index % 4 === 0, rating: { average: 4 + (index % 10) / 10, count: 10 + index * 3 },
      attributes: [{ name: 'Rede', value: network }, { name: 'Estilo', value: categories[Math.floor(index / 3) % 3]! }],
      images: [0, 1, 2, 3].map(offset => ({ url: `/assets/placeholders/${assets[(index + offset) % 4]}.svg`, alt: `Ilustração temporária de ${name}, vista ${offset + 1}` })),
      editions: [
        { id: `${id}-unique`, label: '1/1', unitPrice: `0.${String(25 + index * 7).padStart(3, '0')}`, available: index % 7 === 6 ? 0 : 1 },
        { id: `${id}-limited`, label: '1/10', unitPrice: `0.${String(10 + index * 3).padStart(3, '0')}`, available: index % 7 === 6 ? 0 : index % 5 === 4 ? 1 : 10 },
      ],
    }
  })
}

async function seedUser(id: string, username: string, displayName: string, email: string): Promise<StoredUser> {
  // Fictitious seed password only; persisted state contains the salted verifier.
  const salt = `kurio-fixture-${id}`
  const iterations = 100_000
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('DemoNft!2026'), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations, hash: 'SHA-256' }, key, 256)
  const verifier = Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('')
  return { profile: { id, version: 1, username, displayName, email, ensName: null, avatarUrl: null }, password: { salt, verifier, iterations } }
}

function wallet(id: string, slot: Wallet['slot'], suffix: string): Wallet {
  return { id, version: 1, slot, nickname: slot === 'primary' ? 'Principal' : 'Reserva', profileName: 'Colecionador', address: `0x${suffix.repeat(40)}`, network: 'ethereum', provider: 'metamask', ensName: null, referralCode: null }
}

export async function createFixtures(now = BASE_TIME): Promise<DatabaseState> {
  const users = await Promise.all([
    seedUser('user-a', 'collector-a', 'Collector A', 'collector-a@example.test'),
    seedUser('user-b', 'collector-b', 'Collector B', 'collector-b@example.test'),
  ])
  return {
    schemaVersion: SCHEMA_VERSION, sequence: 0, scenarioId: 'SCN-01', now,
    nfts: createNfts(now), users,
    wallets: { 'user-a': [wallet('wallet-a-main', 'primary', 'a'), wallet('wallet-a-reserve', 'secondary', 'b')], 'user-b': [wallet('wallet-b-main', 'primary', 'c')] },
    favorites: { 'user-a': ['nft-001'], 'user-b': ['nft-002'] },
    carts: {
      'user:user-a': { id: 'cart-user-a', version: 1, items: [], couponCode: null },
      'user:user-b': { id: 'cart-user-b', version: 1, items: [], couponCode: null },
    },
    mergedGuestCarts: {},
    sessions: {}, connections: {}, quotes: {}, orders: {}, attempts: {}, reservations: {},
    coupons: { NFT10: { discountBps: 1000, expiresAt: now + 365 * 86_400_000 }, EXPIRED: { discountBps: 1000, expiresAt: now - 1 } },
    networkFees: { ethereum: '0.001', polygon: '0.0001', solana: '0.00001' },
  }
}
