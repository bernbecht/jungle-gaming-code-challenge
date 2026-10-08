import { createContext } from 'react'
import type { AuthDialogMode } from './auth-dialog-types'

export type AuthDialogRequest = { mode: AuthDialogMode; returnTo: string }
export type AuthDialogContextValue = {
  request: AuthDialogRequest | null
  open: (mode: AuthDialogMode, returnTo: string, trigger: HTMLElement) => void
  close: () => void
  switchMode: (mode: AuthDialogMode) => void
}

export const AuthDialogContext = createContext<AuthDialogContextValue | null>(null)
