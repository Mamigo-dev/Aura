import { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SAMPLE_EXERCISES } from '../data/sampleExercises'
import { Header } from '../components/layout/Header'
import { ExerciseWrapper } from '../components/exercises/ExerciseWrapper'
import { ReadAloud } from '../components/exercises/ReadAloud'
import { ReadingComprehension } from '../components/exercises/ReadingComprehension'
import { Writing } from '../components/exercises/Writing'
import { Recitation } from '../components/exercises/Recitation'
import { SpeechMode } from '../components/exercises/SpeechMode'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { saveExerciseResult } from '../lib/db'
import { useUserStore } from '../stores/userStore'
import type { ExerciseResult } from '../types/scoring'

export default function Exercise() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const completeExercise = useUserStore((s) => s.completeExercise)

  const exercise = SAMPLE_EXERCISES.find((ex) => ex.id === id)

  const handleComplete = useCallback(
    async (result: ExerciseResult) => {
      try {
        await saveExerciseResult(result)
        if (exercise) {
          await completeExercise(result.score, exercise.type)
        }
      } catch (err) {
        console.error('Failed to save exercise result:', err)
      }
    },
    [exercise, completeExercise]
  )

  if (!exercise) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text">
        <Header showBack title="Exercise" showSettings={false} />
        <div className="max-w-3xl mx-auto px-4 pt-12">
          <Card variant="glass" padding="lg" className="text-center">
            <p className="text-4xl mb-4">&#x1F50D;</p>
            <h2 className="text-xl font-semibold text-aura-text mb-2">
              Exercise Not Found
            </h2>
            <p className="text-aura-text-dim mb-6">
              The exercise you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="primary" onClick={() => navigate('/practice')}>
              Browse Exercises
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'read_aloud':
        return <ReadAloud exercise={exercise} onComplete={handleComplete} />

      case 'reading_comprehension':
        return (
          <ReadingComprehension exercise={exercise} onComplete={handleComplete} />
        )

      case 'writing':
        return <Writing exercise={exercise} onComplete={handleComplete} />

      case 'recitation':
        return <Recitation exercise={exercise} onComplete={handleComplete} />

      case 'speech_mode':
        return <SpeechMode exercise={exercise} onComplete={handleComplete} />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
      <Header showBack title={exercise.title} showSettings={false} />

      <div className="max-w-3xl mx-auto px-4 pt-6 animate-fade-in-up">
        {renderExerciseContent()}
      </div>
    </div>
  )
}
