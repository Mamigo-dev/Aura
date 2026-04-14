import { useState, useMemo } from 'react'
import type {
  ProExercise,
  ProExerciseResult,
  RegisterDownshiftContent,
  NaturalnessScore,
} from '../../types/professional'
import { calculateNaturalnessComposite } from '../../types/professional'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface RegisterDownshiftProps {
  exercise: ProExercise
  onComplete: (result: ProExerciseResult) => void
}

function generateMockScores(): NaturalnessScore {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  return {
    naturalness: rand(50, 90),
    registerMatch: rand(50, 85),
    culturalFit: rand(40, 80),
    conciseness: rand(50, 90),
  }
}

function generateFeedback(scores: NaturalnessScore): string {
  const composite = calculateNaturalnessComposite(scores)
  if (composite >= 80) return 'Great job! Your rewrite sounds natural and fits the context well.'
  if (composite >= 65) return 'Good effort. Try using more contractions and everyday vocabulary to sound less formal.'
  return 'Your rewrite still sounds a bit formal. Think about how you would actually say this to a friend.'
}

export function RegisterDownshift({ exercise, onComplete }: RegisterDownshiftProps) {
  const content = exercise.content as RegisterDownshiftContent

  // Rewrite mode state
  const [userRewrite, setUserRewrite] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<NaturalnessScore | null>(null)
  const [startTime] = useState(Date.now())

  // Pick register mode state
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const feedback = useMemo(() => (scores ? generateFeedback(scores) : ''), [scores])

  const handleSubmitRewrite = () => {
    if (!userRewrite.trim()) return
    const mockScores = generateMockScores()
    setScores(mockScores)
    setSubmitted(true)
  }

  const handlePickRegister = (key: string) => {
    if (revealed) return
    setSelectedOption(key)
    setRevealed(true)
  }

  const handleComplete = () => {
    const finalScores = scores ?? generateMockScores()
    const composite = calculateNaturalnessComposite(finalScores)
    const elapsed = Math.round((Date.now() - startTime) / 1000)

    const result: ProExerciseResult = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      userId: '',
      completedAt: new Date().toISOString(),
      score: composite,
      passed: composite >= exercise.passingScore,
      timeSpentSeconds: elapsed,
      scores: finalScores,
      feedback,
      details: {
        type: 'register_downshift',
        userResponse: content.mode === 'rewrite' ? userRewrite : (selectedOption ?? ''),
      },
    }
    onComplete(result)
  }

  // ---- Rewrite Mode ----
  if (content.mode === 'rewrite') {
    return (
      <div className="flex flex-col gap-5">
        {/* Formal sentence card */}
        <Card variant="aura">
          <div className="flex flex-col gap-2">
            <span className="inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-purple/20 text-aura-purple uppercase tracking-wide">
              Formal
            </span>
            <p className="text-lg text-aura-text leading-relaxed">{content.formalSentence}</p>
          </div>
        </Card>

        {/* Context */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-aura-text-dim">Context:</span>
          <span className="text-sm text-aura-text font-medium">{content.context}</span>
        </div>

        {!submitted ? (
          <div className="flex flex-col gap-3">
            {/* Textarea */}
            <textarea
              value={userRewrite}
              onChange={(e) => setUserRewrite(e.target.value)}
              placeholder="Rewrite this in a more natural, casual way..."
              className="w-full min-h-[140px] p-4 rounded-xl bg-aura-surface border border-aura-border text-aura-text placeholder:text-aura-text-dim/50 focus:outline-none focus:border-aura-purple/50 focus:ring-1 focus:ring-aura-purple/30 resize-y text-base leading-relaxed"
            />

            {/* Character count */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-aura-text-dim">
                {userRewrite.length} characters
              </span>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                variant="gold"
                onClick={handleSubmitRewrite}
                disabled={!userRewrite.trim()}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* User's rewrite */}
            <Card variant="glass">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-aura-text-dim uppercase tracking-wide">Your rewrite</span>
                <p className="text-base text-aura-text">{userRewrite}</p>
              </div>
            </Card>

            {/* Naturalness score bars */}
            {scores && <NaturalnessScoreBars scores={scores} />}

            {/* Feedback */}
            <Card variant="default" padding="sm">
              <p className="text-sm text-aura-text leading-relaxed">{feedback}</p>
            </Card>

            {/* Done */}
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleComplete}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- Pick Register Mode ----
  const options = content.registerOptions
  const correctKey = getCorrectRegister(content.context)

  return (
    <div className="flex flex-col gap-5">
      {/* Context situation */}
      <Card variant="aura">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-aura-text-dim uppercase tracking-wide">Situation</span>
          <p className="text-base text-aura-text leading-relaxed">{content.context}</p>
        </div>
      </Card>

      <p className="text-sm text-aura-text-dim px-1">
        Pick the response that best matches this context:
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options &&
          (['formal', 'natural', 'casual'] as const).map((key) => {
            const isSelected = selectedOption === key
            const isCorrect = key === correctKey
            let borderClass = 'border-aura-border'
            let bgClass = ''

            if (revealed) {
              if (isCorrect) {
                borderClass = 'border-green-500'
                bgClass = 'bg-aura-success/20'
              } else if (isSelected && !isCorrect) {
                borderClass = 'border-red-500'
                bgClass = 'bg-aura-error/20'
              }
            } else if (isSelected) {
              borderClass = 'border-aura-purple'
            }

            return (
              <button
                key={key}
                onClick={() => handlePickRegister(key)}
                disabled={revealed}
                className={`w-full text-left p-4 rounded-xl border ${borderClass} ${bgClass} transition-all duration-200 hover:border-aura-purple/50 disabled:cursor-default`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-aura-text-dim uppercase tracking-wide">
                    {key}
                  </span>
                  <p className="text-base text-aura-text">{options[key]}</p>
                </div>
              </button>
            )
          })}
      </div>

      {/* Revealed result */}
      {revealed && (
        <div className="flex flex-col gap-3">
          <Card variant="default" padding="sm">
            <p className="text-sm text-aura-text">
              {selectedOption === correctKey
                ? 'Correct! This register matches the context perfectly.'
                : `The best match was "${correctKey}". In this situation, you would want a ${correctKey} tone.`}
            </p>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleComplete}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Helper: determine correct register from context ---
function getCorrectRegister(context: string): 'formal' | 'natural' | 'casual' {
  const lower = context.toLowerCase()
  if (lower.includes('friend') || lower.includes('buddy') || lower.includes('slack')) return 'casual'
  if (lower.includes('boss') || lower.includes('client') || lower.includes('ceo')) return 'formal'
  return 'natural'
}

// --- Naturalness Score Bars Component ---
function NaturalnessScoreBars({ scores }: { scores: NaturalnessScore }) {
  const composite = calculateNaturalnessComposite(scores)

  const dimensions: { label: string; value: number }[] = [
    { label: 'Naturalness', value: scores.naturalness },
    { label: 'Register Match', value: scores.registerMatch },
    { label: 'Cultural Fit', value: scores.culturalFit },
    { label: 'Conciseness', value: scores.conciseness },
  ]

  const getBarColor = (value: number) => {
    if (value >= 80) return 'bg-aura-success'
    if (value >= 60) return 'bg-aura-gold'
    return 'bg-aura-error'
  }

  return (
    <Card variant="default">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide">
            Naturalness Score
          </h3>
          <span className="text-lg font-bold text-aura-gold">{composite}</span>
        </div>

        {dimensions.map((dim) => (
          <div key={dim.label} className="flex items-center gap-3">
            <span className="text-sm text-aura-text-dim w-32 shrink-0">{dim.label}</span>
            <div className="flex-1 h-2 bg-aura-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getBarColor(dim.value)}`}
                style={{ width: `${dim.value}%` }}
              />
            </div>
            <span className="text-sm font-medium text-aura-text w-10 text-right">{dim.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
