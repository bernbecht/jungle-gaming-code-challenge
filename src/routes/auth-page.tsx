import { useRouter, useSearch } from '@tanstack/react-router'
import { AuthForm } from '@/features/auth/auth-form'
import { safeReturnTo } from '@/features/auth/auth-utils'
import type { AuthDialogMode } from '@/features/auth/auth-dialog-types'

export function AuthPage({ mode }: { mode: AuthDialogMode }) {
  const search = useSearch({ from: mode === 'register' ? '/register' : '/login' })
  const router = useRouter()
  return (
    <section className="mx-auto max-w-md py-12 md:py-20" aria-labelledby="auth-title">
      <AuthForm
        mode={mode}
        returnTo={search.returnTo}
        onAuthenticated={() => router.history.push(safeReturnTo(search.returnTo))}
      />
    </section>
  )
}
