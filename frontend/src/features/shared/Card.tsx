import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered'
}

const variants = {
  default: 'bg-white shadow-lg shadow-gray-200/50',
  glass: 'bg-white/70 backdrop-blur-xl shadow-lg shadow-gray-200/30',
  bordered: 'bg-white border-2 border-gray-100',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-6 transition-all duration-200',
          variants[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'
