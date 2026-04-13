import { useState, useCallback, useMemo } from 'react'
import type { Exercise, WritingContent } from '../../types/exercise'
import type { ExerciseResult, WritingScore, SentenceFeedback } from '../../types/scoring'
import { calculateOverallScore } from '../../types/scoring'
import { useExerciseStore } from '../../stores/exerciseStore'
import { countWords } from '../../lib/scoring'
import { ExerciseWrapper } from './ExerciseWrapper'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface WritingProps {
  exercise: Exercise
  onComplete?: (result: ExerciseResult) => void
}

export function Writing({ exercise, onComplete }: WritingProps) {
  const content = exercise.content as WritingContent
  const { phase, elapsedSeconds, userInput, startExercise, setPhase, setUserInput, setResult } =
    useExerciseStore()

  const [isScoring, setIsScoring] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set())

  const wordCount = useMemo(() => countWords(userInput), [userInput])

  const isWithinRange = wordCount >= content.minWords && wordCount <= content.maxWords
  const isBelowMin = wordCount < content.minWords
  const isAboveMax = wordCount > content.maxWords

  const wordCountColor = useMemo(() => {
    if (wordCount === 0) return 'text-aura-text-dim'
    if (isWithinRange) return 'text-aura-success'
    return 'text-aura-error'
  }, [wordCount, isWithinRange])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (phase === 'ready') {
        startExercise()
      }
      setUserInput(e.target.value)
    },
    [phase, startExercise, setUserInput]
  )

  const handleSubmit = useCallback(async () => {
    if (isBelowMin) return

    setIsScoring(true)
    setPhase('scoring')

    // Simulate AI scoring delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate mock scores (12-18 per dimension, out of 20)
    const grammar = randomScore(12, 18)
    const vocabulary = randomScore(12, 18)
    const coherence = randomScore(12, 18)
    const taskFulfillment = randomScore(12, 18)
    const style = randomScore(12, 18)

    // Generate mock sentence feedback
    const sentences = userInput
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0)
      .slice(0, 5) // Limit to 5 sentences for feedback

    const sentenceFeedback: SentenceFeedback[] = sentences.map((sentence) => ({
      sentence,
      feedback: generateMockSentenceFeedback(),
      improved: sentence, // placeholder
    }))

    const details: WritingScore = {
      type: 'writing',
      grammar,
      vocabulary,
      coherence,
      taskFulfillment,
      style,
      wordCount,
      overallFeedback: generateOverallFeedback(grammar + vocabulary + coherence + taskFulfillment + style),
      sentenceFeedback,
    }

    const overallScore = calculateOverallScore('writing', details)

    const result: ExerciseResult = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      userId: '',
      completedAt: new Date().toISOString(),
      score: overallScore,
      passed: overallScore >= exercise.passingScore,
      timeSpentSeconds: elapsedSeconds,
      details,
    }

    setIsScoring(false)
    setResult(result)
  }, [isBelowMin, setPhase, userInput, wordCount, exercise, elapsedSeconds, setResult])

  const toggleFeedback = useCallback((index: number) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleComplete = useCallback(
    (result: ExerciseResult) => {
      onComplete?.(result)
    },
    [onComplete]
  )

  const writingResult = useExerciseStore.getState().result?.details as WritingScore | undefined

  return (
    <ExerciseWrapper exercise={exercise} onComplete={handleComplete}>
      {/* Prompt and context */}
      <Card variant="gradient">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-aura-text">{content.prompt}</h3>
          {content.context && (
            <p className="text-sm text-aura-text-dim leading-relaxed">{content.context}</p>
          )}
        </div>
      </Card>

      {/* Scoring overlay */}
      {isScoring && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-10 h-10 border-3 border-aura-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-aura-text-dim text-sm">Scoring your writing...</p>
        </div>
      )}

      {/* Writing area */}
      {phase !== 'completed' && !isScoring && (
        <div className="flex flex-col gap-2">
          <textarea
            value={userInput}
            onChange={handleTextChange}
            placeholder="Start writing here..."
            className="w-full min-h-[240px] p-4 rounded-xl bg-aura-surface border border-aura-border text-aura-text placeholder:text-aura-text-dim/50 focus:outline-none focus:border-aura-purple/50 focus:ring-1 focus:ring-aura-purple/30 resize-y text-base leading-relaxed"
          />

          {/* Word counter */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${wordCountColor}`}>
              {wordCount} / {content.minWords}-{content.maxWords} words
            </span>
            {isBelowMin && wordCount > 0 && (
              <span className="text-xs text-aura-error">
                {content.minWords - wordCount} more words needed
              </span>
            )}
            {isAboveMax && (
              <span className="text-xs text-aura-error">
                {wordCount - content.maxWords} words over limit
              </span>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isBelowMin}
            >
              Submit Writing
            </Button>
          </div>
        </div>
      )}

      {/* Detailed scoring results */}
      {phase === 'completed' && writingResult && (
        <div className="flex flex-col gap-4">
          {/* Dimension scores */}
          <Card variant="default">
            <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-4">
              Score Breakdown
            </h3>
            <div className="flex flex-col gap-3">
              <DimensionScore label="Grammar" score={writingResult.grammar} max={20} />
              <DimensionScore label="Vocabulary" score={writingResult.vocabulary} max={20} />
              <DimensionScore label="Coherence" score={writingResult.coherence} max={20} />
              <DimensionScore label="Task Fulfillment" score={writingResult.taskFulfillment} max={20} />
              <DimensionScore label="Style" score={writingResult.style} max={20} />
            </div>
          </Card>

          {/* Overall feedback */}
          <Card variant="glass" padding="sm">
            <p className="text-sm text-aura-text leading-relaxed">{writingResult.overallFeedback}</p>
          </Card>

          {/* Per-sentence feedback */}
          {writingResult.sentenceFeedback.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide">
                Sentence Feedback
              </h3>
              {writingResult.sentenceFeedback.map((fb, index) => (
                <div key={index} className="rounded-xl border border-aura-border overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-aura-surface text-left hover:bg-aura-surface/80 transition-colors"
                    onClick={() => toggleFeedback(index)}
                  >
                    <span className="text-sm text-aura-text truncate pr-4">
                      {fb.sentence.slice(0, 60)}
                      {fb.sentence.length > 60 ? '...' : ''}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-aura-text-dim shrink-0 transition-transform duration-200 ${
                        expandedFeedback.has(index) ? 'rotate-180' : ''
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {expandedFeedback.has(index) && (
                    <div className="px-4 py-3 border-t border-aura-border/50 bg-aura-surface/50">
                      <p className="text-sm text-aura-text-dim mb-2">{fb.feedback}</p>
                      {fb.improved !== fb.sentence && (
                        <div className="mt-2 pt-2 border-t border-aura-border/30">
                          <p className="text-xs text-aura-text-dim mb-1">Suggested improvement:</p>
                          <p className="text-sm text-aura-purple">{fb.improved}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ExerciseWrapper>
  )
}

function DimensionScore({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100

  const getColor = () => {
    if (pct >= 80) return 'bg-aura-success'
    if (pct >= 60) return 'bg-aura-gold'
    return 'bg-aura-error'
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-aura-text-dim w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-aura-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor()}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-aura-text w-12 text-right">
        {score}/{max}
      </span>
    </div>
  )
}

// Mock helpers

function randomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateMockSentenceFeedback(): string {
  const feedback = [
    'Good sentence structure with clear meaning.',
    'Consider using more varied vocabulary to strengthen this point.',
    'The transition here could be smoother. Try connecting it to the previous idea.',
    'Well-constructed argument with supporting detail.',
    'This sentence is a bit long. Consider breaking it into two for clarity.',
    'Effective use of descriptive language.',
    'The subject-verb agreement is correct and the tone is consistent.',
  ]
  return feedback[Math.floor(Math.random() * feedback.length)]
}

function generateOverallFeedback(totalScore: number): string {
  if (totalScore >= 85) {
    return 'Excellent writing. Your ideas are well-organized and clearly expressed with strong vocabulary choices and consistent grammar.'
  }
  if (totalScore >= 70) {
    return 'Good effort. Your writing demonstrates solid comprehension of the topic. Focus on varying your sentence structure and using more precise vocabulary.'
  }
  if (totalScore >= 55) {
    return 'Decent work. Your main ideas come through, but the writing could benefit from better organization and more careful proofreading for grammar.'
  }
  return 'Keep practicing. Focus on organizing your thoughts before writing, and review basic grammar rules to improve clarity.'
}
