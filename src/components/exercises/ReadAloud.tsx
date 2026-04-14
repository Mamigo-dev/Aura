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
import { assessPronunciation, type AzurePronunciationResult } from '../../lib/azurePronunciation'
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [pitchData, setPitchData] = useState<PitchContourData | null>(null)
  const [azureResult, setAzureResult] = useState<AzurePronunciationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const playbackRef = useRef<HTMLAudioElement | null>(null)

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
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setPitchData(null)
    setAzureResult(null)
    setIsAnalyzing(false)
    setIsPlayingRecording(false)
  }, [exercise.id, resetTranscript])

  // When speech recognition stops (user click or browser auto-stop),
  // and we have transcript, mark as recorded
  const prevListening = useRef(false)
  useEffect(() => {
    if (prevListening.current && !isListening && transcript.trim()) {
      setHasRecorded(true)
      setTranscription(transcript.trim())
      // Stop audio recording and create playback URL
      stopAudioRecording().then(blob => {
        setAudioBlob(blob)
        if (blob.size > 0) {
          if (audioUrl) URL.revokeObjectURL(audioUrl)
          setAudioUrl(URL.createObjectURL(blob))
        }
      }).catch(() => {})
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

    // If Azure key exists, do Azure analysis BEFORE showing results (no score flicker)
    const azureKey = profile ? getEffectiveKey(profile.preferences, 'azure') : ''
    if (audioBlob && azureKey && profile) {
      setIsAnalyzing(true)
      try {
        const azureRegion = profile.preferences.azureRegion || 'eastus'
        const azure = await assessPronunciation(audioBlob, content.passage, {
          subscriptionKey: azureKey,
          region: azureRegion,
        })
        setAzureResult(azure)

        // Use Azure scores as primary
        details.accuracy = azure.accuracyScore
        details.fluency = azure.fluencyScore
        details.pronunciation = azure.pronunciationScore

        details.wordAnalysis = azure.words.map(w => ({
          word: w.word,
          expected: w.word,
          status: w.errorType === 'None'
            ? (w.accuracyScore >= 80 ? 'correct' as const : 'accent_issue' as const)
            : w.errorType === 'Omission' ? 'missed' as const
            : w.errorType === 'Mispronunciation' ? 'mispronounced' as const
            : 'accent_issue' as const,
          confidence: w.accuracyScore / 100,
          offsetMs: w.offsetMs,
          durationMs: w.durationMs,
          tip: w.accuracyScore < 80
            ? `Accuracy: ${w.accuracyScore}%. Focus on clear pronunciation of each syllable.`
            : undefined,
        }))
      } catch (e) {
        console.warn('Azure Pronunciation Assessment failed:', e)
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

    // Then do GPT analysis in background (enriches with IPA, tips, coaching)
    if (useAI && profile) {
      if (!isAnalyzing) setIsAnalyzing(true)
      try {
        const openaiKey = getEffectiveKey(profile.preferences, 'gpt')

        // Azure was already done above (before showing results)
        // Now continue with Whisper + GPT enrichment

        // Step 1: Whisper transcription (much more accurate than Web Speech API)
        let whisperWords = undefined
        let whisperText = finalTranscript // fallback to Web Speech API
        if (audioBlob && openaiKey) {
          try {
            const whisperResult = await transcribeAudio(audioBlob, openaiKey)
            whisperText = whisperResult.text || finalTranscript
            whisperWords = whisperResult.words
          } catch (e) {
            console.warn('Whisper failed, using Web Speech API transcript:', e)
          }
        }

        // Step 2: Pitch analysis (if we have audio)
        let pitchContour = null
        if (audioBlob) {
          try {
            pitchContour = await analyzePitch(audioBlob)
            setPitchData(pitchContour)
          } catch (e) {
            console.warn('Pitch analysis failed:', e)
          }
        }

        // Step 3: AI analysis using Whisper transcript (NOT Web Speech API)
        const activeAI2 = getActiveAI(profile.preferences)
        if (!activeAI2) throw new Error('No AI key available')
        const aiAnalysis = await analyzePronunciationDirect(
          {
            originalText: content.passage,
            transcription: whisperText, // Use Whisper's more accurate transcript
            whisperWords,
            pitchData: pitchContour ? { averageF0: pitchContour.averageF0, minF0: pitchContour.minF0, maxF0: pitchContour.maxF0 } : undefined,
            durationSeconds: elapsedSeconds,
            wpm: calculateWPM(whisperText, elapsedSeconds),
          },
          activeAI2
        )

        // Update the result with AI analysis
        const analysis = aiAnalysis as {
          wordAnalysis?: WordAnalysis[]
          intonationFeedback?: IntonationFeedback[]
          rhythmAnalysis?: RhythmAnalysis
          pronunciationCoaching?: string
          connectedSpeech?: string
          trainingPlan?: import('../../types/scoring').TrainingPlan
        }
        // Merge GPT analysis with Azure word data (keep Azure timestamps + scores)
        let mergedWordAnalysis = details.wordAnalysis // Azure data with timestamps
        if (analysis.wordAnalysis && mergedWordAnalysis) {
          // Enrich Azure words with GPT's IPA and tips
          const gptMap = new Map(
            (analysis.wordAnalysis as WordAnalysis[]).map(w => [w.word.toLowerCase(), w])
          )
          mergedWordAnalysis = mergedWordAnalysis.map(azureWord => {
            const gptWord = gptMap.get(azureWord.word.toLowerCase())
            return {
              ...azureWord,
              ipa: gptWord?.ipa || azureWord.ipa,
              tip: gptWord?.tip || azureWord.tip,
            }
          })
        } else if (analysis.wordAnalysis) {
          mergedWordAnalysis = analysis.wordAnalysis as WordAnalysis[]
        }

        const enhancedDetails: ReadAloudScore = {
          ...details,
          transcription: whisperText,
          whisperTranscription: whisperText,
          wordAnalysis: mergedWordAnalysis,
          intonationFeedback: analysis.intonationFeedback as IntonationFeedback[] | undefined,
          rhythmAnalysis: analysis.rhythmAnalysis as RhythmAnalysis | undefined,
          pronunciationCoaching: analysis.pronunciationCoaching,
          connectedSpeech: analysis.connectedSpeech,
          trainingPlan: analysis.trainingPlan,
        }

        // Recalculate accuracy and fluency with Whisper transcript
        const whisperAccuracy = wordLevelAccuracy(content.passage, whisperText)
        const { count: wFillerCount } = countFillerWords(whisperText)
        const wWpm = calculateWPM(whisperText, elapsedSeconds)
        const wTotalWords = whisperText.split(/\s+/).filter(Boolean).length
        const whisperFluency = calculateFluency(wWpm, wFillerCount, wTotalWords, 'reading')
        enhancedDetails.accuracy = Math.max(enhancedDetails.accuracy, whisperAccuracy)
        enhancedDetails.fluency = Math.max(enhancedDetails.fluency, whisperFluency)
        enhancedDetails.missedWords = findMissedWords(content.passage, whisperText)

        // Calculate pronunciation score from AI analysis (not just word matching)
        const words = analysis.wordAnalysis || []
        const totalWords = words.length || 1
        const accentIssues = words.filter((w: WordAnalysis) => w.status === 'accent_issue').length
        const mispronounced = words.filter((w: WordAnalysis) => w.status === 'mispronounced').length
        const missed = words.filter((w: WordAnalysis) => w.status === 'missed').length
        // accent_issue = -5 points each, mispronounced = -15 each, missed = -10 each
        const pronPenalty = (accentIssues * 5 + mispronounced * 15 + missed * 10) / totalWords * 10
        enhancedDetails.pronunciation = Math.max(20, Math.round(100 - pronPenalty))
        // Recalculate overall score with enhanced details
        const enhancedOverall = calculateOverallScore('read_aloud', enhancedDetails)
        const enhancedResult: ExerciseResult = {
          ...result,
          score: Math.max(result.score, enhancedOverall),
          passed: Math.max(result.score, enhancedOverall) >= exercise.passingScore,
          details: enhancedDetails,
        }
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

        const problems = details.wordAnalysis?.filter(w => w.status !== 'correct') ?? []
        const missed = details.missedWords || []

        // Build side-by-side comparison data
        const originalWords = content.passage.split(/\s+/)
        const spokenWords = details.transcription.split(/\s+/)

        return (
          <div className="flex flex-col gap-4">

            {/* 1. AI Coach Summary */}
            {details.pronunciationCoaching && (
              <Card variant="aura">
                <h3 className="text-sm font-semibold text-aura-gold uppercase tracking-wide mb-2">
                  AI Coach
                </h3>
                <p className="text-aura-text leading-relaxed">
                  {details.pronunciationCoaching}
                </p>
              </Card>
            )}

            {/* Score bars */}
            <Card variant="default">
              {azureResult && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                    Azure Phoneme Analysis
                  </span>
                  <span className="text-[10px] text-aura-text-dim">
                    Prosody: {azureResult.prosodyScore} | Completeness: {azureResult.completenessScore}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <ScoreBar label="Accuracy" value={details.accuracy} />
                <ScoreBar label="Fluency" value={details.fluency} />
                <ScoreBar label="Pronunciation" value={details.pronunciation} />
              </div>
            </Card>

            {/* AI analysis loading */}
            {isAnalyzing && (
              <Card variant="glass">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-aura-text-dim">AI is analyzing your pronunciation in detail...</p>
                </div>
              </Card>
            )}

            {/* 2. Side-by-Side: Original vs Your Reading */}
            <Card variant="default">
              <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                What You Said vs Original
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-aura-text-dim mb-1.5 font-medium">Original text:</p>
                  <p className="text-sm text-aura-text leading-relaxed p-3 rounded-lg bg-aura-surface border border-aura-border">
                    {originalWords.map((word, i) => {
                      const lower = word.toLowerCase().replace(/[^\w]/g, '')
                      const isMissed = missed.some(m => m.toLowerCase() === lower)
                      const isMispronounced = problems.some(p => p.word.toLowerCase() === lower && p.status === 'mispronounced')
                      const isAccentIssue = problems.some(p => p.word.toLowerCase() === lower && p.status === 'accent_issue')
                      return (
                        <span key={i}>
                          <span className={
                            isMissed ? 'bg-aura-error/20 text-aura-error px-0.5 rounded' :
                            isMispronounced ? 'bg-aura-error/20 text-aura-gold px-0.5 rounded' :
                            isAccentIssue ? 'bg-aura-purple/20 text-aura-purple px-0.5 rounded' :
                            ''
                          }>{word}</span>{' '}
                        </span>
                      )
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-aura-text-dim mb-1.5 font-medium">
                    What you said:
                    {details.whisperTranscription && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-aura-purple/20 text-aura-purple">
                        Whisper AI
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-aura-text leading-relaxed p-3 rounded-lg bg-aura-surface border border-aura-border">
                    {(details.whisperTranscription || details.transcription).split(/\s+/).map((word, i) => <span key={i}>{word} </span>)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-aura-text-dim">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-aura-purple/60" /> Accent Issue</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-aura-error/60" /> Missed/Wrong</span>
                </div>
              </div>
            </Card>

            {/* 3. Problems Found - only show words that need work */}
            {problems.length > 0 && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Pronunciation Issues ({problems.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {problems.map((w, i) => {
                    const statusConfig = {
                      accent_issue: { label: 'Accent', color: 'bg-aura-purple/20 text-aura-purple', border: 'bg-aura-purple/5 border-aura-purple/20' },
                      mispronounced: { label: 'Wrong Word', color: 'bg-aura-error/20 text-aura-error', border: 'bg-aura-error/5 border-aura-error/20' },
                      missed: { label: 'Skipped', color: 'bg-aura-error/20 text-aura-error', border: 'bg-aura-error/5 border-aura-error/20' },
                      added: { label: 'Extra', color: 'bg-aura-text-dim/20 text-aura-text-dim', border: 'bg-aura-surface border-aura-border' },
                      correct: { label: '', color: '', border: '' },
                    }
                    const config = statusConfig[w.status] || statusConfig.accent_issue
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${config.border}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-aura-text">{w.word}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${config.color}`}>
                                {config.label}
                              </span>
                            </div>

                            {w.ipa && (
                              <p className="text-sm text-aura-text-dim font-mono mb-1">
                                Correct: /{w.ipa}/
                              </p>
                            )}

                            {w.status === 'mispronounced' && w.expected && w.expected !== w.word && (
                              <p className="text-sm text-aura-text-dim mb-1">
                                You said: <span className="text-aura-error font-medium">"{w.expected}"</span>
                              </p>
                            )}

                            {w.tip && (
                              <p className="text-sm text-aura-text mt-1 bg-aura-surface/50 p-2 rounded-lg">
                                💡 {w.tip}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            {/* Play AI model pronunciation */}
                            <ListenButton text={w.word} size="sm" />
                            {/* Play user's own pronunciation of this word */}
                            {audioUrl && w.offsetMs != null && w.durationMs != null && w.durationMs > 0 && (
                              <button
                                onClick={() => {
                                  const audio = new Audio(audioUrl)
                                  audio.currentTime = w.offsetMs! / 1000
                                  const endTime = (w.offsetMs! + w.durationMs!) / 1000
                                  audio.play()
                                  const checkEnd = () => {
                                    if (audio.currentTime >= endTime) {
                                      audio.pause()
                                      audio.removeEventListener('timeupdate', checkEnd)
                                    }
                                  }
                                  audio.addEventListener('timeupdate', checkEnd)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-aura-surface border border-aura-border text-aura-text-dim hover:text-aura-text hover:border-aura-purple/50 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                </svg>
                                My Voice
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Connected Speech feedback */}
            {details.connectedSpeech && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-2">
                  Connected Speech & Flow
                </h3>
                <p className="text-sm text-aura-text-dim leading-relaxed">
                  💡 {details.connectedSpeech}
                </p>
              </Card>
            )}

            {/* 4. Intonation Issues - only show problems */}
            {details.intonationFeedback && details.intonationFeedback.some(f => f.expectedPattern !== f.actualPattern) && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Intonation Issues
                </h3>
                <div className="flex flex-col gap-3">
                  {details.intonationFeedback
                    .filter(f => f.expectedPattern !== f.actualPattern)
                    .map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-aura-gold/5 border border-aura-gold/20">
                      <p className="text-sm text-aura-text mb-2 italic">"{item.sentence}"</p>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs px-2 py-1 rounded bg-aura-error/10 text-aura-error">
                          Your tone: {patternIcon(item.actualPattern)} {item.actualPattern}
                        </span>
                        <span className="text-aura-text-dim">→</span>
                        <span className="text-xs px-2 py-1 rounded bg-aura-success/10 text-aura-success">
                          Should be: {patternIcon(item.expectedPattern)} {item.expectedPattern}
                        </span>
                      </div>
                      {item.feedback && (
                        <p className="text-sm text-aura-text-dim">💡 {item.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 5. Speed & Rhythm - compact */}
            {details.rhythmAnalysis && (
              <Card variant="default">
                <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                  Speed & Rhythm
                </h3>
                <div className="flex items-center gap-6 mb-3">
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${
                      details.rhythmAnalysis.wpm >= 130 && details.rhythmAnalysis.wpm <= 160
                        ? 'text-aura-success'
                        : details.rhythmAnalysis.wpm < 100 ? 'text-aura-error' : 'text-aura-gold'
                    }`}>
                      {details.rhythmAnalysis.wpm}
                    </span>
                    <p className="text-xs text-aura-text-dim">WPM</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-aura-surface rounded-full relative">
                      {/* Optimal range indicator */}
                      <div className="absolute h-full bg-aura-success/20 rounded-full"
                        style={{
                          left: `${Math.max(0, (130 / 200) * 100)}%`,
                          width: `${((160 - 130) / 200) * 100}%`
                        }}
                      />
                      {/* User's position */}
                      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-aura-purple border-2 border-white"
                        style={{ left: `${Math.min(100, (details.rhythmAnalysis.wpm / 200) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-aura-text-dim mt-1">
                      <span>Too slow</span>
                      <span className="text-aura-success">130-160 ideal</span>
                      <span>Too fast</span>
                    </div>
                  </div>
                </div>
                {details.rhythmAnalysis.feedback && (
                  <p className="text-sm text-aura-text-dim">💡 {details.rhythmAnalysis.feedback}</p>
                )}
              </Card>
            )}

            {/* Training Plan */}
            {details.trainingPlan && (
              <Card variant="aura">
                <h3 className="text-sm font-semibold text-aura-gold uppercase tracking-wide mb-2">
                  Your Training Plan
                </h3>
                <p className="text-sm text-aura-text mb-4">{details.trainingPlan.summary}</p>

                <div className="flex items-center gap-4 mb-4 text-xs text-aura-text-dim">
                  <span>⏱ {details.trainingPlan.dailyPracticeMinutes} min/day</span>
                  <span>📅 ~{details.trainingPlan.estimatedWeeksToImprove} weeks to improve</span>
                </div>

                <div className="flex flex-col gap-2">
                  {details.trainingPlan.exercises.map((ex, i) => (
                    <div key={i} className="p-3 rounded-lg bg-aura-surface/50 border border-aura-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-aura-text">{ex.name}</span>
                        {ex.targetSound && (
                          <span className="text-xs px-2 py-0.5 rounded bg-aura-purple/20 text-aura-purple font-mono">
                            {ex.targetSound}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-aura-text-dim mb-1">{ex.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-aura-text-dim">
                        <span>🔄 {ex.frequency}</span>
                        <span>⏱ {ex.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 6. Compare: Your Recording vs Model */}
            <Card variant="glass">
              <h3 className="text-sm font-semibold text-aura-text uppercase tracking-wide mb-3">
                Compare Recordings
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Your recording playback */}
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-aura-surface border border-aura-border">
                  <span className="text-xs text-aura-text-dim font-medium">Your Reading</span>
                  {audioUrl ? (
                    <button
                      onClick={() => {
                        if (isPlayingRecording && playbackRef.current) {
                          playbackRef.current.pause()
                          playbackRef.current.currentTime = 0
                          setIsPlayingRecording(false)
                        } else {
                          const audio = new Audio(audioUrl)
                          playbackRef.current = audio
                          setIsPlayingRecording(true)
                          audio.onended = () => setIsPlayingRecording(false)
                          audio.play()
                        }
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isPlayingRecording
                          ? 'bg-aura-error animate-pulse'
                          : 'bg-aura-purple hover:bg-aura-deep-purple'
                      }`}
                    >
                      {isPlayingRecording ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-aura-text-dim">Not available</span>
                  )}
                </div>

                {/* Model reading */}
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-aura-surface border border-aura-border">
                  <span className="text-xs text-aura-text-dim font-medium">Model Reading</span>
                  <div className="h-12 flex items-center">
                    <ListenButton text={content.passage} size="sm" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-aura-text-dim mt-3 text-center">
                Play both to hear the difference, then try again.
              </p>
            </Card>

            {/* Pitch contour removed — Intonation Issues section already gives
                actionable feedback in plain language. The raw pitch chart
                is unreadable for most users. */}
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
