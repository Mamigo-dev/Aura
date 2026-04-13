import { useState, useEffect, useMemo } from 'react'
import { useUserStore } from '../stores/userStore'
import { getAllDailyProgress } from '../lib/db'
import { Card } from '../components/ui/Card'
import { GradientText } from '../components/ui/GradientText'
import { Header } from '../components/layout/Header'
import type { DailyProgress } from '../types/user'
import type { EnglishLevel } from '../types/user'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function getLast30Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function getHeatmapColor(count: number): string {
  if (count === 0) return 'bg-aura-surface'
  if (count <= 2) return 'bg-aura-purple/30'
  if (count <= 4) return 'bg-aura-purple/60'
  return 'bg-aura-purple'
}

export default function Progress() {
  const { profile } = useUserStore()
  const [progressData, setProgressData] = useState<DailyProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProgress() {
      try {
        const data = await getAllDailyProgress()
        setProgressData(data)
      } catch (err) {
        console.error('Failed to load progress:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProgress()
  }, [])

  const last30Days = useMemo(() => getLast30Days(), [])

  const progressMap = useMemo(() => {
    const map = new Map<string, DailyProgress>()
    progressData.forEach((p) => map.set(p.date, p))
    return map
  }, [progressData])

  // Chart data: average score over time
  const chartData = useMemo(() => {
    return progressData
      .filter((p) => p.averageScore > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({
        date: p.date.slice(5), // MM-DD
        score: p.averageScore,
      }))
  }, [progressData])

  // Exercise breakdown
  const exerciseBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    progressData.forEach((p) => {
      Object.entries(p.exerciseTypes).forEach(([type, count]) => {
        counts[type] = (counts[type] || 0) + count
      })
    })
    return counts
  }, [progressData])

  // Stats
  const stats = useMemo(() => {
    const totalExercises = profile?.totalExercisesCompleted ?? 0
    const totalDays = progressData.length
    const longestStreak = profile?.longestStreak ?? 0

    const allScores = progressData
      .filter((p) => p.averageScore > 0)
      .map((p) => p.averageScore)
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0

    return { totalExercises, totalDays, longestStreak, avgScore }
  }, [progressData, profile])

  const currentLevel = profile?.level ?? 'B1'
  const levelIndex = LEVELS.indexOf(currentLevel)

  const EXERCISE_TYPE_LABELS: Record<string, string> = {
    read_aloud: 'Read Aloud',
    reading_comprehension: 'Reading',
    recitation: 'Recitation',
    writing: 'Writing',
    speech_mode: 'Speech',
  }

  const EXERCISE_TYPE_COLORS: Record<string, string> = {
    read_aloud: 'bg-purple-500',
    reading_comprehension: 'bg-blue-500',
    recitation: 'bg-emerald-500',
    writing: 'bg-amber-500',
    speech_mode: 'bg-rose-500',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text">
        <Header showBack title="Progress" />
        <div className="max-w-3xl mx-auto px-4 pt-12 flex justify-center">
          <span className="w-8 h-8 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
      <Header showBack title="Progress" />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
          {[
            { label: 'Total Exercises', value: stats.totalExercises },
            { label: 'Active Days', value: stats.totalDays },
            { label: 'Longest Streak', value: `${stats.longestStreak}d` },
            { label: 'Avg. Score', value: `${stats.avgScore}%` },
          ].map((stat) => (
            <Card key={stat.label} variant="glass" padding="md" className="text-center">
              <p className="text-2xl font-bold text-aura-text">{stat.value}</p>
              <p className="text-xs text-aura-text-dim mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Streak Calendar */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-3">
            <GradientText>Streak Calendar</GradientText>
          </h3>
          <p className="text-xs text-aura-text-dim mb-3">Last 30 days</p>
          <div className="grid grid-cols-10 gap-1.5">
            {last30Days.map((day) => {
              const p = progressMap.get(day)
              const count = p?.exercisesCompleted ?? 0
              return (
                <div
                  key={day}
                  className={`w-full aspect-square rounded-sm ${getHeatmapColor(count)} transition-colors`}
                  title={`${day}: ${count} exercises`}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end text-xs text-aura-text-dim">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-aura-surface" />
            <div className="w-3 h-3 rounded-sm bg-aura-purple/30" />
            <div className="w-3 h-3 rounded-sm bg-aura-purple/60" />
            <div className="w-3 h-3 rounded-sm bg-aura-purple" />
            <span>More</span>
          </div>
        </Card>

        {/* Level Progress */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-4">
            <GradientText>Level Progress</GradientText>
          </h3>
          <div className="flex items-center gap-1">
            {LEVELS.map((level, idx) => (
              <div key={level} className="flex-1 flex flex-col items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    idx === levelIndex
                      ? 'text-aura-purple'
                      : idx < levelIndex
                        ? 'text-aura-text-dim'
                        : 'text-aura-text-dim/40'
                  }`}
                >
                  {level}
                </span>
                <div
                  className={`w-full h-2 rounded-full ${
                    idx < levelIndex
                      ? 'bg-aura-purple'
                      : idx === levelIndex
                        ? 'bg-aura-purple animate-pulse'
                        : 'bg-aura-surface'
                  }`}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Score History */}
        {chartData.length > 1 && (
          <Card variant="glass" padding="md" className="animate-fade-in-up">
            <h3 className="font-semibold mb-4">
              <GradientText>Score History</GradientText>
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(123, 47, 190, 0.3)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#7B2FBE"
                    strokeWidth={2}
                    dot={{ fill: '#7B2FBE', r: 3 }}
                    activeDot={{ r: 5, fill: '#7B2FBE' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Exercise Breakdown */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-4">
            <GradientText>Exercise Breakdown</GradientText>
          </h3>
          {Object.keys(exerciseBreakdown).length === 0 ? (
            <p className="text-sm text-aura-text-dim text-center py-4">
              Complete exercises to see your breakdown
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(exerciseBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const total = Object.values(exerciseBreakdown).reduce(
                    (a, b) => a + b,
                    0
                  )
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-aura-text">
                          {EXERCISE_TYPE_LABELS[type] ?? type}
                        </span>
                        <span className="text-aura-text-dim">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-aura-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${EXERCISE_TYPE_COLORS[type] ?? 'bg-aura-purple'} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
