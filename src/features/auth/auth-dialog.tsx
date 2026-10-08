import { useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AuthDialogMode } from "./auth-dialog-types";
import { AuthForm } from "./auth-form";
import { safeReturnTo } from "./auth-utils";

export function AuthDialog({
  mode,
  returnTo,
  onClose,
  onSwitchMode,
}: {
  mode: AuthDialogMode;
  returnTo: string;
  onClose: () => void;
  onSwitchMode: (mode: AuthDialogMode) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-title"
      className="auth-dialog overflow-y-auto rounded-lg border border-border border-b-primary bg-card text-card-foreground shadow-2xl"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const clickedOutside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (clickedOutside) onClose();
      }}
    >
      <header className="auth-modal-header">
        <nav aria-label="Autenticação" className="auth-modal-tabs">
          <button
            type="button"
            aria-pressed={mode === "login"}
            className={
              mode === "login" ? "auth-modal-tab is-active" : "auth-modal-tab"
            }
            onClick={() => onSwitchMode("login")}
          >
            Entrar
          </button>
          <span aria-hidden="true" className="auth-modal-tab-divider" />
          <button
            type="button"
            aria-pressed={mode === "register"}
            className={
              mode === "register"
                ? "auth-modal-tab is-active"
                : "auth-modal-tab"
            }
            onClick={() => onSwitchMode("register")}
          >
            Criar conta
          </button>
        </nav>
        <button
          type="button"
          aria-label="Fechar janela de autenticação"
          onClick={onClose}
          className="auth-modal-close"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="auth-modal-content">
        <AuthForm
          key={mode}
          mode={mode}
          returnTo={returnTo}
          presentation="dialog"
          onSwitchMode={onSwitchMode}
          onAuthenticated={() => {
            onClose();
            router.history.push(safeReturnTo(returnTo));
          }}
        />
      </div>
    </dialog>
  );
}
