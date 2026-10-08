import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type {
  ApiError,
  Profile,
  UpdateProfileInput,
} from "@/contracts/marketplace";
import { clearSessionToken, sessionQuery, signOut } from "@/features/auth/api";
import { defaultCatalog } from "@/features/catalog/search";
import {
  profileQuery,
  removeAvatar,
  saveProfile,
  updatePassword,
  uploadAvatar,
} from "@/features/profile/api";
import { formFieldMessageId } from "@/lib/form-field";
import { USERNAME_PATTERN } from "@/lib/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  CircleUserRound,
  ImageUp,
  LogOut,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

type ProfileFields = Omit<UpdateProfileInput, "ensName" | "expectedVersion"> & {
  ensName: string;
};

function initialFields(profile: Profile): ProfileFields {
  return {
    username: profile.username,
    displayName: profile.displayName,
    email: profile.email,
    ensName: profile.ensName ?? "",
  };
}

function responseError(
  error: unknown,
  fallback = "Não foi possível salvar seu perfil. Tente novamente.",
) {
  if (!axios.isAxiosError<ApiError>(error))
    return {
      message: fallback,
      fieldErrors: {} as Record<string, string[]>,
    };
  return {
    message:
      error.response?.data.error.message ??
      fallback,
    fieldErrors: error.response?.data.error.fieldErrors ?? {},
  };
}

function EnsNameField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <FormField
      id="ensName"
      label="Nome ENS"
      description="Informe o nome completo, como ana.eth. Não verificamos o registro na demo."
      error={error}
    >
      <Input
        id="ensName"
        name="ensName"
        aria-label="Nome ENS"
        value={value}
        placeholder="ana.eth"
        aria-invalid={Boolean(error)}
        aria-describedby={formFieldMessageId("ensName")}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

export function ProfilePage() {
  const session = useQuery(sessionQuery);
  if (session.isPending)
    return (
      <section className="py-16" role="status">
        Carregando sua sessão…
      </section>
    );
  if (session.isError || !session.data)
    return (
      <section className="py-12" role="alert">
        Não foi possível carregar sua sessão. Atualize a página e tente
        novamente.
      </section>
    );
  return <ProfileEditor sessionProfile={session.data} />;
}

function ProfileEditor({ sessionProfile }: { sessionProfile: Profile }) {
  const profile = useQuery(profileQuery(sessionProfile.id));
  const queryClient = useQueryClient();
  const router = useRouter();
  const [fields, setFields] = useState<ProfileFields>(() =>
    initialFields(sessionProfile),
  );
  const [savedFields, setSavedFields] = useState<ProfileFields>(() =>
    initialFields(sessionProfile),
  );
  const [expectedVersion, setExpectedVersion] = useState(
    sessionProfile.version,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  function acceptAvatar(updated: Profile) {
    queryClient.setQueryData(profileQuery(updated.id).queryKey, updated);
    queryClient.setQueryData(sessionQuery.queryKey, updated);
    setExpectedVersion(updated.version);
    setAvatarError(null);
  }
  const avatarMutation = useMutation({
    mutationFn: (file: File) =>
      uploadAvatar(file, profile.data?.version ?? sessionProfile.version),
    onSuccess: acceptAvatar,
    onError: (error) => {
      const result = responseError(
        error,
        "Não foi possível enviar seu avatar. Tente novamente.",
      );
      setAvatarError(result.message);
    },
  });
  const removeAvatarMutation = useMutation({
    mutationFn: () =>
      removeAvatar(profile.data?.version ?? sessionProfile.version),
    onSuccess: acceptAvatar,
    onError: (error) => setAvatarError(responseError(error).message),
  });
  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      setPasswordFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setPasswordError(null);
      setPasswordSaved(true);
    },
    onError: (error) => {
      const result = responseError(
        error,
        "Não foi possível alterar sua senha. Tente novamente.",
      );
      setPasswordErrors(result.fieldErrors);
      setPasswordError(result.message);
      setPasswordSaved(false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQuery(updated.id).queryKey, updated);
      queryClient.setQueryData(sessionQuery.queryKey, updated);
      setFields(initialFields(updated));
      setSavedFields(initialFields(updated));
      setExpectedVersion(updated.version);
      setFieldErrors({});
      setFormError(null);
      setSaved(true);
    },
    onError: (error) => {
      const result = responseError(error);
      setFieldErrors(result.fieldErrors);
      setFormError(result.message);
      setSaved(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSettled: () => {
      clearSessionToken();
      queryClient.clear();
      queryClient.setQueryData(sessionQuery.queryKey, null);
      void router.navigate({ to: "/", search: defaultCatalog });
    },
  });

  if (profile.isPending)
    return (
      <section className="py-16" role="status">
        Carregando seu perfil…
      </section>
    );
  if (profile.isError || !profile.data)
    return (
      <section className="py-12" role="alert">
        <p>Não foi possível carregar seu perfil.</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => void profile.refetch()}
        >
          Tentar novamente
        </Button>
      </section>
    );

  const hasChanges =
    fields.username !== savedFields.username ||
    fields.displayName !== savedFields.displayName ||
    fields.email !== savedFields.email ||
    fields.ensName !== savedFields.ensName;
  function updateField(name: keyof ProfileFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: [] }));
    setFormError(null);
    setSaved(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ensName = fields.ensName.trim().toLowerCase() || null;
    setSaved(false);
    saveMutation.mutate({
      username: fields.username.trim(),
      displayName: fields.displayName.trim(),
      email: fields.email.trim(),
      ensName,
      expectedVersion,
    });
  }
  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setAvatarError(null);
    avatarMutation.mutate(file);
  }
  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordSaved(false);
    setPasswordErrors({});
    setPasswordError(null);
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      setPasswordErrors({ confirmPassword: ["As senhas novas não coincidem."] });
      return;
    }
    if (passwordFields.newPassword === passwordFields.currentPassword) {
      setPasswordErrors({ newPassword: ["Escolha uma senha diferente da atual."] });
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordFields.currentPassword,
      newPassword: passwordFields.newPassword,
    });
  }
  function updatePasswordField(name: keyof typeof passwordFields, value: string) {
    setPasswordFields((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => ({ ...current, [name]: [] }));
    setPasswordError(null);
    setPasswordSaved(false);
  }

  const fieldMessage = (name: keyof ProfileFields) => fieldErrors[name]?.[0];
  const refreshProfile = async () => {
    const result = await profile.refetch();
    if (result.data) {
      setFields(initialFields(result.data));
      setSavedFields(initialFields(result.data));
      setExpectedVersion(result.data.version);
      setFieldErrors({});
      setFormError(null);
      setSaved(false);
    }
  };
  const discardChanges = () => {
    setFields(savedFields);
    setFieldErrors({});
    setFormError(null);
    setSaved(false);
  };

  return (
    <section
      className="mx-auto grid max-w-[1120px] items-start gap-8 py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10"
      aria-labelledby="profile-title"
    >
      <aside
        className="hidden self-start overflow-hidden rounded-sm bg-card md:block"
        aria-label="Meu perfil"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Meu perfil</h2>
        </div>
        <nav aria-label="Navegação da conta" className="grid gap-1 p-2">
          <Link
            to="/profile"
            aria-current="page"
            className="flex min-h-11 items-center gap-3 border-l-4 border-primary bg-surface-dark/50 px-3 text-accent"
          >
            <CircleUserRound size={18} className="text-accent" aria-hidden="true" />
            Dados do perfil
          </Link>
          <Link
            to="/wallets"
            className="flex min-h-11 items-center gap-3 border-l-4 border-transparent px-3 text-accent hover:text-accent"
          >
            <WalletCards size={18} className="text-secondary" aria-hidden="true" />
            Carteiras
          </Link>
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex items-center gap-3 md:mb-7">
          <Link
            to="/"
            search={defaultCatalog}
            aria-label="Voltar ao início"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-primary md:hidden"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <h1 id="profile-title" className="text-xl font-semibold md:text-2xl">
            Perfil do colecionador
          </h1>
        </div>

        <nav
          aria-label="Navegação da conta"
          className="mb-6 grid grid-cols-2 border-b border-border md:hidden"
        >
          <Link
            to="/profile"
            aria-current="page"
            className="flex min-h-12 items-center justify-center border-b-2 border-primary px-3 text-sm font-medium text-primary"
          >
            Dados do perfil
          </Link>
          <Link
            to="/wallets"
            className="flex min-h-12 items-center justify-center border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Carteiras
          </Link>
        </nav>

        <form id="profile-form" onSubmit={submit} noValidate>
          <fieldset
            disabled={
              saveMutation.isPending ||
              avatarMutation.isPending ||
              removeAvatarMutation.isPending
            }
            className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
          >
            <legend className="sr-only">Dados do perfil</legend>
            <FormField
              id="displayName"
              label="Nome de exibição"
              required
              error={fieldMessage("displayName")}
            >
              <Input
                id="displayName"
                name="displayName"
                autoComplete="name"
                value={fields.displayName}
                aria-invalid={Boolean(fieldMessage("displayName"))}
                aria-describedby={
                  fieldMessage("displayName")
                    ? formFieldMessageId("displayName")
                    : undefined
                }
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
              />
            </FormField>
            <FormField
              id="username"
              label="Nome de usuário"
              required
              description="3–24 caracteres: letras, números, hífen (-) e sublinhado (_)."
              error={fieldMessage("username")}
            >
              <Input
                id="username"
                name="username"
                autoComplete="off"
                minLength={3}
                maxLength={24}
                pattern={USERNAME_PATTERN.source}
                value={fields.username}
                aria-invalid={Boolean(fieldMessage("username"))}
                aria-describedby={formFieldMessageId("username")}
                onChange={(event) =>
                  updateField("username", event.target.value)
                }
              />
            </FormField>
            <FormField
              id="email"
              label="E-mail"
              required
              error={fieldMessage("email")}
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                aria-invalid={Boolean(fieldMessage("email"))}
                aria-describedby={
                  fieldMessage("email")
                    ? formFieldMessageId("email")
                    : undefined
                }
                onChange={(event) => updateField("email", event.target.value)}
              />
            </FormField>
            <EnsNameField
              value={fields.ensName}
              onChange={(value) => updateField("ensName", value)}
              error={fieldMessage("ensName")}
            />
          </fieldset>
        </form>

        <section
          className="mt-8 border-t border-border pt-6"
          aria-labelledby="avatar-title"
        >
          <h2 id="avatar-title" className="mb-4 text-base font-semibold">
            Avatar
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {profile.data.avatarUrl ? (
              <img
                src={profile.data.avatarUrl}
                alt="Avatar do perfil"
                className="size-20 rounded-full border border-border object-cover"
              />
            ) : (
              <div
                className="flex size-20 items-center justify-center rounded-full border border-border bg-surface-dark text-muted-foreground"
                aria-label="Sem avatar"
              >
                <CircleUserRound size={36} aria-hidden="true" />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={avatarInput}
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Arquivo do avatar"
                onChange={selectAvatar}
              />
              <Button
                type="button"
                variant="outline"
                disabled={
                  saveMutation.isPending ||
                  avatarMutation.isPending ||
                  removeAvatarMutation.isPending
                }
                onClick={() => avatarInput.current?.click()}
              >
                <ImageUp size={17} aria-hidden="true" />
                {avatarMutation.isPending ? "Enviando…" : "Alterar"}
              </Button>
              {profile.data.avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={
                    saveMutation.isPending ||
                    avatarMutation.isPending ||
                    removeAvatarMutation.isPending
                  }
                  onClick={() => removeAvatarMutation.mutate()}
                >
                  <Trash2 size={17} aria-hidden="true" />
                  {removeAvatarMutation.isPending ? "Removendo…" : "Remover"}
                </Button>
              )}
              <p className="w-full text-xs text-muted-foreground">
                PNG, JPG ou WebP. Até 2 MB.
              </p>
              {avatarError && (
                <p role="alert" className="w-full text-sm text-destructive">
                  {avatarError}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className="mt-8 border-t border-border pt-6"
          aria-labelledby="password-title"
        >
          <h2 id="password-title" className="mb-5 text-base font-semibold">
            Senha
          </h2>
          <form className="space-y-5" onSubmit={submitPassword} noValidate>
            <fieldset
              disabled={passwordMutation.isPending}
              className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
            >
              <legend className="sr-only">Alterar senha</legend>
              <FormField
                id="currentPassword"
                label="Senha atual"
                required
                error={passwordErrors.currentPassword?.[0]}
              >
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordFields.currentPassword}
                  aria-invalid={Boolean(passwordErrors.currentPassword?.[0])}
                  aria-describedby={passwordErrors.currentPassword?.[0] ? formFieldMessageId("currentPassword") : undefined}
                  onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                />
              </FormField>
              <FormField
                id="newPassword"
                label="Nova senha"
                required
                description="Use ao menos 8 caracteres."
                error={passwordErrors.newPassword?.[0]}
              >
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordFields.newPassword}
                  aria-invalid={Boolean(passwordErrors.newPassword?.[0])}
                  aria-describedby={formFieldMessageId("newPassword")}
                  onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                />
              </FormField>
              <FormField
                id="confirmPassword"
                label="Confirmar nova senha"
                required
                error={passwordErrors.confirmPassword?.[0]}
              >
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordFields.confirmPassword}
                  aria-invalid={Boolean(passwordErrors.confirmPassword?.[0])}
                  aria-describedby={passwordErrors.confirmPassword?.[0] ? formFieldMessageId("confirmPassword") : undefined}
                  onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                />
              </FormField>
            </fieldset>
            {passwordError && (
              <p role="alert" className="text-sm text-destructive">
                {passwordError}
              </p>
            )}
            {passwordSaved && (
              <p role="status" className="flex items-center gap-2 text-sm text-primary">
                <Check size={17} aria-hidden="true" />Senha atualizada.
              </p>
            )}
            <Button
              type="submit"
              variant="outline"
              disabled={passwordMutation.isPending || !passwordFields.currentPassword || !passwordFields.newPassword || !passwordFields.confirmPassword}
            >
              {passwordMutation.isPending ? "Atualizando…" : "Alterar senha"}
            </Button>
          </form>
        </section>

        <div className="mt-7 flex flex-col items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
          {saved && (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-primary"
            >
              <Check size={17} aria-hidden="true" />
              Perfil atualizado.
            </p>
          )}
          {formError && (
            <div className="w-full rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <p role="alert">{formError}</p>
              {saveMutation.error &&
                axios.isAxiosError(saveMutation.error) &&
                saveMutation.error.response?.status === 409 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => void refreshProfile()}
                  >
                    Recarregar dados
                  </Button>
                )}
            </div>
          )}
          {hasChanges && (
            <Button
              className="w-full sm:w-auto sm:order-1"
              type="button"
              variant="outline"
              disabled={
                saveMutation.isPending ||
                avatarMutation.isPending ||
                removeAvatarMutation.isPending
              }
              onClick={discardChanges}
            >
              Descartar
            </Button>
          )}
          <Button
            className="w-full sm:w-auto sm:order-2"
            form="profile-form"
            type="submit"
            disabled={
              !hasChanges ||
              saveMutation.isPending ||
              avatarMutation.isPending ||
              removeAvatarMutation.isPending
            }
          >
            {saveMutation.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>

        <div className="mt-8 border-t border-border pt-3 md:hidden">
          <Button
            variant="ghost"
            className="w-full justify-start px-0 text-muted-foreground"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut size={18} aria-hidden="true" />
            {logoutMutation.isPending ? "Saindo…" : "Sair"}
          </Button>
        </div>
      </div>
    </section>
  );
}
