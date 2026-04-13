import { useState, useCallback, useMemo } from 'react'
import type { Exercise, ReadAloudContent } from '../../types/exercise'
import type { ExerciseResult, ReadAloudScore } from '../../types/scoring'
import { calculateOverallScore } from '../../types/scoring'
import { useExerciseStore } from '../../stores/exerciseStore'
import { wordLevelAccuracy, countFillerWords, calculateWPM, calculateFluency, findMissedWords } from '../../lib/scoring'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'
import { useSpeechSynthesis } from '../speech/useSpeechSynthesis'
import { Microphone } from '../speech/Microphone'
import { ExerciseWrapper } from './ExerciseWrapper'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface ReadAloudProps {
  exercise: Exercise
  onComplete?: (result: ExerciseResult) => void
}

export function ReadAloud({ exercise, onComplete }: ReadAloudProps) {
  const content = exercise.content as ReadAloudContent
  const { phase, elapsedSeconds, startExercise, setPhase, setResult, setTranscription } = useExerciseStore()
  const [hasRecorded, setHasRecorded] = useState(false)

  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeechSynthesis({ rate: 0.9 })

  const handleRecordingEnd = useCallback(() => {
    setHasRecorded(true)
  }, [])

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
    onEnd: handleRecordingEnd,
  })

  const fullTranscript = useMemo(
    () => (transcript + ' ' + interimTranscript).trim(),
    [transcript, interimTranscript]
  )

  const handleStart = useCallback(() => {
    if (phase === 'ready') {
      startExercise()
    }
    setPhase('recording')
    resetTranscript()
    startListening()
  }, [phase, startExercise, setPhase, resetTranscript, startListening])

  const handleStop = useCallback(() => {
    stopListening()
    setPhase('scoring')
    setTranscription(transcript)

    const finalTranscript = transcript.trim()
    if (!finalTranscript) {
      setPhase('in_progress')
      return
    }

    // Calculate scores
    const accuracy = wordLevelAccuracy(content.passage, finalTranscript)
    const { count: fillerCount } = countFillerWords(finalTranscript)
    const wpm = calculateWPM(finalTranscript, elapsedSeconds)
    const totalWords = finalTranscript.split(/\s+/).filter(Boolean).length
    const fluency = calculateFluency(wpm, fillerCount, totalWords, 'reading')
    const missedWords = findMissedWords(content.passage, finalTranscript)

    // Pronunciation score: approximate from accuracy with slight bonus
    const pronunciation = Math.min(100, Math.round(accuracy * 0.8 + 20))

    const details: ReadAloudScore = {
      type: 'read_aloud',
      transcription: finalTranscript,
      accuracy,
      fluency,
      pronunciation,
      missedWords,
      mispronounced: [],
      overallFeedback: generateFeedback(accuracy, fluency, pronunciation),
    }

    const overallScore = calculateOverallScore('read_aloud', details)

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

    setResult(result)
  }, [stopListening, setPhase, setTranscription, transcript, content.passage, elapsedSeconds, exercise, setResult])

  const handleListen = useCallback(() => {
    if (isSpeaking) {
      cancelSpeech()
    } else {
      speak(content.passage)
    }
  }, [isSpeaking, cancelSpeech, speak, content.passage])

  const handleComplete = useCallback(
    (result: ExerciseResult) => {
      onComplete?.(result)
    },
    [onComplete]
  )

  const renderPassage = () => {
    const { passage, keyPhrases } = content
    if (!keyPhrases.length) {
      return <p className="text-aura-text leading-relaxed text-lg">{passage}</p>
    }

    let remaining = passage
    const parts: React.ReactNode[] = []
    let key = 0

    for (const phrase of keyPhrases) {
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

    return <p className="text-aura-text leading-relaxed text-lg">{parts}</p>
  }

  return (
    <ExerciseWrapper exercise={exercise} onComplete={handleComplete}>
      {/* Passage */}
      <Card variant="glass">
        {renderPassage()}
      </Card>

      {/* Phonetics hints */}
      {content.phoneticsHints && Object.keys(content.phoneticsHints).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(content.phoneticsHints).map(([word, ipa]) => (
            <span
              key={word}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-aura-surface border border-aura-border text-sm"
            >
              <span className="text-aura-text font-medium">{word}</span>
              <span className="text-aura-text-dim">/{ipa}/</span>
            </span>
          ))}
        </div>
      )}

      {/* Listen button */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleListen}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          }
        >
          {isSpeaking ? 'Stop Listening' : 'Listen'}
        </Button>
      </div>

      {/* Microphone */}
      {phase !== 'completed' && (
        <div className="flex justify-center py-4">
          <Microphone
            isListening={isListening}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>
      )}

      {/* Real-time transcription */}
      {fullTranscript && (
        <Card variant="default" padding="sm">
          <p className="text-sm text-aura-text-dim mb-1 font-medium">Your transcription:</p>
          <p className="text-aura-text leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-aura-text-dim italic"> {interimTranscript}</span>
            )}
          </p>
        </Card>
      )}

      {/* Feedback after scoring */}
      {phase === 'completed' && hasRecorded && (
        <Card variant="default">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide">
              Detailed Scores
            </h3>
            {(() => {
              const details = useExerciseStore.getState().result?.details as ReadAloudScore | undefined
              if (!details) return null
              return (
                <div className="grid grid-cols-3 gap-3">
                  <ScoreBar label="Accuracy" value={details.accuracy} />
                  <ScoreBar label="Fluency" value={details.fluency} />
                  <ScoreBar label="Pronunciation" value={details.pronunciation} />
                </div>
              )
            })()}
          </div>
        </Card>
      )}
    </ExerciseWrapper>
  )
}

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

function generateFeedback(accuracy: number, fluency: number, pronunciation: number): string {
  const avg = (accuracy + fluency + pronunciation) / 3

  if (avg >= 90) return 'Excellent reading! Your pronunciation and pacing were outstanding.'
  if (avg >= 75) return 'Good job! Focus on the highlighted key phrases for even better pronunciation.'
  if (avg >= 60) return 'Decent effort. Try slowing down and paying attention to word endings.'
  return 'Keep practicing. Listen to the model reading and try to match the rhythm and pronunciation.'
}
