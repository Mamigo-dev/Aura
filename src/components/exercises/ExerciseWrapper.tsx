import { type ReactNode, useEffect } from 'react'
import type { Exercise } from '../../types/exercise'
import type { ExerciseResult } from '../../types/scoring'
import { EXERCISE_TYPE_LABELS } from '../../types/exercise'
import { useExerciseStore } from '../../stores/exerciseStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ScoreBadge } from '../ui/ScoreBadge'

interface ExerciseWrapperProps {
  exercise: Exercise
  children: ReactNode
  onComplete: (result: ExerciseResult) => void
}

export function ExerciseWrapper({ exercise, children, onComplete }: ExerciseWrapperProps) {
  const {
    phase,
    elapsedSeconds,
    score,
    result,
    auraExample,
    setExercise,
    reset,
  } = useExerciseStore()

  useEffect(() => {
    setExercise(exercise)
    return () => {
      reset()
    }
  }, [exercise, setExercise, reset])

  useEffect(() => {
    if (result) {
      onComplete(result)
    }
  }, [result, onComplete])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleTryAgain = () => {
    reset()
    setExercise(exercise)
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
          <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-purple/20 text-aura-purple">
            {EXERCISE_TYPE_LABELS[exercise.type]}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 text-aura-text-dim">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-mono text-sm">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Progress indicator */}
      {exercise.timeLimit && phase === 'in_progress' && (
        <div className="w-full h-1.5 bg-aura-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-aura-purple rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min((elapsedSeconds / exercise.timeLimit) * 100, 100)}%`,
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col gap-5">
        {children}
      </div>

      {/* Completed state */}
      {phase === 'completed' && score !== null && result && (
        <div className="flex flex-col items-center gap-6 py-4">
          <ScoreBadge
            score={score}
            passed={result.passed}
            animate
          />

          {/* Aura example */}
          {auraExample && (
            <div className="w-full flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-aura-gold uppercase tracking-wide">
                Your Aura
              </h3>
              <Card variant="aura">
                <p className="text-aura-text leading-relaxed">
                  {renderHighlightedContent(auraExample.content, auraExample.highlights)}
                </p>
                <p className="mt-3 text-sm text-aura-text-dim italic">
                  {auraExample.explanation}
                </p>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <Button variant="secondary" className="flex-1" onClick={handleTryAgain}>
              Try Again
            </Button>
            <Button variant="primary" className="flex-1">
              Next Exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function renderHighlightedContent(content: string, highlights: string[]): ReactNode {
  if (!highlights.length) return content

  const parts: ReactNode[] = []
  let remaining = content
  let key = 0

  for (const phrase of highlights) {
    const idx = remaining.toLowerCase().indexOf(phrase.toLowerCase())
    if (idx === -1) continue

    if (idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
    }
    parts.push(
      <span key={key++} className="text-aura-gold font-medium">
        {remaining.slice(idx, idx + phrase.length)}
      </span>
    )
    remaining = remaining.slice(idx + phrase.length)
  }

  if (remaining) {
    parts.push(<span key={key++}>{remaining}</span>)
  }

  return parts.length > 0 ? <>{parts}</> : content
}
