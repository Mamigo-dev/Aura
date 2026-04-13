interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'card'
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full',
    circle: 'w-12 h-12 rounded-full',
    card: 'h-32 w-full rounded-2xl',
  }

  return <div className={`skeleton ${variantStyles[variant]} ${className}`} />
}

export function ExerciseCardSkeleton() {
  return (
    <div className="gradient-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-2/3 h-3" />
    </div>
  )
}
