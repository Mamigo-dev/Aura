import { useState, useMemo } from 'react'
import type {
  ProExercise,
  ProExerciseResult,
  ToneSwitchContent,
  NaturalnessScore,
} from '../../types/professional'
import { calculateNaturalnessComposite } from '../../types/professional'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface ToneSwitchProps {
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

export function ToneSwitch({ exercise, onComplete }: ToneSwitchProps) {
  const content = exercise.content as ToneSwitchContent

  const [responses, setResponses] = useState<string[]>(() =>
    content.audiences.map(() => '')
  )
  const [submitted, setSubmitted] = useState(false)
  const [audienceScores, setAudienceScores] = useState<
    { registerMatchScore: number; scores: NaturalnessScore }[]
  >([])
  const [startTime] = useState(Date.now())

  const allFilled = responses.every((r) => r.trim().length > 0)

  const handleResponseChange = (index: number, value: string) => {
    setResponses((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSubmit = () => {
    if (!allFilled) return

    const perAudience = content.audiences.map(() => {
      const scores = generateMockScores()
      const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
      return {
        registerMatchScore: rand(50, 95),
        scores,
      }
    })

    setAudienceScores(perAudience)
    setSubmitted(true)
  }

  // Calculate register spread: how different the 3 versions are
  const registerSpread = useMemo(() => {
    if (!submitted || responses.length < 2) return 0

    // Simple heuristic: compare word overlap between pairs
    const wordSets = responses.map((r) =>
      new Set(r.toLowerCase().split(/\s+/).filter(Boolean))
    )

    let totalDiff = 0
    let pairs = 0
    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const union = new Set([...wordSets[i], ...wordSets[j]])
        const intersection = [...wordSets[i]].filter((w) => wordSets[j].has(w))
        const jaccard = union.size > 0 ? 1 - intersection.length / union.size : 0
        totalDiff += jaccard
        pairs++
      }
    }

    return Math.round((totalDiff / (pairs || 1)) * 100)
  }, [submitted, responses])

  const handleComplete = () => {
    const allNaturalnessScores = audienceScores.map((a) => a.scores)
    const avgScores: NaturalnessScore = {
      naturalness: Math.round(allNaturalnessScores.reduce((s, sc) => s + sc.naturalness, 0) / allNaturalnessScores.length),
      registerMatch: Math.round(allNaturalnessScores.reduce((s, sc) => s + sc.registerMatch, 0) / allNaturalnessScores.length),
      culturalFit: Math.round(allNaturalnessScores.reduce((s, sc) => s + sc.culturalFit, 0) / allNaturalnessScores.length),
      conciseness: Math.round(allNaturalnessScores.reduce((s, sc) => s + sc.conciseness, 0) / allNaturalnessScores.length),
    }

    const composite = calculateNaturalnessComposite(avgScores)
    const elapsed = Math.round((Date.now() - startTime) / 1000)

    const result: ProExerciseResult = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      userId: '',
      completedAt: new Date().toISOString(),
      score: composite,
      passed: composite >= exercise.passingScore,
      timeSpentSeconds: elapsed,
      scores: avgScores,
      feedback: registerSpread >= 60
        ? 'Great register flexibility! Your versions are distinct and appropriate for each audience.'
        : 'Try to differentiate your tone more between audiences. Each version should feel distinct.',
      details: {
        type: 'tone_switch',
        audienceResponses: content.audiences.map((aud, i) => ({
          audience: aud.label,
          response: responses[i],
          registerMatchScore: audienceScores[i]?.registerMatchScore ?? 0,
        })),
        registerSpread,
      },
    }
    onComplete(result)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Base message */}
      <Card variant="aura">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-aura-text-dim uppercase tracking-wide">Base Message</span>
          <p className="text-lg text-aura-text leading-relaxed">{content.baseMessage}</p>
        </div>
      </Card>

      {/* Context */}
      <div className="px-1">
        <span className="text-sm text-aura-text-dim">Context: </span>
        <span className="text-sm text-aura-text font-medium">{content.context}</span>
      </div>

      {!submitted ? (
        <>
          {/* Audience cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.audiences.map((audience, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 p-4 rounded-xl bg-aura-surface border border-aura-border"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-aura-purple">{audience.label}</span>
                  <span className="text-xs text-aura-text-dim">{audience.description}</span>
                </div>
                <textarea
                  value={responses[index]}
                  onChange={(e) => handleResponseChange(index, e.target.value)}
                  placeholder={`Write for ${audience.label}...`}
                  className="w-full min-h-[120px] p-3 rounded-lg bg-aura-midnight border border-aura-border text-aura-text placeholder:text-aura-text-dim/50 focus:outline-none focus:border-aura-purple/50 focus:ring-1 focus:ring-aura-purple/30 resize-y text-sm leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button variant="gold" onClick={handleSubmit} disabled={!allFilled}>
              Submit All
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Register spread */}
          <div className="flex flex-col items-center gap-2 py-3">
            <span className="text-xs text-aura-text-dim uppercase tracking-wide">Register Spread</span>
            <span className={`text-3xl font-bold ${registerSpread >= 60 ? 'text-aura-success' : registerSpread >= 40 ? 'text-aura-gold' : 'text-aura-error'}`}>
              {registerSpread}
            </span>
            <span className="text-xs text-aura-text-dim">
              Higher = more differentiation between versions
            </span>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.audiences.map((audience, index) => {
              const matchScore = audienceScores[index]?.registerMatchScore ?? 0
              return (
                <Card key={index} variant="default">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-aura-purple">{audience.label}</span>
                      <span className={`text-sm font-bold ${matchScore >= 70 ? 'text-aura-success' : 'text-aura-gold'}`}>
                        {matchScore}
                      </span>
                    </div>
                    <p className="text-sm text-aura-text leading-relaxed">{responses[index]}</p>
                    {/* Register match bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-aura-text-dim shrink-0">Match</span>
                      <div className="flex-1 h-1.5 bg-aura-midnight rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            matchScore >= 70 ? 'bg-aura-success' : matchScore >= 50 ? 'bg-aura-gold' : 'bg-aura-error'
                          }`}
                          style={{ width: `${matchScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

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
