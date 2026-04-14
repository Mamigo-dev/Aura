import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { Microphone } from '../components/speech/Microphone'
import { ListenButton } from '../components/speech/ListenButton'
import { useSpeechRecognition } from '../components/speech/useSpeechRecognition'
import { Header } from '../components/layout/Header'
import { getActiveAI } from '../lib/ai-status'
import { callAIDirect, parseAIJSON } from '../api/directAI'
import type { TrainingExercise } from '../types/scoring'

interface GeneratedDrill {
  type: 'minimal_pairs' | 'tongue_twister' | 'targeted_passage' | 'word_repetition'
  title: string
  instructions: string
  content: string[]          // words/sentences to practice
  targetSound: string
  modelSentence?: string     // a full sentence to read aloud
}

export default function Training() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const profile = useUserStore((s) => s.profile)
  const trainingPlan = profile?.trainingPlan

  const exerciseIndex = parseInt(searchParams.get('exercise') || '0', 10)
  const [drill, setDrill] = useState<GeneratedDrill | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [practiceResults, setPracticeResults] = useState<{ word: string; done: boolean }[]>([])

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ continuous: false, interimResults: true })

  // If no training plan, show prompt to do a Read Aloud first
  if (!trainingPlan || trainingPlan.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
        <Header showBack title="Training" showSettings={false} />
        <div className="max-w-lg mx-auto px-4 pt-12">
          <Card variant="glass" padding="lg" className="text-center">
            <span className="text-4xl block mb-4">🎯</span>
            <h2 className="text-xl font-semibold mb-2">No Training Plan Yet</h2>
            <p className="text-aura-text-dim mb-6">
              Complete a Read Aloud exercise first. The AI will analyze your pronunciation and create a personalized training plan.
            </p>
            <Button variant="primary" onClick={() => navigate('/practice')}>
              Go to Practice
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const currentExercise = trainingPlan.exercises[exerciseIndex]
  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
        <Header showBack title="Training" showSettings={false} />
        <div className="max-w-lg mx-auto px-4 pt-12">
          <Card variant="glass" padding="lg" className="text-center">
            <span className="text-4xl block mb-4">✅</span>
            <h2 className="text-xl font-semibold mb-2">All Exercises Done!</h2>
            <p className="text-aura-text-dim mb-6">Come back tomorrow for more practice.</p>
            <Button variant="primary" onClick={() => navigate('/')}>Back to Home</Button>
          </Card>
        </div>
      </div>
    )
  }

  const generateDrill = useCallback(async (exercise: TrainingExercise) => {
    if (!profile) return
    const ai = getActiveAI(profile.preferences)
    if (!ai) return

    setIsGenerating(true)
    try {
      const response = await callAIDirect(
        `You are a pronunciation coach creating a targeted practice drill.

Generate a drill for the student based on this training exercise:
- Name: ${exercise.name}
- Target sound: ${exercise.targetSound || 'general pronunciation'}
- Description: ${exercise.description}

Return JSON only:
{
  "type": "minimal_pairs|tongue_twister|targeted_passage|word_repetition",
  "title": "Drill title",
  "instructions": "Clear instructions for the student",
  "content": ["word1 vs word2", "word3 vs word4", ...] or ["sentence1", "sentence2", ...],
  "targetSound": "${exercise.targetSound || ''}",
  "modelSentence": "A sentence using the target sound naturally"
}

For minimal_pairs: provide 6-8 word pairs like ["thin vs sin", "think vs sink"]
For tongue_twister: provide 3-4 tongue twisters targeting the sound
For targeted_passage: provide 3-4 sentences loaded with the target sound
For word_repetition: provide 8-10 individual words with the target sound`,
        `Create a ${exercise.name} drill targeting ${exercise.targetSound || 'pronunciation improvement'}`,
        ai
      )

      const parsed = parseAIJSON<GeneratedDrill>(response)
      setDrill(parsed)
      setCurrentWordIndex(0)
      setPracticeResults(parsed.content.map(w => ({ word: w, done: false })))
    } catch (err) {
      console.error('Failed to generate drill:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [profile])

  const handlePracticeWord = useCallback(() => {
    resetTranscript()
    startListening()
  }, [resetTranscript, startListening])

  const handleStopPractice = useCallback(() => {
    stopListening()
    setPracticeResults(prev => {
      const next = [...prev]
      if (next[currentWordIndex]) {
        next[currentWordIndex] = { ...next[currentWordIndex], done: true }
      }
      return next
    })
  }, [stopListening, currentWordIndex])

  const handleNext = useCallback(() => {
    if (drill && currentWordIndex < drill.content.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      resetTranscript()
    }
  }, [drill, currentWordIndex, resetTranscript])

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
      <Header showBack title="Training" showSettings={false} />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6 animate-fade-in-up">
        {/* Training Plan Overview */}
        {!drill && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-1">
                <GradientText>Your Training Plan</GradientText>
              </h2>
              <p className="text-sm text-aura-text-dim">{trainingPlan.summary}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-aura-text-dim">
                <span>⏱ {trainingPlan.dailyPracticeMinutes} min/day</span>
                <span>📅 ~{trainingPlan.estimatedWeeksToImprove} weeks</span>
              </div>
            </div>

            {/* Exercise list */}
            <div className="space-y-3">
              {trainingPlan.exercises.map((ex, i) => (
                <Card
                  key={i}
                  variant="gradient"
                  padding="md"
                  hoverable
                  onClick={() => generateDrill(ex)}
                  className={i === exerciseIndex ? 'ring-2 ring-aura-purple' : ''}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-aura-text">{ex.name}</span>
                        {ex.targetSound && (
                          <span className="text-xs px-2 py-0.5 rounded bg-aura-purple/20 text-aura-purple font-mono">
                            {ex.targetSound}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-aura-text-dim">{ex.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-aura-text-dim">
                        <span>🔄 {ex.frequency}</span>
                        <span>⏱ {ex.duration}</span>
                      </div>
                    </div>
                    <span className="text-aura-purple text-lg">▶</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Generating */}
        {isGenerating && (
          <Card variant="glass" padding="lg" className="text-center">
            <div className="w-8 h-8 border-2 border-aura-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-aura-text-dim">Generating your practice drill...</p>
          </Card>
        )}

        {/* Active Drill */}
        {drill && !isGenerating && (
          <>
            <Card variant="aura" padding="lg">
              <h2 className="text-lg font-bold text-aura-text mb-1">{drill.title}</h2>
              {drill.targetSound && (
                <span className="inline-block text-xs px-2 py-0.5 rounded bg-aura-purple/20 text-aura-purple font-mono mb-2">
                  {drill.targetSound}
                </span>
              )}
              <p className="text-sm text-aura-text-dim">{drill.instructions}</p>
            </Card>

            {/* Model sentence to listen to */}
            {drill.modelSentence && (
              <Card variant="glass" padding="md">
                <p className="text-xs text-aura-text-dim mb-2">Listen to the model first:</p>
                <p className="text-aura-text mb-3 italic">"{drill.modelSentence}"</p>
                <ListenButton text={drill.modelSentence} />
              </Card>
            )}

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 justify-center">
              {drill.content.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentWordIndex ? 'bg-aura-purple scale-125' :
                  practiceResults[i]?.done ? 'bg-aura-success' : 'bg-aura-border'
                }`} />
              ))}
            </div>

            {/* Current word/phrase to practice */}
            <Card variant="default" padding="lg" className="text-center">
              <p className="text-xs text-aura-text-dim mb-2">
                {currentWordIndex + 1} of {drill.content.length}
              </p>
              <p className="text-2xl font-bold text-aura-text mb-4">
                {drill.content[currentWordIndex]}
              </p>

              {/* Listen to this word */}
              <div className="mb-4">
                <ListenButton text={drill.content[currentWordIndex]} />
              </div>

              {/* Record */}
              <div className="flex justify-center mb-3">
                <Microphone
                  isListening={isListening}
                  onStart={handlePracticeWord}
                  onStop={handleStopPractice}
                  size="md"
                />
              </div>

              {/* What user said */}
              {transcript && (
                <p className="text-sm text-aura-text-dim mb-3">
                  You said: <span className="text-aura-text font-medium">{transcript}</span>
                </p>
              )}

              {/* Next button */}
              <div className="flex gap-3 justify-center mt-4">
                {practiceResults[currentWordIndex]?.done && currentWordIndex < drill.content.length - 1 && (
                  <Button variant="primary" onClick={handleNext}>
                    Next →
                  </Button>
                )}
                {practiceResults[currentWordIndex]?.done && currentWordIndex === drill.content.length - 1 && (
                  <Button variant="gold" onClick={() => {
                    setDrill(null)
                    setCurrentWordIndex(0)
                  }}>
                    Drill Complete ✓
                  </Button>
                )}
              </div>
            </Card>

            {/* Back button */}
            <Button variant="ghost" className="w-full" onClick={() => setDrill(null)}>
              ← Back to Training Plan
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
