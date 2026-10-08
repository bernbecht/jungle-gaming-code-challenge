import { useContext } from 'react'
import { AuthDialogContext } from './auth-dialog-store'

export function useAuthDialog() {
  const context = useContext(AuthDialogContext)
  if (!context) throw new Error('useAuthDialog deve ser usado dentro de AuthDialogProvider.')
  return context
}
