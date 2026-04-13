import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Exercise, RecitationContent } from '../../types/exercise'
import type { ExerciseResult, RecitationScore } from '../../types/scoring'
import { calculateOverallScore } from '../../types/scoring'
import { calculateCompleteness, wordLevelAccuracy, calculateFluency, calculateWPM, countFillerWords } from '../../lib/scoring'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'
import { Microphone } from '../speech/Microphone'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface RecitationProps {
  exercise: Exercise
  onComplete?: (result: ExerciseResult) => void
}

type Phase = 'study' | 'recite' | 'feedback'

export function Recitation({ exercise, onComplete }: RecitationProps) {
  const content = exercise.content as RecitationContent

  const [phase, setPhase] = useState<Phase>('study')
  const [studyTimeLeft, setStudyTimeLeft] = useState(exercise.timeLimit ?? 60)
  const [recitationResult, setRecitationResult] = useState<RecitationScore | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Speech recognition
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

  // Study phase countdown timer
  useEffect(() => {
    if (phase !== 'study') return

    timerRef.current = setInterval(() => {
      setStudyTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleReady = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('recite')
    resetTranscript()
  }, [resetTranscript])

  const handleStartRecording = useCallback(() => {
    setRecordingStartTime(Date.now())
    startListening()
  }, [startListening])

  const handleStopRecording = useCallback(() => {
    stopListening()

    const finalTranscript = transcript.trim()
    if (!finalTranscript) return

    const durationSeconds = recordingStartTime
      ? (Date.now() - recordingStartTime) / 1000
      : 30

    // Calculate scores
    const completeness = calculateCompleteness(content.passage, finalTranscript)
    const accuracy = wordLevelAccuracy(content.passage, finalTranscript)
    const { count: fillerCount } = countFillerWords(finalTranscript)
    const wpm = calculateWPM(finalTranscript, durationSeconds)
    const totalWords = finalTranscript.split(/\s+/).filter(Boolean).length
    const fluency = calculateFluency(wpm, fillerCount, totalWords, 'reading')

    // Find missed sentences
    const origSentences = content.passage
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const recitedLower = finalTranscript.toLowerCase()
    const missedSentences = origSentences.filter((sentence) => {
      const words = sentence.toLowerCase().split(/\s+/).filter(Boolean)
      const matchedWords = words.filter((w) => recitedLower.includes(w))
      return matchedWords.length < words.length * 0.6
    })

    const details: RecitationScore = {
      type: 'recitation',
      transcription: finalTranscript,
      completeness,
      accuracy,
      fluency,
      missedSentences,
      overallFeedback: generateFeedback(completeness, accuracy, fluency),
    }

    const score = calculateOverallScore('recitation', details)
    setRecitationResult(details)
    setOverallScore(score)
    setPhase('feedback')

    const result: ExerciseResult = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      userId: '',
      completedAt: new Date().toISOString(),
      score,
      passed: score >= exercise.passingScore,
      timeSpentSeconds: Math.round(durationSeconds),
      details,
    }

    onComplete?.(result)
  }, [
    stopListening,
    transcript,
    recordingStartTime,
    content.passage,
    exercise,
    onComplete,
  ])

  // --- Render: Study Phase ---
  if (phase === 'study') {
    return (
      <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
            <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-purple/20 text-aura-purple">
              Recitation - Study Phase
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-aura-text-dim"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span
              className={`font-mono text-sm ${
                studyTimeLeft <= 10 ? 'text-aura-error' : 'text-aura-text-dim'
              }`}
            >
              {formatTime(studyTimeLeft)}
            </span>
          </div>
        </div>

        {/* Timer progress bar */}
        <div className="w-full h-1.5 bg-aura-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              studyTimeLeft <= 10 ? 'bg-aura-error' : 'bg-aura-purple'
            }`}
            style={{
              width: `${(studyTimeLeft / (exercise.timeLimit ?? 60)) * 100}%`,
            }}
          />
        </div>

        {/* Instructions */}
        <p className="text-sm text-aura-text-dim">
          Read and memorize the passage below. You will recite it from memory in the next phase.
        </p>

        {/* Passage */}
        <Card variant="glass" padding="lg">
          <p className="text-aura-text leading-loose text-lg">{content.passage}</p>
        </Card>

        {/* Key vocabulary */}
        {content.keyVocabulary.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide">
              Key Vocabulary
            </h3>
            <div className="grid gap-2">
              {content.keyVocabulary.map((vocab) => (
                <Card key={vocab.word} variant="default" padding="sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-aura-gold font-semibold">{vocab.word}</span>
                      {vocab.pronunciation && (
                        <span className="text-xs text-aura-text-dim font-mono">
                          /{vocab.pronunciation}/
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-aura-text-dim">{vocab.definition}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ready button */}
        <div className="flex justify-center pt-2">
          <Button variant="gold" size="lg" onClick={handleReady}>
            I'm Ready
          </Button>
        </div>
      </div>
    )
  }

  // --- Render: Recite Phase ---
  if (phase === 'recite') {
    return (
      <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
          <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-gold/20 text-aura-gold">
            Recitation - Recite Phase
          </span>
        </div>

        {/* Instructions */}
        <p className="text-sm text-aura-text-dim">
          Recite the passage from memory. The hints below show the first words of each sentence.
        </p>

        {/* Hints */}
        <Card variant="default" padding="md">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-aura-text-dim uppercase tracking-wide mb-1">
              Hints
            </h3>
            {content.hints.map((hint, i) => (
              <p key={i} className="text-aura-text-dim/40 text-sm italic">
                {hint}...
              </p>
            ))}
          </div>
        </Card>

        {/* Microphone */}
        <div className="flex justify-center py-4">
          <Microphone
            isListening={isListening}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
          />
        </div>

        {/* Real-time transcription */}
        {fullTranscript && (
          <Card variant="default" padding="sm">
            <p className="text-sm text-aura-text-dim mb-1 font-medium">
              Your recitation:
            </p>
            <p className="text-aura-text leading-relaxed">
              {transcript}
              {interimTranscript && (
                <span className="text-aura-text-dim italic"> {interimTranscript}</span>
              )}
            </p>
          </Card>
        )}
      </div>
    )
  }

  // --- Render: Feedback Phase ---
  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-aura-text">{exercise.title}</h2>
        <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-aura-purple/20 text-aura-purple">
          Recitation - Results
        </span>
      </div>

      {/* Overall score */}
      {overallScore !== null && (
        <div className="flex justify-center py-4">
          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-5xl font-bold ${
                overallScore >= 70
                  ? 'text-aura-success'
                  : overallScore >= 50
                    ? 'text-aura-gold'
                    : 'text-aura-error'
              }`}
            >
              {overallScore}
            </span>
            <span className="text-sm text-aura-text-dim">Overall Score</span>
          </div>
        </div>
      )}

      {/* Detailed scores */}
      {recitationResult && (
        <Card variant="default">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide">
              Detailed Scores
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <ScoreBar label="Completeness" value={recitationResult.completeness} />
              <ScoreBar label="Accuracy" value={recitationResult.accuracy} />
              <ScoreBar label="Fluency" value={recitationResult.fluency} />
            </div>

            {/* Feedback */}
            <p className="text-sm text-aura-text-dim leading-relaxed">
              {recitationResult.overallFeedback}
            </p>
          </div>
        </Card>
      )}

      {/* Missed sentences */}
      {recitationResult && recitationResult.missedSentences.length > 0 && (
        <Card variant="default">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-aura-error uppercase tracking-wide">
              Missed Sentences
            </h3>
            <div className="flex flex-col gap-2">
              {recitationResult.missedSentences.map((sentence, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-aura-error shrink-0">{i + 1}.</span>
                  <span className="text-aura-text-dim leading-relaxed">{sentence}.</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Your transcription */}
      {recitationResult && (
        <Card variant="default" padding="sm">
          <p className="text-sm text-aura-text-dim mb-1 font-medium">
            Your recitation:
          </p>
          <p className="text-sm text-aura-text leading-relaxed">
            {recitationResult.transcription}
          </p>
        </Card>
      )}
    </div>
  )
}

// --- Helpers ---

function ScoreBar({ label, value }: { label: string; value: number }) {
  const getColor = () => {
    if (value >= 80) return 'bg-aura-success'
    if (value >= 60) return 'bg-aura-gold'
    return 'bg-aura-error'
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-aura-text-dim">{label}</span>
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

function generateFeedback(
  completeness: number,
  accuracy: number,
  fluency: number
): string {
  const avg = (completeness + accuracy + fluency) / 3

  if (avg >= 90)
    return 'Outstanding recall! You memorized and delivered the passage with impressive accuracy and flow.'
  if (avg >= 75)
    return 'Well done! You captured most of the passage. Focus on the missed sentences to achieve a perfect score.'
  if (avg >= 60)
    return 'Good effort. Try breaking the passage into smaller chunks and memorizing each section before combining them.'
  return 'Keep practicing. Read the passage several times, then try reciting one sentence at a time before attempting the full text.'
}
