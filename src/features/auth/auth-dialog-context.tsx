import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthDialogContext } from './auth-dialog-store'
import type { AuthDialogContextValue, AuthDialogRequest } from './auth-dialog-store'

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<AuthDialogRequest | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const value = useMemo<AuthDialogContextValue>(() => ({
    request,
    open: (mode, returnTo, trigger) => {
      triggerRef.current = trigger
      setRequest({ mode, returnTo })
    },
    close: () => {
      setRequest(null)
      requestAnimationFrame(() => {
        if (triggerRef.current?.isConnected) triggerRef.current.focus()
        triggerRef.current = null
      })
    },
    switchMode: mode => setRequest(current => current ? { ...current, mode } : current),
  }), [request])

  return <AuthDialogContext.Provider value={value}>{children}</AuthDialogContext.Provider>
}
