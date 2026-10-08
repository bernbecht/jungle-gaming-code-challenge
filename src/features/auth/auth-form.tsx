import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  LoginInput,
  Profile,
  RegisterInput,
} from "@/contracts/marketplace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { signIn, signUp } from "./api";
import type { AuthDialogMode } from "./auth-dialog-types";
import { cartQuery, getGuestId, mergeGuestCart } from "@/features/cart/api";
import type { Cart } from "@/contracts/marketplace";

export function AuthForm({
  mode,
  returnTo,
  onAuthenticated,
  onSwitchMode,
  presentation = "page",
}: {
  mode: AuthDialogMode;
  returnTo?: string;
  onAuthenticated: (user: Profile) => void;
  onSwitchMode?: (mode: AuthDialogMode) => void;
  presentation?: "page" | "dialog";
}) {
  const isRegister = mode === "register";
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
  const mutation = useMutation({
    mutationFn: (input: LoginInput | RegisterInput) =>
      isRegister ? signUp(input as RegisterInput) : signIn(input as LoginInput),
    onMutate: async () => {
      try {
        const guestId = getGuestId();
        const guestCart = await queryClient.ensureQueryData(cartQuery(`guest:${guestId}`));
        return { guestId, guestCart };
      } catch {
        return undefined;
      }
    },
    onSuccess: async (user, _input, context) => {
      let mergedCart: Cart | undefined;
      if (context?.guestCart) {
        try {
          mergedCart = await mergeGuestCart(context.guestId, context.guestCart.version);
        } catch {
          setNotice("Você entrou, mas não foi possível sincronizar o carrinho. Atualize a página para tentar novamente.");
        }
      }
      await queryClient.cancelQueries({ queryKey: ["session"] });
      queryClient.clear();
      queryClient.setQueryData(["session"], user);
      if (mergedCart) queryClient.setQueryData(["cart", `user:${user.id}`], mergedCart);
      onAuthenticated(user);
    },
    onError: (cause: unknown) => {
      const message =
        typeof cause === "object" && cause !== null && "response" in cause
          ? ((
              cause as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message ??
            "Não foi possível entrar agora.")
          : "Não foi possível entrar agora.";
      setError(message);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate(
      isRegister
        ? {
            displayName: values.displayName,
            username: values.username,
            email: values.email,
            password: values.password,
          }
        : { email: values.email, password: values.password },
    );
  }

  const switchTarget: AuthDialogMode = isRegister ? "login" : "register";
  const switchLabel = isRegister ? "Entrar" : "Cadastre-se";
  const dialogStyle = presentation === "dialog";
  return (
    <div className={dialogStyle ? "auth-modal-form" : ""}>
      <h1
        id="auth-title"
        className={dialogStyle ? "sr-only" : "text-3xl font-semibold"}
      >
        {isRegister ? "Criar perfil de colecionador" : "Entrar na Kurio"}
      </h1>
      <p
        className={
          dialogStyle ? "auth-modal-description" : "mt-3 text-muted-foreground"
        }
      >
        {isRegister
          ? "Crie sua conta para salvar favoritos e acompanhar suas compras."
          : dialogStyle
            ? "Entre para gerenciar sua carteira, coleção e perfil de criador."
            : "Entre para acessar seus favoritos e sua conta."}
      </p>
      <form
        className={dialogStyle ? "auth-modal-fields" : "mt-8 grid gap-5"}
        onSubmit={submit}
      >
        {isRegister && (
          <>
            <div
              className={
                dialogStyle
                  ? "auth-modal-field"
                  : "grid gap-2 text-sm font-medium"
              }
            >
              <label
                className={dialogStyle ? "sr-only" : undefined}
                htmlFor="display-name"
              >
                Nome de exibição
              </label>
              <Input
                className={dialogStyle ? "auth-modal-input" : undefined}
                id="display-name"
                placeholder={dialogStyle ? "Nome de exibição" : undefined}
                autoComplete="name"
                autoFocus
                required
                minLength={2}
                maxLength={60}
                value={values.displayName}
                onChange={(event) =>
                  setValues({ ...values, displayName: event.target.value })
                }
              />
            </div>
            <div
              className={
                dialogStyle
                  ? "auth-modal-field"
                  : "grid gap-2 text-sm font-medium"
              }
            >
              <label
                className={dialogStyle ? "sr-only" : undefined}
                htmlFor="username"
              >
                Nome de usuário
              </label>
              <Input
                className={dialogStyle ? "auth-modal-input" : undefined}
                id="username"
                placeholder={dialogStyle ? "Nome de usuário" : undefined}
                autoComplete="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9_]+"
                value={values.username}
                onChange={(event) =>
                  setValues({ ...values, username: event.target.value })
                }
              />
            </div>
          </>
        )}
        <div
          className={
            dialogStyle ? "auth-modal-field" : "grid gap-2 text-sm font-medium"
          }
        >
          <label
            className={dialogStyle ? "sr-only" : undefined}
            htmlFor="email"
          >
            E-mail
          </label>
          <Input
            className={dialogStyle ? "auth-modal-input" : undefined}
            id="email"
            placeholder={dialogStyle ? "contato@email.com" : undefined}
            type="email"
            autoComplete="email"
            autoFocus={!isRegister}
            required
            value={values.email}
            onChange={(event) =>
              setValues({ ...values, email: event.target.value })
            }
          />
        </div>
        <div
          className={
            dialogStyle
              ? "auth-modal-password"
              : "grid gap-2 text-sm font-medium"
          }
        >
          <label
            className={dialogStyle ? "sr-only" : undefined}
            htmlFor="password"
          >
            Senha
          </label>
          <Input
            className={dialogStyle ? "auth-modal-input" : undefined}
            id="password"
            placeholder={dialogStyle ? "Senha" : undefined}
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 8 : undefined}
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
          />
          {dialogStyle && (
            <button
              type="button"
              className="auth-modal-password-toggle"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </button>
          )}
          {dialogStyle && !isRegister && (
            <button
              type="button"
              className="auth-modal-forgot"
              onClick={() =>
                setNotice(
                  "A recuperação de senha não está disponível nesta demonstração.",
                )
              }
            >
              Esqueceu a senha?
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          className={dialogStyle ? "auth-modal-submit" : undefined}
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? "Aguarde…"
            : isRegister
              ? "Criar conta"
              : "Entrar"}
        </Button>
      </form>
      {dialogStyle && !isRegister && (
        <>
          <div className="auth-modal-divider">
            <span>Ou continue com</span>
          </div>
          <div className="auth-modal-socials">
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "O login com Google não está disponível nesta demonstração.",
                )
              }
            >
              <span aria-hidden="true" className="auth-modal-google">
                G
              </span>
              Continuar com Google
            </button>
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "O login com Facebook não está disponível nesta demonstração.",
                )
              }
            >
              <span aria-hidden="true" className="auth-modal-facebook">
                f
              </span>
              Continuar com Facebook
            </button>
          </div>
        </>
      )}
      {notice && (
        <p
          role="status"
          className={
            dialogStyle
              ? "auth-modal-notice"
              : "mt-3 text-sm text-muted-foreground"
          }
        >
          {notice}
        </p>
      )}
      {!dialogStyle && (
        <p className="mt-6 text-sm">
          {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          {onSwitchMode ? (
            <button
              type="button"
              onClick={() => onSwitchMode(switchTarget)}
              className="text-primary underline underline-offset-4"
            >
              {switchLabel}
            </button>
          ) : (
            <Link
              to={switchTarget === "login" ? "/login" : "/register"}
              search={{ returnTo }}
              className="text-primary underline underline-offset-4"
            >
              {switchLabel}
            </Link>
          )}
        </p>
      )}
      {!dialogStyle && !isRegister && (
        <p className="mt-5 text-xs text-muted-foreground">
          Conta de demonstração: collector-a@example.test · senha DemoNft!2026
        </p>
      )}
    </div>
  );
}
