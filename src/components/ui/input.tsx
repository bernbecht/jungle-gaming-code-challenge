import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex min-h-12 w-full rounded-md border border-input bg-transparent px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default read-only:border-dashed read-only:border-secondary/60 read-only:bg-primary/5 read-only:text-secondary read-only:focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-destructive md:min-h-10 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
