import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'aura'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  hoverable?: boolean
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  hoverable = false,
  className = '',
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-aura-surface border border-aura-border',
    glass: 'glass',
    gradient: 'gradient-card',
    aura: 'bg-aura-surface border-l-4 border-l-aura-gold border border-aura-border/50',
  }

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  }

  const hoverStyles = hoverable
    ? 'cursor-pointer hover:border-aura-purple/50 hover:shadow-lg hover:shadow-aura-purple/10 transition-all duration-200'
    : ''

  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
