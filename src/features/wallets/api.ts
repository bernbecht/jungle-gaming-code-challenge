import type { UpdateWalletInput, Wallet, WalletInput } from '@/contracts/marketplace'
import { queryOptions } from '@tanstack/react-query'
import { http } from '@/lib/http'

export const walletsQueryKey = (userId: string) => ['wallets', userId] as const
export async function readWallets(signal?: AbortSignal) { return (await http.get<{ items: Wallet[] }>('/wallets', { signal })).data.items }
export function walletsQuery(userId: string) { return queryOptions({ queryKey: walletsQueryKey(userId), queryFn: ({ signal }) => readWallets(signal) }) }
export async function addWallet(input: WalletInput) { return (await http.post<Wallet>('/wallets', input)).data }
export async function saveWallet(id: string, input: UpdateWalletInput) { return (await http.patch<Wallet>(`/wallets/${encodeURIComponent(id)}`, input)).data }
