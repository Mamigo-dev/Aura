import { useState, useCallback, useMemo } from 'react'
import type { Exercise, ReadAloudContent } from '../../types/exercise'
import type { ExerciseResult, ReadAloudScore } from '../../types/scoring'
import { calculateOverallScore } from '../../types/scoring'
import { useExerciseStore } from '../../stores/exerciseStore'
import { useUserStore } from '../../stores/userStore'
import { wordLevelAccuracy, countFillerWords, calculateWPM, calculateFluency, findMissedWords } from '../../lib/scoring'
import { shouldUseAI } from '../../lib/ai-status'
import { scorePronunciation } from '../../api/client'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'
import { Microphone } from '../speech/Microphone'
import { ListenButton } from '../speech/ListenButton'
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
  const [stoppedTranscript, setStoppedTranscript] = useState('')

  const handleRecordingEnd = useCallback(() => {
    // Speech recognition ended naturally (silence or browser stopped it)
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
    setHasRecorded(false)
    setStoppedTranscript('')
    resetTranscript()
    startListening()
  }, [phase, startExercise, setPhase, resetTranscript, startListening])

  const handleStop = useCallback(() => {
    stopListening()
    const finalText = transcript.trim()
    setStoppedTranscript(finalText)
    setTranscription(finalText)
    setHasRecorded(true)
    setPhase('in_progress')
  }, [stopListening, transcript, setTranscription, setPhase])

  const profile = useUserStore((s) => s.profile)
  const useAI = profile ? shouldUseAI(profile.preferences) : false

  const handleSubmitScore = useCallback(async () => {
    const finalTranscript = stoppedTranscript || transcript.trim()
    if (!finalTranscript) return

    setPhase('scoring')

    // Always calculate local scores as baseline
    const localAccuracy = wordLevelAccuracy(content.passage, finalTranscript)
    const { count: fillerCount } = countFillerWords(finalTranscript)
    const wpm = calculateWPM(finalTranscript, elapsedSeconds)
    const totalWords = finalTranscript.split(/\s+/).filter(Boolean).length
    const localFluency = calculateFluency(wpm, fillerCount, totalWords, 'reading')
    const missedWords = findMissedWords(content.passage, finalTranscript)
    const localPronunciation = Math.min(100, Math.round(localAccuracy * 0.8 + 20))

    let details: ReadAloudScore

    if (useAI && profile) {
      try {
        const aiResult = await scorePronunciation(
          {
            originalText: content.passage,
            transcription: finalTranscript,
            keyPhrases: content.keyPhrases,
          },
          {
            provider: profile.preferences.aiProvider,
            apiKey: profile.preferences.apiKeys?.[profile.preferences.aiProvider],
          }
        ) as ReadAloudScore

        details = {
          type: 'read_aloud',
          transcription: finalTranscript,
          accuracy: aiResult.accuracy ?? localAccuracy,
          fluency: aiResult.fluency ?? localFluency,
          pronunciation: aiResult.pronunciation ?? localPronunciation,
          missedWords: aiResult.missedWords ?? missedWords,
          mispronounced: aiResult.mispronounced ?? [],
          overallFeedback: aiResult.overallFeedback ?? generateFeedback(localAccuracy, localFluency, localPronunciation),
        }
      } catch (err) {
        console.warn('AI scoring failed, using local:', err)
        details = {
          type: 'read_aloud',
          transcription: finalTranscript,
          accuracy: localAccuracy,
          fluency: localFluency,
          pronunciation: localPronunciation,
          missedWords,
          mispronounced: [],
          overallFeedback: generateFeedback(localAccuracy, localFluency, localPronunciation),
        }
      }
    } else {
      details = {
        type: 'read_aloud',
        transcription: finalTranscript,
        accuracy: localAccuracy,
        fluency: localFluency,
        pronunciation: localPronunciation,
        missedWords,
        mispronounced: [],
        overallFeedback: generateFeedback(localAccuracy, localFluency, localPronunciation),
      }
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
  }, [stoppedTranscript, transcript, content.passage, elapsedSeconds, exercise, setPhase, setResult, useAI, profile, content.keyPhrases])

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

      {/* Listen button - uses AI TTS when OpenAI key is available */}
      <div className="flex justify-center">
        <ListenButton text={content.passage} />
      </div>

      {/* Microphone */}
      {phase !== 'completed' && phase !== 'scoring' && (
        <div className="flex justify-center py-4">
          <Microphone
            isListening={isListening}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>
      )}

      {/* Real-time transcription */}
      {(fullTranscript || stoppedTranscript) && (
        <Card variant="default" padding="sm">
          <p className="text-sm text-aura-text-dim mb-1 font-medium">Your transcription:</p>
          <p className="text-aura-text leading-relaxed">
            {isListening ? (
              <>
                {transcript}
                {interimTranscript && (
                  <span className="text-aura-text-dim italic"> {interimTranscript}</span>
                )}
              </>
            ) : (
              stoppedTranscript || transcript
            )}
          </p>
        </Card>
      )}

      {/* Submit button after recording */}
      {hasRecorded && phase !== 'completed' && phase !== 'scoring' && (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm text-aura-text-dim">
            {stoppedTranscript
              ? 'Happy with your recording? Submit it for scoring, or record again.'
              : 'No speech detected. Try recording again.'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleStart}>
              Record Again
            </Button>
            {stoppedTranscript && (
              <Button variant="gold" onClick={handleSubmitScore}>
                Submit for Scoring
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Scoring in progress */}
      {phase === 'scoring' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-8 h-8 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-aura-text-dim">Analyzing your reading...</p>
        </div>
      )}

      {/* Feedback after scoring */}
      {phase === 'completed' && (
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
