import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SAMPLE_EXERCISES } from '../data/sampleExercises'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { Header } from '../components/layout/Header'
import type { ExerciseType } from '../types/exercise'
import { EXERCISE_TYPE_LABELS } from '../types/exercise'

const EXERCISE_TYPE_META: Record<
  ExerciseType,
  { emoji: string; title: string; description: string; difficulty: string }
> = {
  read_aloud: {
    emoji: '\uD83C\uDFA4',
    title: 'Read Aloud',
    description: 'Read a passage out loud and get scored on pronunciation, fluency, and accuracy.',
    difficulty: 'All Levels',
  },
  reading_comprehension: {
    emoji: '\uD83D\uDCD6',
    title: 'Reading Comprehension',
    description: 'Read a passage and answer questions to test your understanding.',
    difficulty: 'B1 - C1',
  },
  recitation: {
    emoji: '\uD83E\uDDE0',
    title: 'Recitation',
    description: 'Memorize and recite passages to build vocabulary and fluency.',
    difficulty: 'B1 - B2',
  },
  writing: {
    emoji: '\u270F\uFE0F',
    title: 'Writing',
    description: 'Write responses to prompts and receive detailed feedback on grammar and style.',
    difficulty: 'B1 - C2',
  },
  speech_mode: {
    emoji: '\uD83D\uDCCA',
    title: 'Speech Mode',
    description: 'Deliver speeches and presentations with real-time feedback on delivery.',
    difficulty: 'B1 - C2',
  },
}

const EXERCISE_TYPES: ExerciseType[] = [
  'read_aloud',
  'reading_comprehension',
  'recitation',
  'writing',
  'speech_mode',
]

export default function Practice() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedType = searchParams.get('type') as ExerciseType | null

  const filteredExercises = useMemo(() => {
    if (!selectedType) return []
    return SAMPLE_EXERCISES.filter((ex) => ex.type === selectedType)
  }, [selectedType])

  const handleSelectType = (type: ExerciseType) => {
    setSearchParams({ type })
  }

  const handleBack = () => {
    setSearchParams({})
  }

  if (selectedType && EXERCISE_TYPE_META[selectedType]) {
    const meta = EXERCISE_TYPE_META[selectedType]

    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
        <Header showBack title={meta.title} showSettings={false} />

        <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
          {/* Type header */}
          <div className="flex items-center gap-3 animate-fade-in-up">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-aura-text flex items-center gap-2">
                <span className="text-2xl">{meta.emoji}</span>
                {meta.title}
              </h2>
              <p className="text-sm text-aura-text-dim mt-0.5">{meta.description}</p>
            </div>
          </div>

          {/* Available exercises */}
          <div className="space-y-3 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide">
              Available Exercises ({filteredExercises.length})
            </h3>
            {filteredExercises.length === 0 ? (
              <Card variant="glass" padding="lg">
                <p className="text-center text-aura-text-dim">
                  No exercises available for this type yet.
                </p>
              </Card>
            ) : (
              filteredExercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  variant="gradient"
                  hoverable
                  padding="md"
                  className="group"
                  onClick={() => navigate(`/exercise/${exercise.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-aura-text group-hover:text-aura-purple transition-colors">
                        {exercise.title}
                      </h4>
                      <p className="text-sm text-aura-text-dim mt-0.5 line-clamp-2">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-aura-purple/20 text-aura-purple">
                          {exercise.level}
                        </span>
                        <span className="text-xs text-aura-text-dim/60">
                          {exercise.categoryPath.join(' / ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors mt-1 shrink-0 ml-3">
                      {'\u203A'}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default: show all exercise type cards
  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
      <Header showBack title="Practice" />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold mb-1">
            <GradientText>Choose Exercise Type</GradientText>
          </h2>
          <p className="text-sm text-aura-text-dim">
            Select an exercise type to get started
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
          {EXERCISE_TYPES.map((type) => {
            const meta = EXERCISE_TYPE_META[type]
            const count = SAMPLE_EXERCISES.filter((ex) => ex.type === type).length

            return (
              <Card
                key={type}
                variant="gradient"
                hoverable
                padding="lg"
                className="group"
                onClick={() => handleSelectType(type)}
              >
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-aura-purple/20 flex items-center justify-center text-2xl">
                    {meta.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-aura-text group-hover:text-aura-purple transition-colors">
                      {meta.title}
                    </h3>
                    <p className="text-sm text-aura-text-dim mt-1 line-clamp-2">
                      {meta.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-aura-text-dim/60">{meta.difficulty}</span>
                    <span className="text-xs text-aura-purple font-medium">
                      {count} exercise{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
