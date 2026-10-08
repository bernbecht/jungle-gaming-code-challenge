import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, CircleUserRound, LogOut, WalletCards } from 'lucide-react'
import type { ApiError, Profile, UpdateProfileInput } from '@/contracts/marketplace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { formFieldMessageId } from '@/lib/form-field'
import { defaultCatalog } from '@/features/catalog/search'
import { clearSessionToken, sessionQuery, signOut } from '@/features/auth/api'
import { profileQuery, saveProfile } from '@/features/profile/api'

type ProfileFields = Omit<UpdateProfileInput, 'ensName' | 'expectedVersion'> & { ensName: string }

function initialFields(profile: Profile): ProfileFields {
  return { username: profile.username, displayName: profile.displayName, email: profile.email, ensName: profile.ensName ?? '' }
}

function responseError(error: unknown) {
  if (!axios.isAxiosError<ApiError>(error)) return { message: 'Não foi possível salvar seu perfil. Tente novamente.', fieldErrors: {} as Record<string, string[]> }
  return {
    message: error.response?.data.error.message ?? 'Não foi possível salvar seu perfil. Tente novamente.',
    fieldErrors: error.response?.data.error.fieldErrors ?? {},
  }
}

function EnsNameField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <FormField id="ensName" label="Nome ENS" description="Opcional. Informe o nome completo, como ana.eth. Não verificamos o registro na demo." error={error}>
      <Input
        id="ensName"
        name="ensName"
        aria-label="Nome ENS"
        value={value}
        placeholder="ana.eth"
        aria-invalid={Boolean(error)}
        aria-describedby={formFieldMessageId('ensName')}
        onChange={event => onChange(event.target.value)}
      />
    </FormField>
  )
}

export function ProfilePage() {
  const session = useQuery(sessionQuery)
  if (session.isPending) return <section className="py-16" role="status">Carregando sua sessão…</section>
  if (session.isError || !session.data) return <section className="py-12" role="alert">Não foi possível carregar sua sessão. Atualize a página e tente novamente.</section>
  return <ProfileEditor sessionProfile={session.data} />
}

function ProfileEditor({ sessionProfile }: { sessionProfile: Profile }) {
  const profile = useQuery(profileQuery(sessionProfile.id))
  const queryClient = useQueryClient()
  const router = useRouter()
  const [fields, setFields] = useState<ProfileFields>(() => initialFields(sessionProfile))
  const [savedFields, setSavedFields] = useState<ProfileFields>(() => initialFields(sessionProfile))
  const [expectedVersion, setExpectedVersion] = useState(sessionProfile.version)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const saveMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: updated => {
      queryClient.setQueryData(profileQuery(updated.id).queryKey, updated)
      queryClient.setQueryData(sessionQuery.queryKey, updated)
      setFields(initialFields(updated))
      setSavedFields(initialFields(updated))
      setExpectedVersion(updated.version)
      setFieldErrors({})
      setFormError(null)
      setSaved(true)
    },
    onError: error => {
      const result = responseError(error)
      setFieldErrors(result.fieldErrors)
      setFormError(result.message)
      setSaved(false)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSettled: () => {
      clearSessionToken()
      queryClient.clear()
      queryClient.setQueryData(sessionQuery.queryKey, null)
      void router.navigate({ to: '/', search: defaultCatalog })
    },
  })

  if (profile.isPending) return <section className="py-16" role="status">Carregando seu perfil…</section>
  if (profile.isError || !profile.data)
    return <section className="py-12" role="alert"><p>Não foi possível carregar seu perfil.</p><Button className="mt-4" variant="outline" onClick={() => void profile.refetch()}>Tentar novamente</Button></section>

  const hasChanges = fields.username !== savedFields.username || fields.displayName !== savedFields.displayName || fields.email !== savedFields.email || fields.ensName !== savedFields.ensName
  function updateField(name: keyof ProfileFields, value: string) {
    setFields(current => ({ ...current, [name]: value }))
    setFieldErrors(current => ({ ...current, [name]: [] }))
    setFormError(null)
    setSaved(false)
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ensName = fields.ensName.trim().toLowerCase() || null
    setSaved(false)
    saveMutation.mutate({
      username: fields.username.trim(), displayName: fields.displayName.trim(),
      email: fields.email.trim(), ensName, expectedVersion,
    })
  }

  const fieldMessage = (name: keyof ProfileFields) => fieldErrors[name]?.[0]
  const refreshProfile = async () => {
    const result = await profile.refetch()
    if (result.data) {
      setFields(initialFields(result.data))
      setSavedFields(initialFields(result.data))
      setExpectedVersion(result.data.version)
      setFieldErrors({})
      setFormError(null)
      setSaved(false)
    }
  }
  const discardChanges = () => {
    setFields(savedFields)
    setFieldErrors({})
    setFormError(null)
    setSaved(false)
  }

  return (
    <section className="mx-auto grid max-w-[1120px] gap-8 py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10" aria-labelledby="profile-title">
      <aside className="overflow-hidden rounded-sm bg-card" aria-label="Meu perfil">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Meu perfil</h2>
        </div>
        <nav aria-label="Navegação da conta" className="grid gap-1 p-2">
          <Link to="/profile" aria-current="page" className="flex min-h-11 items-center gap-3 border-l-4 border-primary bg-surface-dark/50 px-3 text-primary">
            <CircleUserRound size={18} aria-hidden="true" />Dados do perfil
          </Link>
          <Link to="/wallets" className="flex min-h-11 items-center gap-3 border-l-4 border-transparent px-3 text-muted-foreground hover:text-primary">
            <WalletCards size={18} aria-hidden="true" />Carteiras
          </Link>
        </nav>
        <div className="border-t border-border p-2 md:hidden">
          <Button variant="ghost" className="w-full justify-start" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
            <LogOut size={18} aria-hidden="true" />{logoutMutation.isPending ? 'Saindo…' : 'Sair'}
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-7 flex items-center gap-3">
          <Link to="/" search={defaultCatalog} aria-label="Voltar ao início" className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:text-primary md:hidden"><ArrowLeft size={20} aria-hidden="true" /></Link>
          <h1 id="profile-title" className="text-2xl font-semibold">Perfil do colecionador</h1>
        </div>

        <form className="space-y-7" onSubmit={submit} noValidate>
          <fieldset disabled={saveMutation.isPending} className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <legend className="sr-only">Dados do perfil</legend>
            <FormField id="displayName" label="Nome de exibição" required error={fieldMessage('displayName')}>
              <Input id="displayName" name="displayName" autoComplete="name" value={fields.displayName} aria-invalid={Boolean(fieldMessage('displayName'))} aria-describedby={fieldMessage('displayName') ? formFieldMessageId('displayName') : undefined} onChange={event => updateField('displayName', event.target.value)} />
            </FormField>
            <FormField id="username" label="Nome de usuário" required description="3–24 caracteres: letras minúsculas, números e _." error={fieldMessage('username')}>
              <Input id="username" name="username" autoComplete="off" value={fields.username} aria-invalid={Boolean(fieldMessage('username'))} aria-describedby={formFieldMessageId('username')} onChange={event => updateField('username', event.target.value)} />
            </FormField>
            <FormField id="email" label="E-mail" required error={fieldMessage('email')}>
              <Input id="email" name="email" type="email" autoComplete="email" value={fields.email} aria-invalid={Boolean(fieldMessage('email'))} aria-describedby={fieldMessage('email') ? formFieldMessageId('email') : undefined} onChange={event => updateField('email', event.target.value)} />
            </FormField>
            <EnsNameField value={fields.ensName} onChange={value => updateField('ensName', value)} error={fieldMessage('ensName')} />
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button type="submit" disabled={!hasChanges || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            {hasChanges && <Button type="button" variant="outline" disabled={saveMutation.isPending} onClick={discardChanges}>Descartar</Button>}
            {saved && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Check size={17} aria-hidden="true" />Perfil atualizado.</p>}
            {formError && <div className="w-full rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"><p role="alert">{formError}</p>{saveMutation.error && axios.isAxiosError(saveMutation.error) && saveMutation.error.response?.status === 409 && <Button type="button" variant="outline" className="mt-3" onClick={() => void refreshProfile()}>Recarregar dados</Button>}</div>}
          </div>
        </form>
      </div>
    </section>
  )
}
