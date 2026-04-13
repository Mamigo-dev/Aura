import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { GradientText } from '../components/ui/GradientText'
import { ASSESSMENT_QUESTIONS, type AssessmentQuestion } from '../data/assessmentQuestions'
import { CATEGORIES } from '../data/categories'
import { useUserStore } from '../stores/userStore'
import type { LevelAssessment, EnglishLevel, WeakArea } from '../types/user'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OnboardingStep = 'welcome' | 'assessment' | 'results' | 'categories'

// ---------------------------------------------------------------------------
// Helpers – client-side scoring
// ---------------------------------------------------------------------------

const CATEGORY_TO_SCORE_KEY: Record<AssessmentQuestion['category'], keyof LevelAssessment['scores']> = {
  technical_vocab: 'technicalVocab',
  daily_expressions: 'dailyExpressions',
  grammar: 'grammar',
  idioms: 'idioms',
  comprehension: 'comprehension',
}

const CATEGORY_TO_WEAK_AREA: Record<AssessmentQuestion['category'], WeakArea> = {
  technical_vocab: 'vocabulary',
  daily_expressions: 'daily_expressions',
  grammar: 'grammar',
  idioms: 'idioms',
  comprehension: 'listening',
}

function scoreAssessment(answers: Record<string, number>): LevelAssessment {
  // Count correct per category
  const categoryCorrect: Record<string, number> = {}
  const categoryTotal: Record<string, number> = {}

  for (const q of ASSESSMENT_QUESTIONS) {
    const cat = q.category
    categoryTotal[cat] = (categoryTotal[cat] || 0) + 1
    if (answers[q.id] === q.correctIndex) {
      categoryCorrect[cat] = (categoryCorrect[cat] || 0) + 1
    }
  }

  // Build scores object (0-100 per category)
  const scores: LevelAssessment['scores'] = {
    vocabulary: 0,
    grammar: 0,
    comprehension: 0,
    dailyExpressions: 0,
    technicalVocab: 0,
    idioms: 0,
  }

  for (const [cat, total] of Object.entries(categoryTotal)) {
    const correct = categoryCorrect[cat] || 0
    const pct = Math.round((correct / total) * 100)
    const key = CATEGORY_TO_SCORE_KEY[cat as AssessmentQuestion['category']]
    if (key) scores[key] = pct
  }

  // Vocabulary is the average of technical + daily
  scores.vocabulary = Math.round((scores.technicalVocab + scores.dailyExpressions) / 2)

  // Overall percentage
  const totalCorrect = Object.values(categoryCorrect).reduce((a, b) => a + b, 0)
  const totalQuestions = ASSESSMENT_QUESTIONS.length
  const overallPct = (totalCorrect / totalQuestions) * 100

  // Map to CEFR
  let assignedLevel: EnglishLevel = 'C2'
  if (overallPct < 30) assignedLevel = 'A1'
  else if (overallPct < 45) assignedLevel = 'A2'
  else if (overallPct < 60) assignedLevel = 'B1'
  else if (overallPct < 75) assignedLevel = 'B2'
  else if (overallPct < 90) assignedLevel = 'C1'

  // Weak areas – categories below 60%
  const weakAreas: WeakArea[] = []
  for (const [cat, total] of Object.entries(categoryTotal)) {
    const correct = categoryCorrect[cat] || 0
    if ((correct / total) * 100 < 60) {
      weakAreas.push(CATEGORY_TO_WEAK_AREA[cat as AssessmentQuestion['category']])
    }
  }

  // Recommendations based on weak areas
  const recommendationMap: Record<WeakArea, string> = {
    daily_expressions: 'Practice everyday conversational phrases and social interactions.',
    grammar: 'Focus on English grammar structures, especially conditionals and articles.',
    idioms: 'Learn common English idioms and figurative expressions.',
    vocabulary: 'Expand your general and technical vocabulary.',
    listening: 'Improve reading comprehension with longer passages.',
    pronunciation: 'Work on pronunciation and intonation patterns.',
    public_speaking: 'Practice structured speaking and presentation skills.',
    writing: 'Develop written communication skills.',
  }
  const recommendations = weakAreas.map((w) => recommendationMap[w])

  return {
    completedAt: new Date().toISOString(),
    scores,
    assignedLevel,
    weakAreas,
    recommendations,
  }
}

// ---------------------------------------------------------------------------
// Welcome Slides
// ---------------------------------------------------------------------------

const WELCOME_SLIDES = [
  {
    title: 'Welcome to',
    highlight: 'Aura',
    tagline: 'Elevate Your English',
    description: 'Your personal AI-powered English learning companion, designed to help you master the language naturally.',
    showLogo: true,
  },
  {
    title: 'AI-Powered',
    highlight: 'Practice',
    tagline: 'Daily Exercises Tailored to You',
    description: 'Intelligent exercises adapt to your level and interests. Practice speaking, reading, writing, and listening with content that matters to you.',
    icon: '\u2728',
  },
  {
    title: 'Track Your',
    highlight: 'Growth',
    tagline: 'See Your Progress in Real-Time',
    description: 'Monitor your improvement across all skill areas. Set daily goals, maintain streaks, and celebrate milestones on your language journey.',
    icon: '\uD83D\uDCC8',
  },
]

function WelcomeSlides({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [slide, setSlide] = useState(0)
  const current = WELCOME_SLIDES[slide]

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      {/* Slide content */}
      <div key={slide} className="animate-fade-in-up flex flex-col items-center max-w-lg">
        {current.showLogo ? (
          <img
            src="/Aura/Aura_logo.png"
            alt="Aura logo"
            className="w-28 h-28 mb-8 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
          />
        ) : (
          <span className="text-6xl mb-8">{current.icon}</span>
        )}

        <h1 className="text-4xl sm:text-5xl font-bold text-aura-text mb-2">
          {current.title}{' '}
          <GradientText className="text-4xl sm:text-5xl font-bold">{current.highlight}</GradientText>
        </h1>

        <p className="text-lg text-aura-purple font-medium mt-2 mb-4">{current.tagline}</p>

        <p className="text-aura-text-dim leading-relaxed max-w-md">{current.description}</p>
      </div>

      {/* Dots indicator */}
      <div className="flex gap-2 mt-12 mb-8">
        {WELCOME_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === slide ? 'w-8 bg-aura-purple' : 'w-2 bg-aura-border'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        {slide < WELCOME_SLIDES.length - 1 ? (
          <>
            <Button variant="ghost" onClick={onComplete}>
              Skip
            </Button>
            <Button variant="primary" size="lg" onClick={() => setSlide(slide + 1)}>
              Next
            </Button>
          </>
        ) : (
          <Button variant="gold" size="lg" onClick={onComplete}>
            Get Started
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Level Assessment
// ---------------------------------------------------------------------------

function LevelAssessmentStep({
  onComplete,
}: {
  onComplete: (assessment: LevelAssessment) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const question = ASSESSMENT_QUESTIONS[currentIndex]
  const progress = ((currentIndex) / ASSESSMENT_QUESTIONS.length) * 100

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (isTransitioning) return
      setSelectedOption(optionIndex)
      setIsTransitioning(true)

      const newAnswers = { ...answers, [question.id]: optionIndex }
      setAnswers(newAnswers)

      setTimeout(() => {
        if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setSelectedOption(null)
          setIsTransitioning(false)
        } else {
          const assessment = scoreAssessment(newAnswers)
          onComplete(assessment)
        }
      }, 600)
    },
    [answers, currentIndex, isTransitioning, question.id, onComplete],
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="w-full mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-aura-text">Level Assessment</h2>
          <span className="text-sm text-aura-text-dim">
            {currentIndex + 1} / {ASSESSMENT_QUESTIONS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-aura-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-aura-purple rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div key={question.id} className="w-full animate-fade-in-up">
        <Card variant="gradient" padding="lg" className="mb-6">
          <p className="text-lg font-medium text-aura-text leading-relaxed">{question.question}</p>
          <span className="inline-block mt-3 text-xs font-medium text-aura-text-dim uppercase tracking-wider px-2 py-1 rounded-md bg-aura-surface">
            {question.category.replace('_', ' ')}
          </span>
        </Card>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx
            const isCorrect = isSelected && idx === question.correctIndex
            const isWrong = isSelected && idx !== question.correctIndex

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isTransitioning}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${
                  isCorrect
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : isWrong
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-aura-border bg-aura-surface hover:border-aura-purple/50 hover:bg-aura-surface text-aura-text'
                } ${isTransitioning && !isSelected ? 'opacity-50' : ''}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      isSelected
                        ? isCorrect
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                        : 'bg-aura-midnight text-aura-text-dim'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assessment Results
// ---------------------------------------------------------------------------

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: 'Beginner - You can understand basic phrases and introduce yourself.',
  A2: 'Elementary - You can handle routine tasks and describe your background.',
  B1: 'Intermediate - You can deal with most travel situations and describe experiences.',
  B2: 'Upper Intermediate - You can interact fluently and produce detailed text.',
  C1: 'Advanced - You can express ideas flexibly and effectively for professional use.',
  C2: 'Proficiency - You can understand virtually everything and express yourself spontaneously.',
}

const SCORE_LABELS: Record<keyof LevelAssessment['scores'], string> = {
  technicalVocab: 'Technical Vocabulary',
  dailyExpressions: 'Daily Expressions',
  grammar: 'Grammar',
  idioms: 'Idioms & Phrases',
  comprehension: 'Comprehension',
  vocabulary: 'Overall Vocabulary',
}

const WEAK_AREA_LABELS: Record<WeakArea, string> = {
  daily_expressions: 'Daily Expressions',
  grammar: 'Grammar',
  idioms: 'Idioms & Phrases',
  vocabulary: 'Vocabulary',
  listening: 'Comprehension',
  pronunciation: 'Pronunciation',
  public_speaking: 'Public Speaking',
  writing: 'Writing',
}

function AssessmentResults({
  assessment,
  onContinue,
}: {
  assessment: LevelAssessment
  onContinue: () => void
}) {
  const scoreEntries = Object.entries(assessment.scores) as [keyof LevelAssessment['scores'], number][]

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full py-12">
      {/* Level Badge */}
      <div className="animate-fade-in-up flex flex-col items-center mb-10">
        <div className="w-28 h-28 rounded-full gradient-aurora flex items-center justify-center mb-4 shadow-lg shadow-aura-purple/30">
          <span className="text-5xl font-bold text-white">{assessment.assignedLevel}</span>
        </div>
        <h2 className="text-2xl font-bold text-aura-text mb-1">Your Level</h2>
        <p className="text-aura-text-dim text-center max-w-sm">
          {LEVEL_DESCRIPTIONS[assessment.assignedLevel] || ''}
        </p>
      </div>

      {/* Score Breakdown */}
      <Card variant="glass" padding="lg" className="w-full mb-6 animate-fade-in-up">
        <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide mb-4">
          Score Breakdown
        </h3>
        <div className="space-y-4">
          {scoreEntries.map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-aura-text">{SCORE_LABELS[key]}</span>
                <span className={`text-sm font-semibold ${
                  value >= 80 ? 'text-aura-success' : value >= 50 ? 'text-aura-gold' : 'text-aura-error'
                }`}>
                  {value}%
                </span>
              </div>
              <div className="h-2 bg-aura-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    value >= 80 ? 'bg-aura-success' : value >= 50 ? 'bg-aura-gold' : 'bg-aura-error'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weak Areas */}
      {assessment.weakAreas.length > 0 && (
        <Card variant="glass" padding="lg" className="w-full mb-6 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide mb-3">
            Areas to Improve
          </h3>
          <div className="flex flex-wrap gap-2">
            {assessment.weakAreas.map((area) => (
              <span
                key={area}
                className="px-3 py-1.5 rounded-lg bg-aura-error/10 text-aura-error text-sm font-medium border border-aura-error/20"
              >
                {WEAK_AREA_LABELS[area] || area}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {assessment.recommendations.length > 0 && (
        <Card variant="glass" padding="lg" className="w-full mb-8 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide mb-3">
            Recommendations
          </h3>
          <ul className="space-y-2">
            {assessment.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-aura-text">
                <span className="text-aura-gold mt-0.5">&#9679;</span>
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button variant="gold" size="lg" onClick={onContinue}>
        Choose Your Interests
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category Selection
// ---------------------------------------------------------------------------

function CategorySelection({
  onComplete,
}: {
  onComplete: (categoryIds: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const topLevelCategories = CATEGORIES.filter((c) => !c.id.includes('-')).slice(0, 6)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 max-w-3xl mx-auto w-full">
      <div className="text-center mb-10 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-aura-text mb-2">
          Choose Your <GradientText className="text-3xl font-bold">Interests</GradientText>
        </h2>
        <p className="text-aura-text-dim">
          Select at least 2 categories to personalize your learning experience.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full mb-10">
        {topLevelCategories.map((cat, i) => {
          const isSelected = selected.has(cat.id)
          return (
            <Card
              key={cat.id}
              variant={isSelected ? 'gradient' : 'default'}
              padding="lg"
              hoverable
              onClick={() => toggle(cat.id)}
              className={`animate-fade-in-up text-center relative overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-aura-purple shadow-lg shadow-aura-purple/20'
                  : ''
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-aura-purple flex items-center justify-center text-white text-xs">
                  &#10003;
                </span>
              )}
              <span className="text-4xl block mb-3">{cat.icon}</span>
              <h3 className="font-semibold text-aura-text text-sm leading-tight">{cat.label}</h3>
              <p className="text-xs text-aura-text-dim mt-1 line-clamp-2">{cat.description}</p>
            </Card>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-aura-text-dim">
          {selected.size} of 2 minimum selected
        </p>
        <Button
          variant="gold"
          size="lg"
          disabled={selected.size < 2}
          onClick={() => onComplete(Array.from(selected))}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [assessment, setAssessment] = useState<LevelAssessment | null>(null)

  const navigate = useNavigate()
  const { createProfile, setLevel, setSelectedCategories } = useUserStore()

  const handleAssessmentComplete = useCallback(
    (result: LevelAssessment) => {
      setAssessment(result)
      setStep('results')
    },
    [],
  )

  const handleCategoriesComplete = useCallback(
    async (categoryIds: string[]) => {
      // Create profile first
      await createProfile()

      // Save assessment
      if (assessment) {
        await setLevel(assessment)
      }

      // Save selected categories
      await setSelectedCategories(categoryIds)

      // Navigate to home
      navigate('/')
    },
    [assessment, createProfile, setLevel, setSelectedCategories, navigate],
  )

  // Step indicator
  const steps: { key: OnboardingStep; label: string }[] = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'results', label: 'Results' },
    { key: 'categories', label: 'Interests' },
  ]
  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-aura-purple/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-aura-purple/5 blur-[120px]" />
      </div>

      {/* Top step indicator */}
      {step !== 'welcome' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-aura-midnight/80 backdrop-blur-md border-b border-aura-border/50">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      i < currentStepIndex
                        ? 'bg-aura-purple text-white'
                        : i === currentStepIndex
                          ? 'bg-aura-purple/20 text-aura-purple border border-aura-purple'
                          : 'bg-aura-surface text-aura-text-dim'
                    }`}
                  >
                    {i < currentStepIndex ? '\u2713' : i + 1}
                  </span>
                  <span
                    className={`text-sm hidden sm:inline ${
                      i === currentStepIndex ? 'text-aura-text' : 'text-aura-text-dim'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={step !== 'welcome' ? 'pt-16' : ''}>
        {step === 'welcome' && (
          <WelcomeSlides onComplete={() => setStep('assessment')} />
        )}

        {step === 'assessment' && (
          <LevelAssessmentStep onComplete={handleAssessmentComplete} />
        )}

        {step === 'results' && assessment && (
          <AssessmentResults
            assessment={assessment}
            onContinue={() => setStep('categories')}
          />
        )}

        {step === 'categories' && (
          <CategorySelection onComplete={handleCategoriesComplete} />
        )}
      </div>
    </div>
  )
}
