import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Exercise, ReadAloudContent } from '../../types/exercise'
import type { ExerciseResult, ReadAloudScore } from '../../types/scoring'
import { calculateOverallScore } from '../../types/scoring'
import { useExerciseStore } from '../../stores/exerciseStore'
import { useUserStore } from '../../stores/userStore'
import { wordLevelAccuracy, countFillerWords, calculateWPM, calculateFluency, findMissedWords } from '../../lib/scoring'
import { shouldUseAI, getEffectiveKey, getActiveAI } from '../../lib/ai-status'
import { transcribeAudio } from '../../api/client'
import { scoreReadAloudDirect, analyzePronunciationDirect } from '../../api/directAI'
import { startAudioRecording, stopAudioRecording } from '../../lib/audioRecorder'
import { analyzePitch, detectIntonationPatterns, smoothPitchContour } from '../../lib/pitchAnalyzer'
import { useSpeechRecognition } from '../speech/useSpeechRecognition'
import { Microphone } from '../speech/Microphone'
import { ListenButton } from '../speech/ListenButton'
import { ExerciseWrapper } from './ExerciseWrapper'
import { PitchContour } from '../ui/PitchContour'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import type { PitchContourData } from '../../lib/pitchAnalyzer'
import type { WordAnalysis, IntonationFeedback, RhythmAnalysis } from '../../types/scoring'

interface ReadAloudProps {
  exercise: Exercise
  onComplete?: (result: ExerciseResult) => void
}

export function ReadAloud({ exercise, onComplete }: ReadAloudProps) {
  const content = exercise.content as ReadAloudContent
  const { phase, elapsedSeconds, startExercise, setPhase, setResult, setTranscription } = useExerciseStore()
  const [hasRecorded, setHasRecorded] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [pitchData, setPitchData] = useState<PitchContourData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

  // Reset state when exercise changes (e.g. navigating to next exercise)
  useEffect(() => {
    setHasRecorded(false)
    resetTranscript()
    setAudioBlob(null)
    setPitchData(null)
    setIsAnalyzing(false)
  }, [exercise.id, resetTranscript])

  // When speech recognition stops (user click or browser auto-stop),
  // and we have transcript, mark as recorded
  const prevListening = useRef(false)
  useEffect(() => {
    if (prevListening.current && !isListening && transcript.trim()) {
      setHasRecorded(true)
      setTranscription(transcript.trim())
      // Stop audio recording too
      stopAudioRecording().then(blob => setAudioBlob(blob)).catch(() => {})
      if (phase === 'recording') {
        setPhase('in_progress')
      }
    }
    prevListening.current = isListening
  }, [isListening, transcript, phase, setTranscription, setPhase])

  const handleStart = useCallback(() => {
    if (phase === 'ready') {
      startExercise()
    }
    setPhase('recording')
    setHasRecorded(false)
    resetTranscript()
    try {
      startAudioRecording()
    } catch (err) {
      console.warn('Audio recording not available:', err)
    }
    startListening()
  }, [phase, startExercise, setPhase, resetTranscript, startListening])

  const handleStop = useCallback(() => {
    stopListening()
    // The useEffect above will detect isListening→false and capture the transcript
  }, [stopListening])

  const profile = useUserStore((s) => s.profile)
  const useAI = profile ? shouldUseAI(profile.preferences) : false

  const handleSubmitScore = useCallback(async () => {
    const finalTranscript = transcript.trim()
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
        const activeAI = getActiveAI(profile.preferences)
        if (!activeAI) throw new Error('No AI key available')
        const aiResult = await scoreReadAloudDirect(
          {
            originalText: content.passage,
            transcription: finalTranscript,
            keyPhrases: content.keyPhrases,
          },
          activeAI
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

    // If AI available, do comprehensive analysis in background
    if (useAI && profile) {
      setIsAnalyzing(true)
      try {
        const openaiKey = getEffectiveKey(profile.preferences, 'gpt')

        // Step 1: Whisper transcription (if we have audio)
        let whisperWords = undefined
        if (audioBlob && openaiKey) {
          const whisperResult = await transcribeAudio(audioBlob, openaiKey)
          whisperWords = whisperResult.words
        }

        // Step 2: Pitch analysis (if we have audio)
        let pitchContour = null
        if (audioBlob) {
          pitchContour = await analyzePitch(audioBlob)
          setPitchData(pitchContour)
        }

        // Step 3: AI comprehensive analysis (direct call, no backend needed)
        const activeAI2 = getActiveAI(profile.preferences)
        if (!activeAI2) throw new Error('No AI key available')
        const aiAnalysis = await analyzePronunciationDirect(
          {
            originalText: content.passage,
            transcription: finalTranscript,
            whisperWords,
            pitchData: pitchContour ? { averageF0: pitchContour.averageF0, minF0: pitchContour.minF0, maxF0: pitchContour.maxF0 } : undefined,
            durationSeconds: elapsedSeconds,
            wpm: calculateWPM(finalTranscript, elapsedSeconds),
          },
          activeAI2
        )

        // Update the result with AI analysis
        const analysis = aiAnalysis as {
          wordAnalysis?: WordAnalysis[]
          intonationFeedback?: IntonationFeedback[]
          rhythmAnalysis?: RhythmAnalysis
          pronunciationCoaching?: string
        }
        const enhancedDetails: ReadAloudScore = {
          ...details,
          wordAnalysis: analysis.wordAnalysis,
          intonationFeedback: analysis.intonationFeedback,
          rhythmAnalysis: analysis.rhythmAnalysis,
          pronunciationCoaching: analysis.pronunciationCoaching,
        }
        const enhancedResult: ExerciseResult = { ...result, details: enhancedDetails }
        setResult(enhancedResult)
      } catch (err) {
        console.warn('AI analysis failed:', err)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }, [transcript, content.passage, elapsedSeconds, exercise, setPhase, setResult, useAI, profile, content.keyPhrases, audioBlob])

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

      {/* Submit button after recording */}
      {hasRecorded && !isListening && phase !== 'completed' && phase !== 'scoring' && (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm text-aura-text-dim">
            {transcript.trim()
              ? 'Happy with your recording? Submit it for scoring, or record again.'
              : 'No speech detected. Try recording again.'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleStart}>
              Record Again
            </Button>
            {transcript.trim() && (
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
      {phase === 'completed' && (() => {
        const details = useExerciseStore.getState().result?.details as ReadAloudScore | undefined
        if (!details) return null

        const mispronounced = details.wordAnalysis?.filter(w => w.status === 'mispronounced') ?? []

        const patternIcon = (pattern: string) => {
          if (pattern === 'rising') return '\u2197\uFE0F'
          if (pattern === 'falling') return '\u2198\uFE0F'
          return '\u27A1\uFE0F'
        }

        return (
          <div className="flex flex-col gap-4">
            {/* a. Overall Coaching */}
            {details.pronunciationCoaching && (
              <Card variant="glass">
                <div className="border-l-4 border-aura-gold pl-4">
                  <p className="text-aura-text text-lg leading-relaxed">
                    {details.pronunciationCoaching}
                  </p>
                </div>
              </Card>
            )}

            {/* b. Score Bars */}
            <Card variant="default">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide">
                  Detailed Scores
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <ScoreBar label="Accuracy" value={details.accuracy} />
                  <ScoreBar label="Fluency" value={details.fluency} />
                  <ScoreBar label="Pronunciation" value={details.pronunciation} />
                </div>
              </div>
            </Card>

            {/* h. AI Analysis Loading */}
            {isAnalyzing && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-8 h-8 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-aura-text-dim">Running AI pronunciation analysis...</p>
              </div>
            )}

            {/* c. Word-by-Word Analysis */}
            {details.wordAnalysis && details.wordAnalysis.length > 0 && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Word-by-Word Analysis
                </h3>
                <div className="max-h-64 overflow-y-auto flex flex-col gap-2">
                  {details.wordAnalysis.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      {w.status === 'correct' && (
                        <>
                          <span className="shrink-0">{'\u2705'}</span>
                          <span className="text-aura-success font-medium">{w.word}</span>
                        </>
                      )}
                      {w.status === 'mispronounced' && (
                        <>
                          <span className="shrink-0">{'\u26A0\uFE0F'}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-aura-gold font-medium">{w.word}</span>
                            {w.ipa && (
                              <span className="text-xs text-aura-text-dim">/{w.ipa}/</span>
                            )}
                            {w.tip && (
                              <span className="text-xs text-aura-text-dim italic">{w.tip}</span>
                            )}
                            <ListenButton text={w.word} />
                          </div>
                        </>
                      )}
                      {w.status === 'missed' && (
                        <>
                          <span className="shrink-0">{'\u274C'}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-aura-error font-medium">{w.word}</span>
                            <span className="text-xs text-aura-text-dim">word was skipped</span>
                          </div>
                        </>
                      )}
                      {w.status === 'added' && (
                        <>
                          <span className="shrink-0">{'\u2795'}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-aura-text-dim font-medium">{w.word}</span>
                            <span className="text-xs text-aura-text-dim">extra word</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* d. Pitch Contour */}
            {pitchData && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Pitch Contour
                </h3>
                <PitchContour points={smoothPitchContour(pitchData.points)} durationSeconds={pitchData.durationSeconds} />
              </Card>
            )}

            {/* e. Intonation Feedback */}
            {details.intonationFeedback && details.intonationFeedback.length > 0 && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Intonation
                </h3>
                <div className="flex flex-col gap-2">
                  {details.intonationFeedback.map((item, i) => {
                    const matches = item.expectedPattern === item.actualPattern
                    return (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <span className="shrink-0">{matches ? '\u2705' : '\u26A0\uFE0F'}</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-aura-text text-sm">
                            {item.sentence}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-aura-text-dim">
                            <span>expected: {patternIcon(item.expectedPattern)} {item.expectedPattern}</span>
                            <span>actual: {patternIcon(item.actualPattern)} {item.actualPattern}</span>
                          </div>
                          {!matches && item.feedback && (
                            <span className="text-xs text-aura-text-dim italic">{item.feedback}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* f. Rhythm Analysis */}
            {details.rhythmAnalysis && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Rhythm & Pacing
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-aura-text-dim">Words per Minute</span>
                    <span className="text-lg font-medium text-aura-text">
                      {details.rhythmAnalysis.wpm}
                      {details.rhythmAnalysis.optimalWpmRange && (
                        <span className="text-xs text-aura-text-dim ml-1">
                          (optimal: {details.rhythmAnalysis.optimalWpmRange[0]}-{details.rhythmAnalysis.optimalWpmRange[1]})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-aura-text-dim">Pauses</span>
                    <span className="text-lg font-medium text-aura-text">
                      {details.rhythmAnalysis.pauseCount}
                    </span>
                  </div>
                  {details.rhythmAnalysis.fillerWords && details.rhythmAnalysis.fillerWords.length > 0 && (
                    <div className="flex flex-col gap-1 col-span-2">
                      <span className="text-xs text-aura-text-dim">Filler Words</span>
                      <span className="text-sm text-aura-gold">
                        {details.rhythmAnalysis.fillerWords.join(', ')}
                      </span>
                    </div>
                  )}
                  {details.rhythmAnalysis.paceVariation !== undefined && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-aura-text-dim">Pace Variation</span>
                      <span className="text-lg font-medium text-aura-text">
                        {details.rhythmAnalysis.paceVariation}%
                      </span>
                    </div>
                  )}
                </div>
                {details.rhythmAnalysis.feedback && (
                  <p className="text-sm text-aura-text-dim mt-3">{details.rhythmAnalysis.feedback}</p>
                )}
              </Card>
            )}

            {/* g. Practice These Words */}
            {mispronounced.length > 0 && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Practice These Words
                </h3>
                <div className="flex flex-col gap-3">
                  {mispronounced.map((w, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-aura-surface border border-aura-border">
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-aura-text text-lg font-semibold">{w.word}</span>
                        {w.ipa && (
                          <span className="text-aura-text-dim text-sm">/{w.ipa}/</span>
                        )}
                        {w.tip && (
                          <span className="text-aura-text-dim text-xs italic">{w.tip}</span>
                        )}
                      </div>
                      <ListenButton text={w.word} />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
      })()}
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

function patternIcon(pattern: string): string {
  switch (pattern) {
    case 'rising': return '\u2197\uFE0F'
    case 'falling': return '\u2198\uFE0F'
    case 'rise-fall': return '\u2935\uFE0F'
    case 'fall-rise': return '\u21A9\uFE0F'
    case 'flat': return '\u27A1\uFE0F'
    default: return ''
  }
}
