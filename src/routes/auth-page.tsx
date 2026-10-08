import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginInput, RegisterInput } from "@/contracts/marketplace";
import { signIn, signUp } from "@/features/auth/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

function safeReturnTo(value: string | undefined) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/";
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const search = useSearch({ from: isRegister ? "/register" : "/login" });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [values, setValues] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
  const mutation = useMutation({
    mutationFn: (input: LoginInput | RegisterInput) =>
      isRegister ? signUp(input as RegisterInput) : signIn(input as LoginInput),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(["session"], user);
      router.history.push(safeReturnTo(search.returnTo));
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
  return (
    <section
      className="mx-auto max-w-md py-12 md:py-20"
      aria-labelledby="auth-title"
    >
      <h1 id="auth-title" className="text-3xl font-semibold">
        {isRegister ? "Criar perfil de colecionador" : "Entrar na Kurio"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {isRegister
          ? "Crie sua conta para salvar favoritos e acompanhar suas compras."
          : "Entre para acessar seus favoritos e sua conta."}
      </p>
      <form className="mt-8 grid gap-5" onSubmit={submit}>
        {isRegister && (
          <>
            <label
              className="grid gap-2 text-sm font-medium"
              htmlFor="display-name"
            >
              Nome de exibição
              <Input
                id="display-name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={60}
                value={values.displayName}
                onChange={(event) =>
                  setValues({ ...values, displayName: event.target.value })
                }
              />
            </label>
            <label
              className="grid gap-2 text-sm font-medium"
              htmlFor="username"
            >
              Nome de usuário
              <Input
                id="username"
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
            </label>
          </>
        )}
        <label className="grid gap-2 text-sm font-medium" htmlFor="email">
          E-mail
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) =>
              setValues({ ...values, email: event.target.value })
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="password">
          Senha
          <Input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 8 : undefined}
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Aguarde…"
            : isRegister
              ? "Criar conta"
              : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
        <Link
          to={isRegister ? "/login" : "/register"}
          search={{ returnTo: search.returnTo }}
          className="text-primary underline underline-offset-4"
        >
          {isRegister ? "Entrar" : "Cadastre-se"}
        </Link>
      </p>
      {!isRegister && (
        <p className="mt-5 text-xs text-muted-foreground">
          Conta de demonstração: collector-a@example.test · senha DemoNft!2026
        </p>
      )}
    </section>
  );
}
