import { useState, useMemo } from 'react'
import type {
  ProExercise,
  ProExerciseResult,
  WritingRewriteContent,
  NaturalnessScore,
} from '../../types/professional'
import { calculateNaturalnessComposite } from '../../types/professional'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface WritingRewriteProps {
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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getTagLabel(content: WritingRewriteContent): string {
  const lower = content.problemDescription.toLowerCase()
  if (lower.includes('robotic') || lower.includes('robot')) return 'Robotic'
  if (lower.includes('legal') || lower.includes('formal')) return 'Too Formal'
  if (lower.includes('stiff')) return 'Too Stiff'
  if (lower.includes('cold')) return 'Too Cold'
  return 'Too Formal'
}

function getImprovements(original: string, rewrite: string): string[] {
  const improvements: string[] = []
  const origWords = countWords(original)
  const rewriteWords = countWords(rewrite)

  if (rewriteWords < origWords) {
    improvements.push(`Shorter: ${origWords} words -> ${rewriteWords} words`)
  }

  // Check for contractions
  const contractions = ["don't", "won't", "can't", "I'm", "we're", "they're", "it's", "that's", "let's", "I'll", "we'll"]
  const hasContractions = contractions.some((c) => rewrite.toLowerCase().includes(c))
  if (hasContractions) {
    improvements.push('Uses natural contractions')
  }

  // Check for simpler vocabulary
  const formalWords = ['utilize', 'facilitate', 'implement', 'regarding', 'pursuant', 'hereby', 'aforementioned', 'subsequently']
  const origHasFormal = formalWords.some((w) => original.toLowerCase().includes(w))
  const rewriteHasFormal = formalWords.some((w) => rewrite.toLowerCase().includes(w))
  if (origHasFormal && !rewriteHasFormal) {
    improvements.push('Replaced formal vocabulary with everyday words')
  }

  // Check for shorter sentences
  const origSentences = original.split(/[.!?]+/).filter(Boolean)
  const rewriteSentences = rewrite.split(/[.!?]+/).filter(Boolean)
  const avgOrigLen = origSentences.reduce((s, sent) => s + countWords(sent), 0) / (origSentences.length || 1)
  const avgRewriteLen = rewriteSentences.reduce((s, sent) => s + countWords(sent), 0) / (rewriteSentences.length || 1)
  if (avgRewriteLen < avgOrigLen * 0.85) {
    improvements.push('Shorter, punchier sentences')
  }

  if (improvements.length === 0) {
    improvements.push('Attempted a more casual tone')
  }

  return improvements
}

export function WritingRewrite({ exercise, onComplete }: WritingRewriteProps) {
  const content = exercise.content as WritingRewriteContent

  const [userRewrite, setUserRewrite] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<NaturalnessScore | null>(null)
  const [startTime] = useState(Date.now())

  const originalWordCount = useMemo(() => countWords(content.originalText), [content.originalText])
  const rewriteWordCount = useMemo(() => countWords(userRewrite), [userRewrite])

  const tagLabel = useMemo(() => getTagLabel(content), [content])

  const improvements = useMemo(
    () => (submitted ? getImprovements(content.originalText, userRewrite) : []),
    [submitted, content.originalText, userRewrite]
  )

  const handleSubmit = () => {
    if (!userRewrite.trim()) return
    const mockScores = generateMockScores()
    setScores(mockScores)
    setSubmitted(true)
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
      feedback: composite >= 70
        ? 'Nice rewrite! It reads much more naturally now.'
        : 'Good start, but it could sound even more natural. Try reading it out loud.',
      details: {
        type: 'writing_rewrite',
        rewrittenText: userRewrite,
      },
    }
    onComplete(result)
  }

  const targetRegisterLabel = content.targetRegister.charAt(0).toUpperCase() + content.targetRegister.slice(1)

  return (
    <div className="flex flex-col gap-5">
      {/* Original text card */}
      <Card variant="default">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-error/20 text-aura-error">
              {tagLabel}
            </span>
          </div>
          <p className="text-base text-aura-text leading-relaxed">{content.originalText}</p>
          <div className="flex items-center gap-1 text-xs text-aura-text-dim">
            <span>{originalWordCount} words</span>
          </div>
        </div>
      </Card>

      {/* Source + target context */}
      <div className="flex flex-wrap gap-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-aura-text-dim">Source:</span>
          <span className="text-sm text-aura-text font-medium">{content.sourceContext}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-aura-text-dim">Target register:</span>
          <span className="text-sm text-aura-purple font-medium">{targetRegisterLabel}</span>
        </div>
      </div>

      {/* Problem description */}
      <Card variant="glass" padding="sm">
        <p className="text-sm text-aura-text-dim leading-relaxed">{content.problemDescription}</p>
      </Card>

      {!submitted ? (
        <div className="flex flex-col gap-3">
          {/* Textarea */}
          <textarea
            value={userRewrite}
            onChange={(e) => setUserRewrite(e.target.value)}
            placeholder="Rewrite it here to sound more natural..."
            className="w-full min-h-[180px] p-4 rounded-xl bg-aura-surface border border-aura-border text-aura-text placeholder:text-aura-text-dim/50 focus:outline-none focus:border-aura-purple/50 focus:ring-1 focus:ring-aura-purple/30 resize-y text-base leading-relaxed"
          />

          {/* Word count comparison */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-aura-text-dim">
              {rewriteWordCount} words
              {rewriteWordCount > 0 && (
                <span className={rewriteWordCount < originalWordCount ? ' text-aura-success' : rewriteWordCount > originalWordCount ? ' text-aura-error' : ''}>
                  {' '}({rewriteWordCount < originalWordCount ? '-' : '+'}{Math.abs(rewriteWordCount - originalWordCount)} vs original)
                </span>
              )}
            </span>
            {rewriteWordCount > 0 && rewriteWordCount <= originalWordCount && (
              <span className="text-xs text-aura-success">Shorter is usually better for casual</span>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button variant="gold" onClick={handleSubmit} disabled={!userRewrite.trim()}>
              Submit
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Side-by-side before/after */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-aura-error uppercase tracking-wide">Before</span>
                  <span className="text-xs text-aura-text-dim">{originalWordCount} words</span>
                </div>
                <p className="text-sm text-aura-text-dim leading-relaxed">{content.originalText}</p>
              </div>
            </Card>

            <Card variant="default" className="border-aura-purple/30">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-aura-purple uppercase tracking-wide">After</span>
                  <span className="text-xs text-aura-text-dim">{rewriteWordCount} words</span>
                </div>
                <p className="text-sm text-aura-text leading-relaxed">{userRewrite}</p>
              </div>
            </Card>
          </div>

          {/* Score bars */}
          {scores && <NaturalnessScoreBars scores={scores} />}

          {/* Improvements */}
          <Card variant="glass">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-aura-gold uppercase tracking-wide font-medium">
                Improvements Detected
              </span>
              <ul className="flex flex-col gap-1.5">
                {improvements.map((imp, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-aura-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-aura-success shrink-0" />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
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

// --- Naturalness Score Bars ---
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
