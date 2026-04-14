import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  ProExercise,
  ProExerciseResult,
  QuickReactContent,
  NaturalnessScore,
} from '../../types/professional'
import { calculateNaturalnessComposite } from '../../types/professional'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'

interface QuickReactProps {
  exercise: ProExercise
  onComplete: (result: ProExerciseResult) => void
}

type Phase = 'ready' | 'countdown' | 'prompt' | 'pause' | 'results'

interface PromptResult {
  prompt: string
  response: string
  reactionTimeMs: number
  scores: NaturalnessScore
}

function generateMockScores(): NaturalnessScore {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  return {
    naturalness: rand(50, 90),
    registerMatch: rand(50, 85),
    culturalFit: rand(40, 80),
    conciseness: rand(50, 90),
    responseSpeed: rand(40, 85),
  }
}

export function QuickReact({ exercise, onComplete }: QuickReactProps) {
  const content = exercise.content as QuickReactContent

  const [phase, setPhase] = useState<Phase>('ready')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<PromptResult[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [promptStartTime, setPromptStartTime] = useState(0)
  const [startTime] = useState(Date.now())

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentResponseRef = useRef('')

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: true,
    onResult: (result) => {
      if (result.isFinal) {
        currentResponseRef.current += result.transcript
      }
    },
  })

  const currentPrompt = content.prompts[currentIndex]
  const timePerPrompt = content.timePerPrompt

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const finishCurrentPrompt = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (isListening) stopListening()

    const reactionTime = Date.now() - promptStartTime
    const response = currentResponseRef.current + (interimTranscript || '')

    const promptResult: PromptResult = {
      prompt: currentPrompt.text,
      response: response || '(no response)',
      reactionTimeMs: reactionTime,
      scores: generateMockScores(),
    }

    const newResults = [...results, promptResult]
    setResults(newResults)
    currentResponseRef.current = ''
    resetTranscript()

    // Check if there are more prompts
    if (currentIndex < content.prompts.length - 1) {
      setPhase('pause')
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        startPrompt()
      }, 1500)
    } else {
      setPhase('results')
    }
  }, [isListening, stopListening, promptStartTime, interimTranscript, currentPrompt, results, currentIndex, content.prompts.length, resetTranscript])

  const startPrompt = useCallback(() => {
    setPhase('prompt')
    setTimeRemaining(timePerPrompt)
    setPromptStartTime(Date.now())
    currentResponseRef.current = ''
    resetTranscript()

    // Auto-start speech recognition
    setTimeout(() => startListening(), 300)

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishCurrentPrompt()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timePerPrompt, resetTranscript, startListening, finishCurrentPrompt])

  const handleStart = () => {
    setPhase('countdown')
    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(countdownInterval)
        startPrompt()
      }
    }, 1000)
  }

  const handleSkip = () => {
    finishCurrentPrompt()
  }

  const handleComplete = () => {
    const allScores = results.map((r) => r.scores)
    const avgScores: NaturalnessScore = {
      naturalness: Math.round(allScores.reduce((s, sc) => s + sc.naturalness, 0) / allScores.length),
      registerMatch: Math.round(allScores.reduce((s, sc) => s + sc.registerMatch, 0) / allScores.length),
      culturalFit: Math.round(allScores.reduce((s, sc) => s + sc.culturalFit, 0) / allScores.length),
      conciseness: Math.round(allScores.reduce((s, sc) => s + sc.conciseness, 0) / allScores.length),
      responseSpeed: Math.round(allScores.reduce((s, sc) => s + (sc.responseSpeed ?? 70), 0) / allScores.length),
    }

    const composite = calculateNaturalnessComposite(avgScores)
    const avgReactionTime = Math.round(results.reduce((s, r) => s + r.reactionTimeMs, 0) / results.length)
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
      feedback: composite >= 70
        ? 'Good reflexes! Your responses were natural and quick.'
        : 'Try to respond more instinctively. Don\'t overthink it!',
      details: {
        type: 'quick_react',
        responses: results.map((r) => ({
          prompt: r.prompt,
          response: r.response,
          reactionTimeMs: r.reactionTimeMs,
        })),
        averageReactionTimeMs: avgReactionTime,
      },
    }
    onComplete(result)
  }

  const progressPct = timePerPrompt > 0 ? ((timePerPrompt - timeRemaining) / timePerPrompt) * 100 : 0

  // ---- Ready Screen ----
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="text-6xl">&#9889;</div>
        <h2 className="text-2xl font-bold text-aura-text">Quick React</h2>
        <p className="text-sm text-aura-text-dim text-center max-w-sm">
          You will see {content.prompts.length} prompts, one at a time.
          Respond as quickly and naturally as you can within {timePerPrompt} seconds each.
        </p>
        <Button variant="gold" size="lg" onClick={handleStart}>
          Ready?
        </Button>
      </div>
    )
  }

  // ---- Countdown ----
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="text-7xl font-bold text-aura-gold animate-pulse">
          Get Ready...
        </div>
      </div>
    )
  }

  // ---- Active Prompt ----
  if (phase === 'prompt') {
    return (
      <div className="flex flex-col gap-5">
        {/* Progress indicator */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-aura-text-dim">
            {currentIndex + 1} / {content.prompts.length}
          </span>
          <span className={`text-sm font-bold ${timeRemaining <= 3 ? 'text-aura-error animate-pulse' : 'text-aura-gold'}`}>
            {timeRemaining}s
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="w-full h-1.5 bg-aura-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-aura-gold rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Prompt text */}
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-2xl font-semibold text-aura-text text-center leading-relaxed">
            {currentPrompt.text}
          </p>
          <p className="text-sm text-aura-text-dim text-center">{currentPrompt.context}</p>
        </div>

        {/* Live transcript */}
        <Card variant="glass" padding="sm">
          <div className="min-h-[60px] flex items-center">
            <p className="text-sm text-aura-text">
              {transcript || currentResponseRef.current}
              {interimTranscript && (
                <span className="text-aura-text-dim italic"> {interimTranscript}</span>
              )}
              {!transcript && !interimTranscript && !currentResponseRef.current && (
                <span className="text-aura-text-dim italic">Listening...</span>
              )}
            </p>
          </div>
        </Card>

        {/* Listening indicator + skip */}
        <div className="flex items-center justify-between">
          {isListening && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aura-error animate-pulse" />
              <span className="text-xs text-aura-text-dim">Recording</span>
            </div>
          )}
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Done / Skip
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Pause between prompts ----
  if (phase === 'pause') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-8 h-8 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-aura-text-dim">Next prompt coming up...</p>
      </div>
    )
  }

  // ---- Results ----
  const avgReactionTime = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.reactionTimeMs, 0) / results.length)
    : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Average reaction time */}
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-xs text-aura-text-dim uppercase tracking-wide">Average Reaction Time</span>
        <span className="text-4xl font-bold text-aura-gold">
          {(avgReactionTime / 1000).toFixed(1)}s
        </span>
      </div>

      {/* Per-prompt results */}
      <div className="flex flex-col gap-3">
        {results.map((r, i) => {
          const composite = calculateNaturalnessComposite(r.scores)
          return (
            <Card key={i} variant="default">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-aura-text-dim">Prompt {i + 1}</span>
                  <span className="text-xs text-aura-text-dim">
                    {(r.reactionTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="text-sm font-medium text-aura-text">{r.prompt}</p>
                <p className="text-sm text-aura-text-dim">{r.response}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-aura-text-dim">Score</span>
                  <span className={`text-sm font-bold ${composite >= 70 ? 'text-aura-success' : composite >= 50 ? 'text-aura-gold' : 'text-aura-error'}`}>
                    {composite}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleComplete}>
          Continue
        </Button>
      </div>
    </div>
  )
}
