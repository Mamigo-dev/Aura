import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PRO_SAMPLE_EXERCISES } from '../data/proSampleExercises'
import {
  ANXIETY_TIER_META,
  PRO_EXERCISE_LABELS,
  PRO_EXERCISE_ICONS,
  type AnxietyTier,
} from '../types/professional'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'

const TIER_ORDER: AnxietyTier[] = ['freeze', 'avoiding', 'robotic', 'daily_life', 'confident_speaking']

export default function ProPractice() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTier = searchParams.get('tier') as AnxietyTier | null

  const filteredExercises = useMemo(() => {
    if (!selectedTier) return []
    return PRO_SAMPLE_EXERCISES.filter((ex) => ex.anxietyTier === selectedTier)
  }, [selectedTier])

  const exerciseCountByTier = useMemo(() => {
    const counts: Partial<Record<AnxietyTier, number>> = {}
    for (const ex of PRO_SAMPLE_EXERCISES) {
      counts[ex.anxietyTier] = (counts[ex.anxietyTier] ?? 0) + 1
    }
    return counts
  }, [])

  const clearTier = () => {
    setSearchParams({})
  }

  // No tier selected: show tier cards
  if (!selectedTier) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
        <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
          <section className="animate-fade-in-up">
            <h1 className="text-2xl font-bold mb-2">
              <GradientText>Practice</GradientText>
            </h1>
            <p className="text-aura-text-dim">
              Choose an anxiety level to find exercises that match your comfort zone.
            </p>
          </section>

          <section className="space-y-4 animate-fade-in-up">
            {TIER_ORDER.map((tierId) => {
              const tier = ANXIETY_TIER_META[tierId]
              const count = exerciseCountByTier[tierId] ?? 0
              return (
                <Card
                  key={tierId}
                  variant="glass"
                  hoverable
                  padding="lg"
                  className="group"
                  onClick={() => setSearchParams({ tier: tierId })}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-aura-purple/20 flex items-center justify-center text-3xl shrink-0">
                      {tier.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-aura-text group-hover:text-aura-purple transition-colors">
                        {tier.label}
                      </h3>
                      <p className="text-sm text-aura-text-dim mt-0.5">
                        {tier.description}
                      </p>
                      <p className="text-xs text-aura-text-dim/60 mt-1">
                        {count} exercise{count !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors text-xl shrink-0">
                      {'\u203A'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </section>
        </div>
      </div>
    )
  }

  // Tier selected: show filtered exercises
  const tierMeta = ANXIETY_TIER_META[selectedTier]

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        {/* Header with back */}
        <section className="animate-fade-in-up">
          <Button variant="ghost" size="sm" onClick={clearTier} className="mb-3 -ml-2">
            {'\u2190'} All Tiers
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tierMeta.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">
                <GradientText>{tierMeta.label}</GradientText>
              </h1>
              <p className="text-sm text-aura-text-dim">{tierMeta.description}</p>
            </div>
          </div>
        </section>

        {/* Exercises */}
        <section className="space-y-3 animate-fade-in-up">
          {filteredExercises.length === 0 ? (
            <Card variant="glass" padding="lg">
              <p className="text-aura-text-dim text-center">
                No exercises available for this tier yet.
              </p>
            </Card>
          ) : (
            filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                variant="glass"
                hoverable
                padding="md"
                className="group"
                onClick={() => navigate(`/pro/exercise/${exercise.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-aura-purple/20 flex items-center justify-center text-xl shrink-0">
                    {PRO_EXERCISE_ICONS[exercise.type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-aura-text group-hover:text-aura-purple transition-colors truncate">
                        {exercise.title}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-aura-purple/20 text-aura-purple">
                        {PRO_EXERCISE_LABELS[exercise.type]}
                      </span>
                    </div>
                    <p className="text-sm text-aura-text-dim line-clamp-2">
                      {exercise.description}
                    </p>
                  </div>

                  <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors mt-1 shrink-0">
                    {'\u203A'}
                  </span>
                </div>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
