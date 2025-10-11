import * as React from 'react'

import { cn } from '@/lib/utils'

interface InputProps extends React.ComponentProps<'input'> {
  size?: 'default' | 'mobile' | 'mobile-lg'
}

function Input({ className, type, size = 'default', ...props }: InputProps) {
  const sizeClasses = {
    default: 'h-9 px-3 py-1 text-base md:text-sm',
    mobile: 'h-12 px-4 text-base md:h-9 md:px-3 md:text-sm',
    'mobile-lg': 'h-14 px-6 text-lg md:h-10 md:px-4 md:text-base'
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        'hover:border-primary/60 hover:shadow-sm',
        'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[2px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
