import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'

  const variantStyles = {
    primary:
      'bg-aura-purple hover:bg-aura-deep-purple text-white shadow-lg shadow-aura-purple/20',
    secondary:
      'glass text-aura-text hover:bg-aura-surface-hi',
    ghost:
      'bg-transparent text-aura-text-dim hover:text-aura-text hover:bg-aura-surface/50',
    gold:
      'gradient-gold text-aura-midnight font-semibold shadow-lg shadow-aura-gold/20',
    danger:
      'bg-aura-error/20 text-aura-error hover:bg-aura-error/30 border border-aura-error/30',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
