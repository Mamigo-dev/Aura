interface ScoreBadgeProps {
  score: number
  passed: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
  scoredBy?: 'ai' | 'local'
}

export function ScoreBadge({
  score,
  passed,
  size = 'md',
  showLabel = true,
  animate = true,
  scoredBy = 'local',
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
        <div className="flex flex-col items-center gap-1">
          <span className={`text-sm font-medium ${passed ? 'text-aura-success' : 'text-aura-error'}`}>
            {passed ? 'PASSED' : 'NOT PASSED'}
          </span>
          <span className="text-xs text-aura-text-dim">{getLabel()}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            scoredBy === 'ai'
              ? 'bg-aura-purple/20 text-aura-purple'
              : 'bg-aura-surface text-aura-text-dim'
          }`}>
            {scoredBy === 'ai' ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                AI Scored
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <path d="M9 9h6" />
                  <path d="M9 15h4" />
                </svg>
                Local
              </>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
