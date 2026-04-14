import { useState, useMemo } from 'react'
import type {
  ProExercise,
  ProExerciseResult,
  SceneSimulationContent,
  NaturalnessScore,
} from '../../types/professional'
import { calculateNaturalnessComposite } from '../../types/professional'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Microphone } from '../speech/Microphone'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'

interface SceneSimulationProps {
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

const NATIVE_SUGGESTIONS: string[] = [
  "Hey, no worries at all! I'll get that over to you by end of day.",
  "Oh totally, I was actually thinking the same thing. Let me loop in the team.",
  "Yeah for sure! Let me take a quick look and get back to you.",
  "Sounds good to me! I'll ping you once it's done.",
  "Ha, yeah that's a great point. Let me dig into it a bit more.",
]

export function SceneSimulation({ exercise, onComplete }: SceneSimulationProps) {
  const content = exercise.content as SceneSimulationContent

  const [userResponse, setUserResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<NaturalnessScore | null>(null)
  const [startTime] = useState(Date.now())

  const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      onResult: (result) => {
        if (result.isFinal) {
          setUserResponse((prev) => prev + result.transcript)
        }
      },
    })

  const situationScore = useMemo(() => Math.floor(Math.random() * 30) + 60, [])
  const nativeSuggestion = useMemo(
    () => NATIVE_SUGGESTIONS[Math.floor(Math.random() * NATIVE_SUGGESTIONS.length)],
    []
  )

  const displayText = userResponse + (interimTranscript ? ` ${interimTranscript}` : '')

  const handleSubmit = () => {
    if (!displayText.trim()) return
    if (isListening) stopListening()

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
        ? 'Your response fits the scenario well. Keep it up!'
        : 'Try to match the tone to the situation more closely.',
      details: {
        type: 'scene_simulation',
        transcription: displayText,
        situationAppropriateness: situationScore,
      },
    }
    onComplete(result)
  }

  const useSpeech = content.responseMode === 'speech' || content.responseMode === 'both'
  const useText = content.responseMode === 'text' || content.responseMode === 'both'

  return (
    <div className="flex flex-col gap-5">
      {/* Scenario card */}
      <Card variant="gradient">
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-aura-text">{content.scenarioTitle}</h3>
          <p className="text-sm text-aura-text-dim leading-relaxed">{content.scenarioDescription}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aura-surface text-xs text-aura-text-dim">
              <span className="text-aura-gold">Setting:</span> {content.setting}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aura-surface text-xs text-aura-text-dim">
              <span className="text-aura-gold">Talking to:</span> {content.role}
            </span>
          </div>
        </div>
      </Card>

      {/* Chat area */}
      <div className="flex flex-col gap-4">
        {/* Other person's message - left side */}
        <div className="flex items-start gap-3 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-aura-purple/30 flex items-center justify-center text-xs text-aura-purple shrink-0">
            AI
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-aura-surface border border-aura-border">
            <p className="text-sm text-aura-text leading-relaxed">{content.initialPrompt}</p>
          </div>
        </div>

        {/* User's response display (when submitted) */}
        {submitted && displayText && (
          <div className="flex items-start gap-3 max-w-[85%] self-end flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-aura-gold/30 flex items-center justify-center text-xs text-aura-gold shrink-0">
              You
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tr-md bg-aura-purple/20 border border-aura-purple/30">
              <p className="text-sm text-aura-text leading-relaxed">{displayText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {!submitted && (
        <div className="flex flex-col gap-4">
          {/* Speech input */}
          {useSpeech && (
            <div className="flex justify-center">
              <Microphone
                isListening={isListening}
                onStart={startListening}
                onStop={stopListening}
                size="md"
              />
            </div>
          )}

          {/* Live transcript */}
          {(transcript || interimTranscript) && (
            <Card variant="glass" padding="sm">
              <p className="text-sm text-aura-text">
                {transcript}
                {interimTranscript && (
                  <span className="text-aura-text-dim italic"> {interimTranscript}</span>
                )}
              </p>
            </Card>
          )}

          {/* Text input */}
          {useText && (
            <textarea
              value={userResponse}
              onChange={(e) => {
                setUserResponse(e.target.value)
                resetTranscript()
              }}
              placeholder="Type your response..."
              className="w-full min-h-[100px] p-4 rounded-xl bg-aura-surface border border-aura-border text-aura-text placeholder:text-aura-text-dim/50 focus:outline-none focus:border-aura-purple/50 focus:ring-1 focus:ring-aura-purple/30 resize-y text-base leading-relaxed"
            />
          )}

          <div className="flex justify-end">
            <Button
              variant="gold"
              onClick={handleSubmit}
              disabled={!displayText.trim()}
            >
              Submit Response
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {submitted && scores && (
        <div className="flex flex-col gap-4">
          {/* Score bars */}
          <NaturalnessScoreBars scores={scores} />

          {/* Situation appropriateness */}
          <Card variant="default" padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-aura-text-dim">Situation Appropriateness</span>
              <span className={`text-sm font-bold ${situationScore >= 70 ? 'text-aura-success' : 'text-aura-gold'}`}>
                {situationScore}/100
              </span>
            </div>
          </Card>

          {/* Native speaker suggestion */}
          <Card variant="glass">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-aura-gold uppercase tracking-wide font-medium">
                What a native speaker might say
              </span>
              <p className="text-sm text-aura-text leading-relaxed italic">
                &ldquo;{nativeSuggestion}&rdquo;
              </p>
            </div>
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
