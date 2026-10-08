import type { ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formFieldMessageId } from '@/lib/form-field'

type FormFieldProps = {
  id: string
  label: string
  children: ReactNode
  required?: boolean
  readOnly?: boolean
  description?: string
  error?: string
  className?: string
  labelClassName?: string
  labelAdornment?: ReactNode
}

export function FormField({
  id, label, children, required = false, readOnly = false, description, error, className,
  labelClassName, labelAdornment,
}: FormFieldProps) {
  const message = error ?? description
  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      <label htmlFor={id} className={cn('block text-sm font-medium', readOnly && 'flex items-center justify-between gap-2', labelClassName)}>
        <span>{label}{required && <span aria-hidden="true" className="ml-1 text-text-coral">*</span>}</span>
        {labelAdornment ?? (readOnly && <span className="inline-flex shrink-0 text-secondary" title="Campo somente leitura"><LockKeyhole size={14} aria-hidden="true" /></span>)}
      </label>
      {children}
      {message && <p id={formFieldMessageId(id)} className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{message}</p>}
    </div>
  )
}
