import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { SAMPLE_EXERCISES } from '../data/sampleExercises'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { ProgressRing } from '../components/ui/ProgressRing'
import type { ExerciseType } from '../types/exercise'

const EXERCISE_TYPE_META: Record<
  ExerciseType,
  { emoji: string; label: string }
> = {
  read_aloud: { emoji: '\uD83C\uDFA4', label: 'Read Aloud' },
  reading_comprehension: { emoji: '\uD83D\uDCD6', label: 'Reading' },
  recitation: { emoji: '\uD83E\uDDE0', label: 'Recitation' },
  writing: { emoji: '\u270F\uFE0F', label: 'Writing' },
  speech_mode: { emoji: '\uD83D\uDCCA', label: 'Speech' },
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/20 text-emerald-400',
  A2: 'bg-emerald-500/20 text-emerald-400',
  B1: 'bg-aura-purple/20 text-aura-purple',
  B2: 'bg-aura-purple/20 text-aura-purple',
  C1: 'bg-aura-gold/20 text-aura-gold',
  C2: 'bg-aura-gold/20 text-aura-gold',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, todayProgress } = useUserStore()

  const exercisesCompleted = todayProgress?.exercisesCompleted ?? 0
  const exercisesGoal = todayProgress?.exercisesGoal ?? profile?.dailyGoal ?? 5
  const progressPercent = Math.min(
    Math.round((exercisesCompleted / exercisesGoal) * 100),
    100
  )
  const streak = profile?.streak ?? 0
  const level = profile?.level ?? 'B1'

  const exercises = useMemo(() => {
    const selected = profile?.selectedCategories
    const userLevel = profile?.level || 'B1'
    const weakAreas = profile?.assessment?.weakAreas || []

    let filtered = [...SAMPLE_EXERCISES]

    // Filter by selected categories if any
    if (selected && selected.length > 0) {
      const categoryMatched = filtered.filter((ex) =>
        ex.categoryPath.some((seg) => selected.includes(seg))
      )
      // If we have matches, use them; otherwise fall back to all
      if (categoryMatched.length > 0) filtered = categoryMatched
    }

    // Sort: prioritize exercises matching user level, then exercises targeting weak areas
    filtered.sort((a, b) => {
      // Level match priority
      const aLevelMatch = a.level === userLevel ? 1 : 0
      const bLevelMatch = b.level === userLevel ? 1 : 0

      // Weak area priority: daily_expressions -> daily category, public_speaking -> speech_mode etc.
      const weakAreaCategoryMap: Record<string, string[]> = {
        daily_expressions: ['daily'],
        public_speaking: ['academic-speaking', 'speech_mode'],
        writing: ['writing'],
        grammar: ['reading_comprehension'],
        idioms: ['daily'],
      }
      const aWeakMatch = weakAreas.some((wa) =>
        weakAreaCategoryMap[wa]?.some((cat) =>
          a.categoryPath.includes(cat) || a.type === cat
        )
      ) ? 1 : 0
      const bWeakMatch = weakAreas.some((wa) =>
        weakAreaCategoryMap[wa]?.some((cat) =>
          b.categoryPath.includes(cat) || b.type === cat
        )
      ) ? 1 : 0

      // Higher priority first
      const aScore = aLevelMatch * 2 + aWeakMatch
      const bScore = bLevelMatch * 2 + bWeakMatch
      return bScore - aScore
    })

    return filtered
  }, [profile?.selectedCategories, profile?.level, profile?.assessment?.weakAreas])

  const exerciseTypes: ExerciseType[] = [
    'read_aloud',
    'reading_comprehension',
    'recitation',
    'writing',
    'speech_mode',
  ]

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        {/* Greeting Section */}
        <section className="animate-fade-in-up">
          <p className="text-aura-text-dim text-sm">{formatDate()}</p>
          <h1 className="text-3xl font-bold mt-1">
            {getGreeting()},{' '}
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full align-middle ml-1 ${LEVEL_COLORS[level] ?? 'bg-aura-purple/20 text-aura-purple'}`}
            >
              {level}
            </span>
          </h1>
        </section>

        {/* Progress + Streak Row */}
        <section className="flex items-center gap-6 animate-fade-in-up">
          {/* Daily Progress Ring */}
          <Card variant="glass" padding="md" className="flex-1 flex items-center gap-5">
            <ProgressRing progress={progressPercent} size={96} strokeWidth={7}>
              <div className="text-center">
                <span className="text-2xl font-bold text-aura-text">
                  {exercisesCompleted}
                </span>
                <span className="text-aura-text-dim text-lg">/{exercisesGoal}</span>
              </div>
            </ProgressRing>
            <div>
              <p className="font-semibold text-aura-text">Daily Progress</p>
              <p className="text-sm text-aura-text-dim mt-0.5">
                {exercisesCompleted >= exercisesGoal
                  ? 'Goal reached! Great work.'
                  : `${exercisesGoal - exercisesCompleted} exercises to go`}
              </p>
              {todayProgress?.averageScore != null && todayProgress.averageScore > 0 && (
                <p className="text-xs text-aura-text-dim mt-1">
                  Avg. score:{' '}
                  <span className="text-aura-gold font-medium">
                    {todayProgress.averageScore}%
                  </span>
                </p>
              )}
            </div>
          </Card>

          {/* Streak Counter */}
          <Card variant="glass" padding="md" className="flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-3xl mb-1">{'\uD83D\uDD25'}</span>
            <span
              className={`text-3xl font-bold ${streak > 0 ? 'animate-celebrate text-aura-gold' : 'text-aura-text-dim'}`}
            >
              {streak}
            </span>
            <span className="text-xs text-aura-text-dim mt-0.5">day streak</span>
          </Card>
        </section>

        {/* Focus Areas (from assessment) */}
        {profile?.assessment?.weakAreas && profile.assessment.weakAreas.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide mb-2">
              Focus Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.assessment.weakAreas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 rounded-lg bg-aura-purple/10 text-aura-purple text-xs font-medium border border-aura-purple/20"
                >
                  {area.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Quick Start Buttons */}
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-3">
            <GradientText>Quick Start</GradientText>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {exerciseTypes.map((type) => {
              const meta = EXERCISE_TYPE_META[type]
              return (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => navigate(`/practice?type=${type}`)}
                >
                  <span className="mr-1.5">{meta.emoji}</span>
                  {meta.label}
                </Button>
              )
            })}
          </div>
        </section>

        {/* Today's Exercises */}
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-4">
            <GradientText>Today's Exercises</GradientText>
          </h2>
          <div className="space-y-3">
            {exercises.map((exercise) => {
              const meta = EXERCISE_TYPE_META[exercise.type]
              return (
                <Card
                  key={exercise.id}
                  variant="glass"
                  hoverable
                  padding="md"
                  className="group"
                  onClick={() => navigate(`/exercise/${exercise.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-aura-purple/20 flex items-center justify-center text-xl shrink-0">
                      {meta.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-aura-text group-hover:text-aura-purple transition-colors truncate">
                          {exercise.title}
                        </h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${LEVEL_COLORS[exercise.level] ?? 'bg-aura-purple/20 text-aura-purple'}`}
                        >
                          {exercise.level}
                        </span>
                      </div>
                      <p className="text-sm text-aura-text-dim line-clamp-1">
                        {exercise.description}
                      </p>
                      <p className="text-xs text-aura-text-dim/60 mt-1">
                        {exercise.categoryPath.join(' / ')}
                      </p>
                    </div>

                    {/* Arrow */}
                    <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors mt-1 shrink-0">
                      {'\u203A'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
