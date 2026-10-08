import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import axios from 'axios'
import { ArrowLeft, CircleUserRound, WalletCards } from 'lucide-react'
import type { ApiError, Network, UpdateWalletInput, Wallet, WalletInput } from '@/contracts/marketplace'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { clearSessionToken, sessionQuery, signOut } from '@/features/auth/api'
import { addWallet, saveWallet, walletsQuery, walletsQueryKey } from '@/features/wallets/api'
import { defaultCatalog } from '@/features/catalog/search'

type Fields = Omit<WalletInput, 'slot'>
const empty: Fields = { profileName: '', address: '', network: 'ethereum', provider: 'metamask', ensName: null, referralCode: null }
const networkLabels: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const providers: { id: Wallet['provider']; label: string }[] = [
  { id: 'metamask', label: 'MetaMask' }, { id: 'walletconnect', label: 'WalletConnect' }, { id: 'coinbase', label: 'Coinbase Wallet' },
]

function WalletEditor({ wallet, slot, primary, userId }: { wallet?: Wallet; slot: Wallet['slot']; primary?: Wallet; userId: string }) {
  const queryClient = useQueryClient()
  const starting = wallet ? { profileName: wallet.profileName, address: wallet.address, network: wallet.network, provider: wallet.provider, ensName: wallet.ensName, referralCode: wallet.referralCode } : empty
  const [fields, setFields] = useState<Fields>(starting)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const mutation = useMutation({
    mutationFn: () => wallet
      ? saveWallet(wallet.id, { ...fields, expectedVersion: wallet.version } as UpdateWalletInput)
      : addWallet({ ...fields, slot }),
    onSuccess: async (updated) => {
      const current = queryClient.getQueryData<Wallet[]>(walletsQueryKey(userId)) ?? []
      queryClient.setQueryData(walletsQueryKey(userId), wallet ? current.map(item => item.id === updated.id ? updated : item) : [...current, updated])
      await queryClient.invalidateQueries({ queryKey: walletsQueryKey(userId) })
      setErrors({}); setFormError(''); setSuccess(true)
    },
    onError: (error) => {
      const data = axios.isAxiosError<ApiError>(error) ? error.response?.data.error : undefined
      setErrors(data?.fieldErrors ?? {}); setFormError(data?.message ?? 'Não foi possível salvar a carteira. Tente novamente.'); setSuccess(false)
    },
  })
  function change<K extends keyof Fields>(key: K, value: Fields[K]) { setFields(old => ({ ...old, [key]: value })); setErrors(old => ({ ...old, [key]: [] })); setFormError(''); setSuccess(false) }
  function submit(event: FormEvent) { event.preventDefault(); mutation.mutate() }
  return <form onSubmit={submit} noValidate className="space-y-5 rounded-sm border border-border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Carteira {slot === 'primary' ? 'principal' : 'secundária'}</h2><p className="mt-1 text-sm text-muted-foreground">{wallet ? 'Edite os dados cadastrados.' : 'Adicione uma carteira para esta conta.'}</p></div>
      {slot === 'secondary' && primary && <Button type="button" variant="outline" onClick={() => { setFields({ profileName: primary.profileName, address: primary.address, network: primary.network, provider: primary.provider, ensName: primary.ensName, referralCode: primary.referralCode }); setSuccess(false) }}>Igual à carteira principal</Button>}
    </div>
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      <FormField id={`wallet-${slot}-profile`} label="Nome do perfil" required error={errors.profileName?.[0]}><Input id={`wallet-${slot}-profile`} value={fields.profileName} onChange={e => change('profileName', e.target.value)} aria-invalid={Boolean(errors.profileName?.length)} /></FormField>
      <FormField id={`wallet-${slot}-network`} label="Rede" required error={errors.network?.[0]}><select id={`wallet-${slot}-network`} className="flex h-12 w-full rounded-md border border-input bg-transparent px-4 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm" value={fields.network} onChange={e => change('network', e.target.value as Network)}>{Object.entries(networkLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
      <FormField id={`wallet-${slot}-address`} label="Endereço da carteira" required description={fields.network === 'solana' ? 'Endereço Solana em Base58.' : 'Endereço EVM com 0x e 40 caracteres hexadecimais.'} error={errors.address?.[0]} className="sm:col-span-2"><Input id={`wallet-${slot}-address`} autoComplete="off" spellCheck={false} value={fields.address} onChange={e => change('address', e.target.value)} aria-invalid={Boolean(errors.address?.length)} /></FormField>
      <FormField id={`wallet-${slot}-provider`} label="Tipo de carteira" required error={errors.provider?.[0]}><select id={`wallet-${slot}-provider`} className="flex h-12 w-full rounded-md border border-input bg-transparent px-4 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm" value={fields.provider} onChange={e => change('provider', e.target.value as Wallet['provider'])}>{providers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></FormField>
      <FormField id={`wallet-${slot}-ens`} label="Nome ENS" description="Não verificamos o registro na demo." error={errors.ensName?.[0]}><Input id={`wallet-${slot}-ens`} value={fields.ensName ?? ''} placeholder="ana.eth" onChange={e => change('ensName', e.target.value || null)} aria-invalid={Boolean(errors.ensName?.length)} /></FormField>
      <FormField id={`wallet-${slot}-referral`} label="Código de indicação" error={errors.referralCode?.[0]}><Input id={`wallet-${slot}-referral`} value={fields.referralCode ?? ''} onChange={e => change('referralCode', e.target.value || null)} aria-invalid={Boolean(errors.referralCode?.length)} /></FormField>
    </div>
    {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}{success && <p role="status" className="text-sm text-primary">Carteira salva.</p>}
    <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar carteira'}</Button></div>
  </form>
}

export function WalletsPage() {
  const session = useQuery(sessionQuery)
  const wallets = useQuery({ ...walletsQuery(session.data?.id ?? ''), enabled: Boolean(session.data?.id) })
  const queryClient = useQueryClient()
  const router = useRouter()
  const logout = useMutation({ mutationFn: signOut, onSettled: () => { clearSessionToken(); queryClient.clear(); queryClient.setQueryData(sessionQuery.queryKey, null); void router.navigate({ to: '/', search: defaultCatalog }) } })
  if (session.isPending || wallets.isPending) return <section className="py-16" role="status">Carregando suas carteiras…</section>
  if (session.isError || !session.data || wallets.isError) return <section className="py-12" role="alert">Não foi possível carregar suas carteiras. <Button variant="outline" onClick={() => void wallets.refetch()}>Tentar novamente</Button></section>
  return <section className="mx-auto grid max-w-[1120px] items-start gap-8 py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10" aria-labelledby="wallets-title">
    <aside className="hidden self-start overflow-hidden rounded-sm bg-card md:block" aria-label="Meu perfil"><div className="border-b border-border px-5 py-4"><h2 className="text-lg font-semibold">Meu perfil</h2></div><nav aria-label="Navegação da conta" className="grid gap-1 p-2"><Link to="/profile" className="flex min-h-11 items-center gap-3 border-l-4 border-transparent px-3 text-accent hover:text-accent"><CircleUserRound size={18} className="text-secondary" aria-hidden="true"/>Dados do perfil</Link><Link to="/wallets" aria-current="page" className="flex min-h-11 items-center gap-3 border-l-4 border-primary bg-surface-dark/50 px-3 text-accent"><WalletCards size={18} className="text-accent" aria-hidden="true"/>Carteiras</Link></nav></aside>
    <div className="min-w-0"><div className="mb-5 flex items-center gap-3 md:mb-7"><Link to="/" search={defaultCatalog} aria-label="Voltar ao início" className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-primary md:hidden"><ArrowLeft size={20} aria-hidden="true"/></Link><h1 id="wallets-title" className="text-xl font-semibold md:text-2xl">Suas carteiras</h1></div>
      <nav aria-label="Navegação da conta" className="mb-6 grid grid-cols-2 border-b border-border md:hidden"><Link to="/profile" className="flex min-h-12 items-center justify-center border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground">Dados do perfil</Link><Link to="/wallets" aria-current="page" className="flex min-h-12 items-center justify-center border-b-2 border-primary px-3 text-sm font-medium text-primary">Carteiras</Link></nav>
      <div className="space-y-6"><WalletEditor wallet={wallets.data.find(item => item.slot === 'primary')} slot="primary" userId={session.data.id}/><WalletEditor wallet={wallets.data.find(item => item.slot === 'secondary')} slot="secondary" primary={wallets.data.find(item => item.slot === 'primary')} userId={session.data.id}/></div>
      <div className="mt-8 border-t border-border pt-3 md:hidden"><Button variant="ghost" className="w-full justify-start px-0 text-muted-foreground" disabled={logout.isPending} onClick={() => logout.mutate()}>{logout.isPending ? 'Saindo…' : 'Sair'}</Button></div>
    </div>
  </section>
}
