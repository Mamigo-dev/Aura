import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { PRO_SAMPLE_EXERCISES } from '../data/proSampleExercises'
import {
  ANXIETY_TIER_META,
  IMBALANCE_LABELS,
  PRO_EXERCISE_LABELS,
  PRO_EXERCISE_ICONS,
  type AnxietyTier,
  type ImbalanceDimension,
} from '../types/professional'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { ProgressRing } from '../components/ui/ProgressRing'

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

const GAP_COLORS: Record<string, string> = {
  casualConversation: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  socialSmallTalk: 'bg-pink-500/20 text-pink-400 border-pink-500/20',
  impromptuSpeaking: 'bg-red-500/20 text-red-400 border-red-500/20',
  humorSarcasm: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  registerFlexibility: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
  culturalReferences: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  technicalWriting: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  academicReading: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
}

const TIER_ORDER: AnxietyTier[] = ['freeze', 'avoiding', 'robotic', 'daily_life', 'confident_speaking']

export default function ProHome() {
  const navigate = useNavigate()
  const { profile, todayProgress } = useUserStore()

  const exercisesCompleted = todayProgress?.exercisesCompleted ?? 0
  const exercisesGoal = todayProgress?.exercisesGoal ?? profile?.dailyGoal ?? 5
  const progressPercent = Math.min(
    Math.round((exercisesCompleted / exercisesGoal) * 100),
    100
  )
  const streak = profile?.streak ?? 0
  const primaryGaps = profile?.imbalanceAssessment?.primaryGaps ?? []
  const selectedScenes = profile?.selectedScenes ?? []

  const exercises = useMemo(() => {
    let filtered = [...PRO_SAMPLE_EXERCISES]

    // Prioritize exercises matching selected scenes and gaps
    filtered.sort((a, b) => {
      const aSceneMatch = selectedScenes.includes(a.sceneId) ? 2 : 0
      const bSceneMatch = selectedScenes.includes(b.sceneId) ? 2 : 0

      // Map gaps to anxiety tiers (casual gaps -> higher anxiety tiers)
      const gapTierBoost = (tier: AnxietyTier) => {
        if (primaryGaps.includes('casualConversation' as ImbalanceDimension) && (tier === 'freeze' || tier === 'avoiding')) return 1
        if (primaryGaps.includes('socialSmallTalk' as ImbalanceDimension) && (tier === 'daily_life')) return 1
        return 0
      }

      const aScore = aSceneMatch + gapTierBoost(a.anxietyTier)
      const bScore = bSceneMatch + gapTierBoost(b.anxietyTier)
      return bScore - aScore
    })

    return filtered
  }, [selectedScenes, primaryGaps])

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        {/* Greeting + Gap Indicators */}
        <section className="animate-fade-in-up">
          <p className="text-aura-text-dim text-sm">{formatDate()}</p>
          <h1 className="text-3xl font-bold mt-1">{getGreeting()}</h1>

          {primaryGaps.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {primaryGaps.map((gap) => (
                <span
                  key={gap}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    GAP_COLORS[gap] ?? 'bg-aura-purple/10 text-aura-purple border-aura-purple/20'
                  }`}
                >
                  {IMBALANCE_LABELS[gap]}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Progress + Streak Row */}
        <section className="flex items-center gap-6 animate-fade-in-up">
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

          <Card variant="glass" padding="md" className="flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-3xl mb-1">{'\uD83D\uDD25'}</span>
            <span
              className={`text-3xl font-bold ${streak > 0 ? 'text-aura-gold' : 'text-aura-text-dim'}`}
            >
              {streak}
            </span>
            <span className="text-xs text-aura-text-dim mt-0.5">day streak</span>
          </Card>
        </section>

        {/* Recommended Exercises */}
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-4">
            <GradientText>Recommended Exercises</GradientText>
          </h2>
          <div className="space-y-3">
            {exercises.map((exercise) => {
              const tierMeta = ANXIETY_TIER_META[exercise.anxietyTier]
              return (
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
                      <p className="text-sm text-aura-text-dim line-clamp-1">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-aura-text-dim/60">
                          {tierMeta.icon} {tierMeta.label}
                        </span>
                      </div>
                    </div>

                    <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors mt-1 shrink-0">
                      {'\u203A'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Anxiety Tier Quick Access */}
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-3">
            <GradientText>Practice by Anxiety Level</GradientText>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {TIER_ORDER.map((tierId) => {
              const tier = ANXIETY_TIER_META[tierId]
              return (
                <Button
                  key={tierId}
                  variant="secondary"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => navigate(`/pro/practice?tier=${tierId}`)}
                >
                  <span className="mr-1.5 text-lg">{tier.icon}</span>
                  {tier.label}
                </Button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
