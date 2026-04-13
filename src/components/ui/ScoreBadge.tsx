interface ScoreBadgeProps {
  score: number
  passed: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
}

export function ScoreBadge({
  score,
  passed,
  size = 'md',
  showLabel = true,
  animate = true,
}: ScoreBadgeProps) {
  const sizeStyles = {
    sm: 'text-lg w-12 h-12',
    md: 'text-2xl w-16 h-16',
    lg: 'text-4xl w-24 h-24',
  }

  const getScoreColor = () => {
    if (score >= 90) return 'text-aura-success border-aura-success/40 bg-aura-success/10'
    if (score >= 70) return 'text-aura-gold border-aura-gold/40 bg-aura-gold/10'
    if (score >= 50) return 'text-aura-purple border-aura-purple/40 bg-aura-purple/10'
    return 'text-aura-error border-aura-error/40 bg-aura-error/10'
  }

  const getLabel = () => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Great'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Keep Trying'
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${animate ? 'animate-score-reveal' : ''}`}>
      <div
        className={`${sizeStyles[size]} ${getScoreColor()} rounded-full border-2 flex items-center justify-center font-bold`}
      >
        {score}
      </div>
      {showLabel && (
        <div className="flex flex-col items-center">
          <span className={`text-sm font-medium ${passed ? 'text-aura-success' : 'text-aura-error'}`}>
            {passed ? 'PASSED' : 'NOT PASSED'}
          </span>
          <span className="text-xs text-aura-text-dim">{getLabel()}</span>
        </div>
      )}
    </div>
  )
}
