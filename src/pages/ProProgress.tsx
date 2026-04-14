import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import { useUserStore } from '../stores/userStore'
import {
  IMBALANCE_LABELS,
  PRO_EXERCISE_LABELS,
  PRO_EXERCISE_ICONS,
  type ImbalanceDimension,
  type ProExerciseType,
} from '../types/professional'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'

// Mock recent results for display
const MOCK_RECENT_RESULTS = [
  { id: '1', exerciseTitle: 'Caught Off Guard in a Meeting', type: 'register_downshift' as ProExerciseType, score: 72, completedAt: '2025-01-12T10:30:00Z' },
  { id: '2', exerciseTitle: 'Coffee Shop Chit-Chat', type: 'scene_simulation' as ProExerciseType, score: 81, completedAt: '2025-01-12T09:15:00Z' },
  { id: '3', exerciseTitle: 'Interview Curveballs', type: 'quick_react' as ProExerciseType, score: 58, completedAt: '2025-01-11T14:20:00Z' },
  { id: '4', exerciseTitle: 'Explain Your Job to Anyone', type: 'tone_switch' as ProExerciseType, score: 67, completedAt: '2025-01-11T11:00:00Z' },
  { id: '5', exerciseTitle: 'Loosen Up Your Slack Messages', type: 'writing_rewrite' as ProExerciseType, score: 85, completedAt: '2025-01-10T16:45:00Z' },
]

export default function ProProgress() {
  const navigate = useNavigate()
  const { profile, todayProgress } = useUserStore()

  const imbalance = profile?.imbalanceAssessment
  const primaryGaps = imbalance?.primaryGaps ?? []
  const streak = profile?.streak ?? 0
  const totalExercises = profile?.totalExercisesCompleted ?? 0

  const radarData = useMemo(() => {
    if (!imbalance?.profile) return []

    const dimensions = Object.keys(imbalance.profile) as ImbalanceDimension[]
    return dimensions.map((dim) => ({
      dimension: IMBALANCE_LABELS[dim],
      value: imbalance.profile[dim],
      fullMark: 100,
    }))
  }, [imbalance])

  // No assessment yet
  if (!imbalance) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
        <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
          <section className="animate-fade-in-up">
            <h1 className="text-2xl font-bold mb-2">
              <GradientText>Progress</GradientText>
            </h1>
          </section>

          <Card variant="gradient" padding="lg" className="animate-fade-in-up text-center">
            <div className="py-8">
              <span className="text-5xl mb-4 block">{'\uD83D\uDCCA'}</span>
              <h2 className="text-xl font-bold text-aura-text mb-2">
                Take the Imbalance Assessment
              </h2>
              <p className="text-aura-text-dim mb-6 max-w-md mx-auto">
                Complete the imbalance assessment to unlock your personalized radar chart
                and track your progress across all dimensions.
              </p>
              <Button variant="primary" onClick={() => navigate('/onboarding/imbalance')}>
                Start Assessment
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        {/* Header */}
        <section className="animate-fade-in-up">
          <h1 className="text-2xl font-bold mb-2">
            <GradientText>Progress</GradientText>
          </h1>
          <p className="text-aura-text-dim">
            Your language balance across all dimensions.
          </p>
        </section>

        {/* Imbalance Radar Chart */}
        <Card variant="glass" padding="lg" className="animate-fade-in-up">
          <h2 className="font-semibold text-aura-text mb-4">Imbalance Profile</h2>
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#2A2560" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="Proficiency"
                  dataKey="value"
                  stroke="#7B2FBE"
                  fill="rgba(123, 47, 190, 0.3)"
                  fillOpacity={1}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Streak + Stats Row */}
        <section className="grid grid-cols-3 gap-3 animate-fade-in-up">
          <Card variant="glass" padding="md" className="text-center">
            <span className="text-2xl mb-1 block">{'\uD83D\uDD25'}</span>
            <p className={`text-2xl font-bold ${streak > 0 ? 'text-aura-gold' : 'text-aura-text-dim'}`}>
              {streak}
            </p>
            <p className="text-xs text-aura-text-dim">day streak</p>
          </Card>
          <Card variant="glass" padding="md" className="text-center">
            <span className="text-2xl mb-1 block">{'\u2705'}</span>
            <p className="text-2xl font-bold text-aura-text">{totalExercises}</p>
            <p className="text-xs text-aura-text-dim">total exercises</p>
          </Card>
          <Card variant="glass" padding="md" className="text-center">
            <span className="text-2xl mb-1 block">{'\uD83C\uDFAF'}</span>
            <p className="text-2xl font-bold text-aura-text">
              {todayProgress?.averageScore ?? '-'}
            </p>
            <p className="text-xs text-aura-text-dim">avg. score</p>
          </Card>
        </section>

        {/* Gap Progress */}
        {primaryGaps.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-lg font-semibold mb-4">
              <GradientText>Gap Progress</GradientText>
            </h2>
            <div className="space-y-3">
              {primaryGaps.map((gap) => {
                const currentScore = imbalance.profile[gap]
                // Mock "where you started" as 15-25 points lower
                const startScore = Math.max(0, currentScore - 15 - Math.round(Math.random() * 10))

                return (
                  <Card key={gap} variant="default" padding="md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-aura-text text-sm">
                        {IMBALANCE_LABELS[gap]}
                      </p>
                      <p className="text-sm">
                        <span className="text-aura-text-dim">{startScore}</span>
                        <span className="text-aura-text-dim mx-1">{'\u2192'}</span>
                        <span className="text-aura-purple font-semibold">{currentScore}</span>
                      </p>
                    </div>
                    <div className="w-full h-2 bg-aura-midnight rounded-full overflow-hidden">
                      <div className="relative h-full">
                        {/* Start marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-aura-text-dim/30"
                          style={{ left: `${startScore}%` }}
                        />
                        {/* Current progress */}
                        <div
                          className="h-full bg-gradient-to-r from-aura-purple/60 to-aura-purple rounded-full transition-all duration-700"
                          style={{ width: `${currentScore}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent Scores */}
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-4">
            <GradientText>Recent Scores</GradientText>
          </h2>
          <div className="space-y-2">
            {MOCK_RECENT_RESULTS.map((result) => {
              const scoreColor =
                result.score >= 80
                  ? 'text-emerald-400'
                  : result.score >= 60
                    ? 'text-aura-gold'
                    : 'text-orange-400'

              return (
                <Card key={result.id} variant="default" padding="sm">
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">
                      {PRO_EXERCISE_ICONS[result.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-aura-text truncate">
                        {result.exerciseTitle}
                      </p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-aura-purple/20 text-aura-purple">
                        {PRO_EXERCISE_LABELS[result.type]}
                      </span>
                    </div>
                    <p className={`text-lg font-bold ${scoreColor} shrink-0`}>
                      {result.score}
                    </p>
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
