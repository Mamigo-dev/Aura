import { useState, useEffect, useRef } from 'react'
import type {
  ProExercise,
  ProExerciseResult,
  SocialSurvivalContent,
  NaturalnessScore,
} from '../../types/professional'
import { calculateNaturalnessComposite } from '../../types/professional'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Microphone } from '../speech/Microphone'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'

interface SocialSurvivalProps {
  exercise: ProExercise
  onComplete: (result: ProExerciseResult) => void
}

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

function generateMockScores(): NaturalnessScore {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  return {
    naturalness: rand(50, 90),
    registerMatch: rand(50, 85),
    culturalFit: rand(40, 80),
    conciseness: rand(50, 90),
    flow: rand(45, 85),
  }
}

const FILLER_RESPONSES = [
  "That's interesting! Tell me more about that.",
  "Oh really? I hadn't thought about it that way.",
  "Ha, yeah that makes sense. So what happened next?",
  "Oh cool! I totally get what you mean.",
  "Nice! That reminds me of something similar.",
  "Yeah for sure, I can see that. What do you think about...?",
  "Hmm, that's a good point actually.",
  "Oh wow, that sounds like quite the experience!",
]

export function SocialSurvival({ exercise, onComplete }: SocialSurvivalProps) {
  const content = exercise.content as SocialSurvivalContent

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [scores, setScores] = useState<NaturalnessScore | null>(null)
  const [startTime] = useState(Date.now())
  const [started, setStarted] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const starterIndexRef = useRef(0)

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onResult: (result) => {
      if (result.isFinal) {
        setUserInput((prev) => prev + result.transcript)
      }
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start conversation with first AI message
  useEffect(() => {
    if (!started) return
    if (content.conversationStarters.length > 0) {
      setMessages([{ role: 'ai', text: content.conversationStarters[0] }])
      starterIndexRef.current = 1
    }
  }, [started, content.conversationStarters])

  // Timer
  useEffect(() => {
    if (!started || isFinished) return

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        if (next >= content.durationSeconds) {
          handleEndConversation()
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, isFinished, content.durationSeconds])

  const handleEndConversation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (isListening) stopListening()

    const mockScores = generateMockScores()
    setScores(mockScores)
    setIsFinished(true)
  }

  const handleSend = () => {
    const text = (userInput + (interimTranscript || '')).trim()
    if (!text) return

    if (isListening) stopListening()
    resetTranscript()

    // Add user message
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text }]
    setUserInput('')

    // Generate AI response
    const starters = content.conversationStarters
    let aiResponse: string

    if (starterIndexRef.current < starters.length) {
      aiResponse = starters[starterIndexRef.current]
      starterIndexRef.current++
    } else {
      aiResponse = FILLER_RESPONSES[Math.floor(Math.random() * FILLER_RESPONSES.length)]
    }

    // Delay AI response slightly for realism
    setMessages(newMessages)
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: aiResponse }])
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleComplete = () => {
    const finalScores = scores ?? generateMockScores()
    const composite = calculateNaturalnessComposite(finalScores)
    const elapsed = Math.round((Date.now() - startTime) / 1000)

    const userMessageCount = messages.filter((m) => m.role === 'user').length
    const flowMaintenance = Math.min(100, Math.round((userMessageCount / Math.max(1, content.durationSeconds / 15)) * 80) + Math.floor(Math.random() * 20))

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
        ? 'Good conversation flow! You kept things natural and engaging.'
        : 'Try to keep the conversation flowing more naturally. Ask follow-up questions!',
      details: {
        type: 'social_survival',
        conversationLog: messages,
        flowMaintenance,
      },
    }
    onComplete(result)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const timeProgress = (elapsedSeconds / content.durationSeconds) * 100

  // ---- Start screen ----
  if (!started) {
    return (
      <div className="flex flex-col gap-5">
        <Card variant="gradient">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-aura-text">Social Survival</h3>
            <p className="text-sm text-aura-text-dim leading-relaxed">{content.scenario}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-aura-gold">Talking to:</span>
              <span className="text-xs text-aura-text">{content.aiRole}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-aura-gold">Duration:</span>
              <span className="text-xs text-aura-text">{formatTime(content.durationSeconds)}</span>
            </div>
          </div>
        </Card>
        <div className="flex justify-center">
          <Button variant="gold" size="lg" onClick={() => setStarted(true)}>
            Start Conversation
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: scenario + timer */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <span className="text-xs text-aura-text-dim">{content.scenario}</span>
          <span className="text-xs text-aura-gold">{content.aiRole}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-bold ${elapsedSeconds >= content.durationSeconds - 10 ? 'text-aura-error animate-pulse' : 'text-aura-text'}`}>
            {formatTime(elapsedSeconds)} / {formatTime(content.durationSeconds)}
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-1 bg-aura-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            timeProgress >= 80 ? 'bg-aura-error' : 'bg-aura-gold'
          }`}
          style={{ width: `${Math.min(100, timeProgress)}%` }}
        />
      </div>

      {/* Chat messages */}
      {!isFinished && (
        <div className="flex flex-col gap-3 min-h-[280px] max-h-[400px] overflow-y-auto p-3 rounded-xl bg-aura-midnight border border-aura-border">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                msg.role === 'user' ? 'self-end flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                  msg.role === 'ai'
                    ? 'bg-aura-purple/30 text-aura-purple'
                    : 'bg-aura-gold/30 text-aura-gold'
                }`}
              >
                {msg.role === 'ai' ? 'AI' : 'You'}
              </div>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'rounded-tl-md bg-aura-surface border border-aura-border text-aura-text'
                    : 'rounded-tr-md bg-aura-purple/20 border border-aura-purple/30 text-aura-text'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input area */}
      {!isFinished && (
        <div className="flex flex-col gap-3">
          {/* Speech button */}
          <div className="flex items-center gap-3">
            <Microphone
              isListening={isListening}
              onStart={startListening}
              onStop={stopListening}
              size="sm"
            />
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={userInput + (interimTranscript ? ` ${interimTranscript}` : '')}
                onChange={(e) => {
                  setUserInput(e.target.value)
                  resetTranscript()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a reply..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-aura-surface border border-aura-border text-aura-text placeholder:text-aura-text-dim/50 focus:outline-none focus:border-aura-purple/50 text-sm"
              />
              <Button variant="primary" size="sm" onClick={handleSend} disabled={!userInput.trim() && !interimTranscript}>
                Send
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleEndConversation}>
              End Conversation
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {isFinished && scores && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-xs text-aura-text-dim uppercase tracking-wide">Conversation Complete</span>
            <span className="text-3xl font-bold text-aura-gold">
              {calculateNaturalnessComposite(scores)}
            </span>
          </div>

          {/* Score bars */}
          <NaturalnessScoreBars scores={scores} />

          {/* Flow maintenance */}
          <Card variant="default" padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-aura-text-dim">Flow Maintenance</span>
              <span className="text-sm font-bold text-aura-gold">
                {Math.min(100, Math.round((messages.filter((m) => m.role === 'user').length / Math.max(1, content.durationSeconds / 15)) * 80) + Math.floor(Math.random() * 20))}/100
              </span>
            </div>
          </Card>

          {/* Message count */}
          <Card variant="glass" padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-aura-text-dim">Messages Exchanged</span>
              <span className="text-sm font-medium text-aura-text">{messages.length}</span>
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
    ...(scores.flow != null ? [{ label: 'Flow', value: scores.flow }] : []),
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
