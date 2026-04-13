import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Exercise, SpeechModeContent } from '../../types/exercise'
import type { ExerciseResult, SpeechModeScore } from '../../types/scoring'
import { PASSING_SCORES } from '../../types/exercise'
import { calculateOverallScore } from '../../types/scoring'
import { calculateWPM, countFillerWords, calculateFluency } from '../../lib/scoring'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'
import { Microphone } from '../speech/Microphone'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type Phase = 'prep' | 'speaking' | 'results'

interface SpeechModeProps {
  exercise: Exercise
  onComplete: (result: ExerciseResult) => void
}

export function SpeechMode({ exercise, onComplete }: SpeechModeProps) {
  const content = exercise.content as SpeechModeContent
  const [phase, setPhase] = useState<Phase>('prep')
  const [prepTimeLeft, setPrepTimeLeft] = useState(content.prepTime)
  const [speechElapsed, setSpeechElapsed] = useState(0)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [result, setResult] = useState<ExerciseResult | null>(null)

  const speechTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechStartRef = useRef<number>(0)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
  })

  const fullTranscript = useMemo(
    () => (transcript + ' ' + interimTranscript).trim(),
    [transcript, interimTranscript]
  )

  // Prep countdown timer
  useEffect(() => {
    if (phase !== 'prep') return

    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current!)
          handleStartSpeaking()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Speech elapsed timer
  useEffect(() => {
    if (phase !== 'speaking') return

    speechTimerRef.current = setInterval(() => {
      setSpeechElapsed(Math.floor((Date.now() - speechStartRef.current) / 1000))
    }, 500)

    return () => {
      if (speechTimerRef.current) clearInterval(speechTimerRef.current)
    }
  }, [phase])

  // Auto-scroll transcription
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight
    }
  }, [fullTranscript])

  const handleStartSpeaking = useCallback(() => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    setPhase('speaking')
    speechStartRef.current = Date.now()
    resetTranscript()
    startListening()
  }, [resetTranscript, startListening])

  const handleStopSpeaking = useCallback(() => {
    stopListening()
    if (speechTimerRef.current) clearInterval(speechTimerRef.current)

    const finalDuration = Math.floor((Date.now() - speechStartRef.current) / 1000)
    setSpeechElapsed(finalDuration)

    const finalTranscript = transcript.trim()
    const totalWords = finalTranscript.split(/\s+/).filter(Boolean).length

    // Calculate scores
    const wpm = calculateWPM(finalTranscript, finalDuration)
    const { count: fillerCount, found: fillerList } = countFillerWords(finalTranscript)
    const delivery = calculateFluency(wpm, fillerCount, totalWords, 'speaking')

    // Structure heuristic: check if speech length is reasonable for the target time
    const expectedWords = (content.speechTime / 60) * 140 // ~140 WPM target
    const wordRatio = totalWords > 0 ? Math.min(totalWords / expectedWords, expectedWords / Math.max(totalWords, 1)) : 0
    const structure = Math.round(Math.min(100, wordRatio * 100))

    // Filler words score (inverse: fewer fillers = higher)
    const fillerRatio = totalWords > 0 ? fillerCount / totalWords : 0
    const fillerScore = Math.round(Math.max(0, 100 - fillerRatio * 500))

    // Pace score
    let pace: number
    if (wpm >= 120 && wpm <= 160) {
      pace = 100
    } else if (wpm < 120) {
      pace = Math.max(0, 100 - (120 - wpm) * 2)
    } else {
      pace = Math.max(0, 100 - (wpm - 160) * 2)
    }

    const details: SpeechModeScore = {
      type: 'speech_mode',
      transcription: finalTranscript,
      delivery,
      structure,
      fillerWords: fillerScore,
      pace,
      wordsPerMinute: wpm,
      fillerCount,
      fillerList,
      overallFeedback: generateOverallFeedback(delivery, structure, pace, fillerCount),
      structureFeedback: generateStructureFeedback(totalWords, expectedWords, finalDuration, content.speechTime),
    }

    const overallScore = calculateOverallScore('speech_mode', details)

    const exerciseResult: ExerciseResult = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      userId: '',
      completedAt: new Date().toISOString(),
      score: overallScore,
      passed: overallScore >= PASSING_SCORES.speech_mode,
      timeSpentSeconds: finalDuration + (content.prepTime - prepTimeLeft),
      details,
    }

    setResult(exerciseResult)
    setPhase('results')
    onComplete(exerciseResult)
  }, [stopListening, transcript, content.speechTime, content.prepTime, prepTimeLeft, exercise.id, onComplete])

  const handleMicStart = useCallback(() => {
    if (!isListening) startListening()
  }, [isListening, startListening])

  const handleMicStop = useCallback(() => {
    handleStopSpeaking()
  }, [handleStopSpeaking])

  const liveWPM = useMemo(() => {
    if (speechElapsed <= 0) return 0
    return calculateWPM(fullTranscript, speechElapsed)
  }, [fullTranscript, speechElapsed])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getPaceColor = (wpm: number): string => {
    if (wpm === 0) return 'text-aura-text-dim'
    if (wpm < 100) return 'text-yellow-400'
    if (wpm >= 120 && wpm <= 160) return 'text-green-400'
    if (wpm > 180) return 'text-red-400'
    return 'text-aura-text'
  }

  const getPaceBg = (wpm: number): string => {
    if (wpm === 0) return 'bg-aura-surface'
    if (wpm < 100) return 'bg-aura-warning/20'
    if (wpm >= 120 && wpm <= 160) return 'bg-aura-success/20'
    if (wpm > 180) return 'bg-aura-error/20'
    return 'bg-aura-surface'
  }

  const getPaceLabel = (wpm: number): string => {
    if (wpm === 0) return 'Start speaking...'
    if (wpm < 100) return 'Too slow'
    if (wpm < 120) return 'A bit slow'
    if (wpm <= 160) return 'Good pace'
    if (wpm <= 180) return 'A bit fast'
    return 'Too fast'
  }

  // ---------------------
  // PREP PHASE
  // ---------------------
  if (phase === 'prep') {
    return (
      <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
            <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-purple/20 text-aura-purple">
              {content.isImpromptu ? 'Impromptu Speech' : 'Prepared Speech'}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-aura-text-dim uppercase tracking-wide">Prep Time</span>
            <span className={`font-mono text-2xl font-bold ${prepTimeLeft <= 10 ? 'text-aura-error animate-pulse' : 'text-aura-gold'}`}>
              {formatTime(prepTimeLeft)}
            </span>
          </div>
        </div>

        {/* Prep timer progress bar */}
        <div className="w-full h-1.5 bg-aura-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-aura-gold rounded-full transition-all duration-1000"
            style={{ width: `${(prepTimeLeft / content.prepTime) * 100}%` }}
          />
        </div>

        {/* Topic */}
        <div className="text-center py-4">
          <p className="text-xs text-aura-text-dim uppercase tracking-wide mb-2">Your Topic</p>
          <h3 className="text-2xl font-bold text-aura-text">{content.topic}</h3>
        </div>

        {/* Outline */}
        <Card variant="glass">
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-aura-purple uppercase tracking-wide">Speech Outline</h4>

            {/* Introduction */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-aura-text-dim font-medium uppercase">Introduction</span>
              <p className="text-aura-text leading-relaxed">{content.outline.introduction}</p>
            </div>

            {/* Body Points */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-aura-text-dim font-medium uppercase">Body Points</span>
              <ul className="flex flex-col gap-2 ml-1">
                {content.outline.bodyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-aura-text leading-relaxed">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-aura-purple/20 text-aura-purple text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Conclusion */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-aura-text-dim font-medium uppercase">Conclusion</span>
              <p className="text-aura-text leading-relaxed">{content.outline.conclusion}</p>
            </div>
          </div>
        </Card>

        {/* Suggested Transitions */}
        {!content.isImpromptu && content.outline.suggestedTransitions.length > 0 && (
          <Card variant="default" padding="sm">
            <h4 className="text-xs font-semibold text-aura-gold uppercase tracking-wide mb-2">Suggested Transitions</h4>
            <div className="flex flex-col gap-1.5">
              {content.outline.suggestedTransitions.map((transition, i) => (
                <p key={i} className="text-sm text-aura-text-dim italic">
                  &ldquo;{transition}&rdquo;
                </p>
              ))}
            </div>
          </Card>
        )}

        {/* Tips (collapsible) */}
        {content.tips.length > 0 && (
          <div className="border border-aura-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setTipsOpen(!tipsOpen)}
              className="w-full flex items-center justify-between px-5 py-3 text-left text-sm font-medium text-aura-text-dim hover:text-aura-text transition-colors"
            >
              <span>Tips ({content.tips.length})</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${tipsOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {tipsOpen && (
              <div className="px-5 pb-4 flex flex-col gap-2">
                {content.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-aura-text">
                    <span className="text-aura-gold shrink-0 mt-0.5">*</span>
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Start Speaking Button */}
        <div className="flex justify-center pt-2">
          <Button variant="gold" size="lg" onClick={handleStartSpeaking}>
            Start Speaking
          </Button>
        </div>
      </div>
    )
  }

  // ---------------------
  // SPEAKING PHASE
  // ---------------------
  if (phase === 'speaking') {
    return (
      <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
            <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-success/20 text-green-400">
              Speaking
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-aura-text-dim uppercase tracking-wide">Time</span>
            <span className="font-mono text-2xl font-bold text-aura-text">
              {formatTime(speechElapsed)}
              <span className="text-base text-aura-text-dim font-normal"> / {formatTime(content.speechTime)}</span>
            </span>
          </div>
        </div>

        {/* Speech timer progress bar */}
        <div className="w-full h-1.5 bg-aura-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              speechElapsed >= content.speechTime ? 'bg-aura-gold' : 'bg-aura-purple'
            }`}
            style={{ width: `${Math.min((speechElapsed / content.speechTime) * 100, 100)}%` }}
          />
        </div>

        {/* Topic reminder (minimal) */}
        <div className="text-center">
          <p className="text-sm text-aura-text-dim">Topic: <span className="text-aura-text font-medium">{content.topic}</span></p>
        </div>

        {/* Microphone */}
        <div className="flex justify-center py-6">
          <Microphone
            isListening={isListening}
            onStart={handleMicStart}
            onStop={handleMicStop}
            size="lg"
          />
        </div>

        {/* Pace indicator */}
        <div className={`flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl ${getPaceBg(liveWPM)}`}>
          <span className={`font-mono text-lg font-bold ${getPaceColor(liveWPM)}`}>
            {liveWPM} WPM
          </span>
          <span className={`text-sm ${getPaceColor(liveWPM)}`}>
            {getPaceLabel(liveWPM)}
          </span>
        </div>

        {/* Live transcription */}
        {fullTranscript && (
          <Card variant="default" padding="sm">
            <p className="text-xs text-aura-text-dim mb-1.5 font-medium uppercase tracking-wide">Live Transcription</p>
            <div
              ref={transcriptScrollRef}
              className="max-h-40 overflow-y-auto text-aura-text leading-relaxed"
            >
              {transcript}
              {interimTranscript && (
                <span className="text-aura-text-dim italic"> {interimTranscript}</span>
              )}
            </div>
          </Card>
        )}

        {/* Stop button */}
        <div className="flex justify-center pt-2">
          <Button variant="danger" size="md" onClick={handleStopSpeaking}>
            Finish Speech
          </Button>
        </div>
      </div>
    )
  }

  // ---------------------
  // RESULTS PHASE
  // ---------------------
  const details = result?.details as SpeechModeScore | undefined

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-purple/20 text-aura-purple">
          Complete
        </span>
      </div>

      {/* Overall score */}
      {result && (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className={`text-5xl font-bold ${result.passed ? 'text-aura-gold' : 'text-aura-error'}`}>
            {result.score}
          </div>
          <span className={`text-sm font-medium ${result.passed ? 'text-green-400' : 'text-aura-error'}`}>
            {result.passed ? 'Passed' : 'Needs improvement'}
          </span>
        </div>
      )}

      {/* Score breakdown */}
      {details && (
        <Card variant="glass">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              <ScoreBar label="Delivery" value={details.delivery} weight="30%" />
              <ScoreBar label="Structure" value={details.structure} weight="25%" />
              <ScoreBar label="Filler Words" value={details.fillerWords} weight="20%" />
              <ScoreBar label="Pace" value={details.pace} weight="25%" />
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      {details && (
        <div className="grid grid-cols-3 gap-3">
          <Card variant="default" padding="sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-aura-text-dim">WPM</span>
              <span className={`text-xl font-bold ${getPaceColor(details.wordsPerMinute)}`}>
                {details.wordsPerMinute}
              </span>
            </div>
          </Card>
          <Card variant="default" padding="sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-aura-text-dim">Duration</span>
              <span className="text-xl font-bold text-aura-text">{formatTime(speechElapsed)}</span>
            </div>
          </Card>
          <Card variant="default" padding="sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-aura-text-dim">Fillers</span>
              <span className={`text-xl font-bold ${details.fillerCount > 3 ? 'text-aura-error' : details.fillerCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {details.fillerCount}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Filler word details */}
      {details && details.fillerList.length > 0 && (
        <Card variant="default" padding="sm">
          <h4 className="text-xs font-semibold text-aura-text-dim uppercase tracking-wide mb-2">Filler Words Detected</h4>
          <div className="flex flex-wrap gap-1.5">
            {details.fillerList.map((filler, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-aura-error/20 text-aura-error text-sm border border-aura-error/30"
              >
                {filler}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback */}
      {details && (
        <Card variant="aura">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-aura-gold uppercase tracking-wide">Feedback</h4>
            <p className="text-aura-text leading-relaxed">{details.overallFeedback}</p>
            {details.structureFeedback && (
              <p className="text-sm text-aura-text-dim leading-relaxed">{details.structureFeedback}</p>
            )}
          </div>
        </Card>
      )}

      {/* Transcription */}
      {details && details.transcription && (
        <Card variant="default" padding="sm">
          <h4 className="text-xs font-semibold text-aura-text-dim uppercase tracking-wide mb-2">Your Speech</h4>
          <p className="text-sm text-aura-text leading-relaxed max-h-48 overflow-y-auto">
            {details.transcription}
          </p>
        </Card>
      )}
    </div>
  )
}

// ---------------------
// Helper components
// ---------------------

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const getColor = () => {
    if (value >= 80) return 'bg-aura-success'
    if (value >= 60) return 'bg-aura-gold'
    return 'bg-aura-error'
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-aura-text-dim">
          {label} <span className="text-aura-text-dim/50">({weight})</span>
        </span>
        <span className="text-xs font-medium text-aura-text">{value}</span>
      </div>
      <div className="h-1.5 bg-aura-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor()}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------
// Feedback generators
// ---------------------

function generateOverallFeedback(
  delivery: number,
  structure: number,
  pace: number,
  fillerCount: number
): string {
  const avg = (delivery + structure + pace) / 3

  if (avg >= 85) {
    return 'Excellent speech! Your delivery was confident and well-paced. Keep up the great work.'
  }
  if (avg >= 70) {
    const issues: string[] = []
    if (pace < 70) issues.push('adjusting your speaking pace')
    if (fillerCount > 3) issues.push('reducing filler words')
    if (structure < 70) issues.push('improving your speech structure')
    const focus = issues.length > 0 ? ` Try focusing on ${issues.join(' and ')}.` : ''
    return `Good effort! You communicated your ideas clearly.${focus}`
  }
  if (avg >= 50) {
    return 'Decent attempt. Practice organizing your thoughts before speaking, and try to maintain a steady pace between 120-160 words per minute.'
  }
  return 'Keep practicing! Try rehearsing with your outline a few times. Focus on speaking at a comfortable pace and reducing pauses and filler words.'
}

function generateStructureFeedback(
  totalWords: number,
  expectedWords: number,
  actualDuration: number,
  targetDuration: number
): string {
  const durationRatio = actualDuration / targetDuration

  if (totalWords < 10) {
    return 'Your speech was very short. Try to develop each point in your outline with examples or explanations.'
  }
  if (durationRatio < 0.5) {
    return `Your speech was significantly shorter than the target time of ${formatSeconds(targetDuration)}. Try expanding on each body point with supporting details.`
  }
  if (durationRatio > 1.5) {
    return `Your speech went well over the target time. Practice being more concise while still covering all your key points.`
  }
  if (totalWords < expectedWords * 0.7) {
    return 'You could expand your speech with more details and examples for each point in your outline.'
  }
  return 'Good job hitting the target length. Your speech covered a reasonable amount of content for the allotted time.'
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}min`
  return `${m}min ${s}s`
}
