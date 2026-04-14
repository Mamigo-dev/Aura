import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PRO_SAMPLE_EXERCISES } from '../data/proSampleExercises'
import { PRO_EXERCISE_LABELS, PRO_EXERCISE_ICONS } from '../types/professional'
import type { MultiRegisterAura, NaturalnessScore, ProExerciseResult } from '../types/professional'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { YourAuraPro } from '../components/aura/YourAuraPro'
import { RegisterDownshift } from '../components/exercises/RegisterDownshift'
import { SceneSimulation } from '../components/exercises/SceneSimulation'
import { QuickReact } from '../components/exercises/QuickReact'
import { ToneSwitch } from '../components/exercises/ToneSwitch'
import { SocialSurvival } from '../components/exercises/SocialSurvival'
import { WritingRewrite } from '../components/exercises/WritingRewrite'

// Mock aura data for post-exercise display
const MOCK_AURA: MultiRegisterAura = {
  professional: {
    content:
      'I appreciate the team bringing this up. Based on what I have seen so far, I think we might want to revisit a few things before moving forward.',
    highlights: ['I appreciate', 'Based on what I have seen', 'revisit a few things'],
  },
  casual: {
    content:
      'Yeah, honestly I think there are a couple things we should probably look at again before we go ahead with this.',
    highlights: ['honestly', 'a couple things', 'go ahead with this'],
  },
  superInformal: {
    content:
      'Ngl, some of this feels off to me. Can we take another look before we ship it?',
    highlights: ['Ngl', 'feels off', 'take another look'],
  },
  explanation:
    'Notice how the core message stays the same but the delivery shifts: hedging language in professional, direct opinions in casual, and abbreviations plus gut-feel language in informal.',
}

interface ExerciseResult {
  score: number
  scores: NaturalnessScore
}

export default function ProExercise() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<ExerciseResult | null>(null)

  const exercise = PRO_SAMPLE_EXERCISES.find((ex) => ex.id === id)

  if (!exercise) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text flex items-center justify-center">
        <Card variant="glass" padding="lg" className="text-center max-w-md">
          <p className="text-aura-text-dim mb-4">Exercise not found.</p>
          <Button variant="primary" onClick={() => navigate('/pro/practice')}>
            Back to Practice
          </Button>
        </Card>
      </div>
    )
  }

  const handleComplete = (proResult: ProExerciseResult) => {
    setResult({
      score: proResult.score,
      scores: proResult.scores,
    })
  }

  const renderExerciseComponent = () => {
    const commonProps = {
      exercise,
      onComplete: handleComplete,
    }

    switch (exercise.type) {
      case 'register_downshift':
        return <RegisterDownshift {...commonProps} />
      case 'scene_simulation':
        return <SceneSimulation {...commonProps} />
      case 'quick_react':
        return <QuickReact {...commonProps} />
      case 'tone_switch':
        return <ToneSwitch {...commonProps} />
      case 'social_survival':
        return <SocialSurvival {...commonProps} />
      case 'writing_rewrite':
        return <WritingRewrite {...commonProps} />
      default:
        return (
          <Card variant="glass" padding="lg">
            <p className="text-aura-text-dim">
              This exercise type is not yet implemented.
            </p>
          </Card>
        )
    }
  }

  // Post-exercise result screen
  if (result) {
    const scoreColor =
      result.score >= 80
        ? 'text-emerald-400'
        : result.score >= 60
          ? 'text-aura-gold'
          : 'text-orange-400'

    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
        <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
          {/* Header */}
          <section className="animate-fade-in-up">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pro/practice')}
              className="mb-3 -ml-2"
            >
              {'\u2190'} Back to Practice
            </Button>
            <h1 className="text-2xl font-bold">
              <GradientText>Exercise Complete</GradientText>
            </h1>
          </section>

          {/* Score Card */}
          <Card variant="gradient" padding="lg" className="animate-fade-in-up">
            <div className="text-center">
              <p className="text-aura-text-dim text-sm mb-2">Naturalness Score</p>
              <p className={`text-6xl font-bold ${scoreColor}`}>{result.score}</p>
              <p className="text-aura-text-dim text-sm mt-2">
                {result.score >= exercise.passingScore ? 'Passed!' : 'Keep practicing'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {Object.entries(result.scores).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="text-xs text-aura-text-dim capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-lg font-semibold text-aura-text">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Aura display */}
          <section className="animate-fade-in-up">
            <YourAuraPro aura={MOCK_AURA} />
          </section>

          {/* Actions */}
          <section className="flex gap-3 animate-fade-in-up">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setResult(null)}
            >
              Try Again
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => navigate('/pro/practice')}
            >
              Next Exercise
            </Button>
          </section>
        </div>
      </div>
    )
  }

  // Exercise in progress
  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <section className="animate-fade-in-up">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-3 -ml-2"
          >
            {'\u2190'} Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{PRO_EXERCISE_ICONS[exercise.type]}</span>
            <div>
              <h1 className="text-xl font-bold text-aura-text">{exercise.title}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-aura-purple/20 text-aura-purple">
                {PRO_EXERCISE_LABELS[exercise.type]}
              </span>
            </div>
          </div>
        </section>

        {/* Exercise Component */}
        <section className="animate-fade-in-up">{renderExerciseComponent()}</section>
      </div>
    </div>
  )
}
