import type { UpdateWalletInput, Wallet, WalletInput } from '../contracts/marketplace'
import { MockError } from './errors'
import type { DatabaseState } from './state'
import { nextId } from './state'

function validate(input: Omit<WalletInput, 'slot'>) {
  const errors: Record<string, string[]> = {}
  if (input.profileName.trim().length < 2 || input.profileName.trim().length > 60) errors.profileName = ['Informe um nome entre 2 e 60 caracteres.']
  const evm = /^0x[a-fA-F0-9]{40}$/
  const solana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  if (!(input.network === 'solana' ? solana : evm).test(input.address.trim())) errors.address = [input.network === 'solana' ? 'Informe um endereço Solana válido.' : 'Informe um endereço EVM válido (0x seguido de 40 caracteres hexadecimais).']
  if (input.ensName && !/^(?=.{3,255}$)[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth$/i.test(input.ensName.trim())) errors.ensName = ['Informe um nome ENS terminado em .eth.']
  if (!['metamask', 'walletconnect', 'coinbase'].includes(input.provider)) errors.provider = ['Selecione um tipo de carteira válido.']
  if (Object.keys(errors).length) {
    const error = new MockError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.')
    error.body.error.fieldErrors = errors
    throw error
  }
}

export function createWallet(state: DatabaseState, userId: string, input: WalletInput): Wallet {
  const wallets = state.wallets[userId] ?? (state.wallets[userId] = [])
  validate(input)
  if (wallets.some(wallet => wallet.slot === input.slot)) throw new MockError(409, 'WALLET_SLOT_EXISTS', 'Já existe uma carteira neste espaço.')
  if (wallets.some(wallet => wallet.network === input.network && wallet.address.toLowerCase() === input.address.trim().toLowerCase())) throw new MockError(409, 'WALLET_ADDRESS_EXISTS', 'Este endereço já está cadastrado nesta rede.')
  const wallet: Wallet = {
    ...input, id: nextId(state, 'wallet'), version: 1,
    nickname: input.slot === 'primary' ? 'Principal' : 'Secundária',
    profileName: input.profileName.trim(), address: input.address.trim(),
    ensName: input.ensName?.trim() || null, referralCode: input.referralCode?.trim() || null,
  }
  wallets.push(wallet)
  return wallet
}

export function updateWallet(state: DatabaseState, userId: string, walletId: string, input: UpdateWalletInput): Wallet {
  const wallet = state.wallets[userId]?.find(item => item.id === walletId)
  if (!wallet) throw new MockError(404, 'NOT_FOUND', 'Carteira não encontrada.')
  if (wallet.version !== input.expectedVersion) throw new MockError(409, 'VERSION_CONFLICT', 'Esta carteira foi alterada em outra sessão. Recarregue os dados e tente novamente.')
  validate(input)
  if (state.wallets[userId]!.some(item => item.id !== walletId && item.network === input.network && item.address.toLowerCase() === input.address.trim().toLowerCase())) throw new MockError(409, 'WALLET_ADDRESS_EXISTS', 'Este endereço já está cadastrado nesta rede.')
  for (const connection of Object.values(state.connections)) {
    if (connection.userId === userId && connection.walletId === walletId) connection.active = false
  }
  Object.assign(wallet, {
    profileName: input.profileName.trim(), address: input.address.trim(), network: input.network,
    provider: input.provider, ensName: input.ensName?.trim() || null,
    referralCode: input.referralCode?.trim() || null, version: wallet.version + 1,
  })
  return wallet
}
