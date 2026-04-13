import type { ReactNode } from 'react'

interface GradientTextProps {
  children: ReactNode
  className?: string
  variant?: 'aurora' | 'gold'
}

export function GradientText({ children, className = '', variant = 'aurora' }: GradientTextProps) {
  const gradientClass =
    variant === 'aurora' ? 'gradient-aura-text' : 'bg-gradient-to-r from-aura-gold-dim via-aura-gold to-aura-gold-light bg-clip-text text-transparent'

  return <span className={`${gradientClass} ${className}`}>{children}</span>
}
