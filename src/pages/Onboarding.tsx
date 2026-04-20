import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { GradientText } from '../components/ui/GradientText'
import { ASSESSMENT_QUESTIONS, type AssessmentQuestion } from '../data/assessmentQuestions'
import { PRO_ASSESSMENT_QUESTIONS } from '../data/proAssessmentQuestions'
import { CATEGORIES } from '../data/categories'
import { PRO_CATEGORIES } from '../data/proCategories'
import { useUserStore } from '../stores/userStore'
import type { LevelAssessment, EnglishLevel, WeakArea, UserMode } from '../types/user'
import {
  type ImbalanceProfile,
  type ImbalanceAssessment,
  type ImbalanceDimension,
  IMBALANCE_LABELS,
  createDefaultImbalanceProfile,
} from '../types/professional'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OnboardingStep = 'welcome' | 'mode_select' | 'assessment' | 'results' | 'categories'

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
// Self-Assessment Pickers (Skip the test, just pick your level)
// ---------------------------------------------------------------------------

const LEVEL_OPTIONS: { level: EnglishLevel; title: string; description: string; emoji: string }[] = [
  {
    level: 'A1',
    emoji: '🌱',
    title: 'Beginner',
    description: "I know basic words and simple phrases. I can introduce myself but struggle with most conversations.",
  },
  {
    level: 'A2',
    emoji: '🌿',
    title: 'Elementary',
    description: "I can handle short conversations on familiar topics like family, work, and shopping.",
  },
  {
    level: 'B1',
    emoji: '🌳',
    title: 'Intermediate',
    description: "I can follow most conversations and express opinions on familiar topics. Travel and daily life feel okay.",
  },
  {
    level: 'B2',
    emoji: '🌲',
    title: 'Upper Intermediate',
    description: "I can discuss complex topics, watch movies without subtitles most of the time, and write detailed messages.",
  },
  {
    level: 'C1',
    emoji: '🏔️',
    title: 'Advanced',
    description: "I use English fluently for work and social situations. I can handle nuances, idioms, and abstract ideas.",
  },
  {
    level: 'C2',
    emoji: '⭐',
    title: 'Proficient',
    description: "I'm near-native. I understand subtle humor, rare expressions, and can discuss anything with precision.",
  },
]

function GeneralLevelPicker({ onComplete }: { onComplete: (assessment: LevelAssessment) => void }) {
  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full py-12">
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-aura-text mb-2">
          Pick Your <GradientText className="text-3xl font-bold">Level</GradientText>
        </h2>
        <p className="text-aura-text-dim">Which one sounds most like you? You can always change it later.</p>
      </div>

      <div className="w-full flex flex-col gap-3 mb-8">
        {LEVEL_OPTIONS.map((opt, i) => (
          <Card
            key={opt.level}
            variant="gradient"
            padding="md"
            hoverable
            onClick={() => {
              const assessment: LevelAssessment = {
                completedAt: new Date().toISOString(),
                scores: {
                  vocabulary: 50,
                  grammar: 50,
                  comprehension: 50,
                  dailyExpressions: 50,
                  technicalVocab: 50,
                  idioms: 50,
                },
                assignedLevel: opt.level,
                weakAreas: [],
                recommendations: [`Practice at ${opt.title} level. You can retake assessment anytime in Settings.`],
              }
              onComplete(assessment)
            }}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">{opt.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-aura-text">{opt.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-aura-purple/20 text-aura-purple font-mono">{opt.level}</span>
                </div>
                <p className="text-sm text-aura-text-dim leading-relaxed">{opt.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// --- Professional Imbalance Picker ---

const PRO_PROFILE_PRESETS: {
  id: string
  title: string
  description: string
  emoji: string
  profile: ImbalanceProfile
  primaryGaps: ImbalanceDimension[]
}[] = [
  {
    id: 'tech_shy',
    emoji: '💻',
    title: 'The Shy Techie',
    description: "I can write code reviews and docs, but I freeze when someone wants to chat about weekends or makes a joke.",
    profile: {
      technicalWriting: 85, academicReading: 80, registerFlexibility: 35,
      casualConversation: 25, socialSmallTalk: 20, impromptuSpeaking: 30,
      humorSarcasm: 25, culturalReferences: 30,
    },
    primaryGaps: ['socialSmallTalk', 'casualConversation', 'humorSarcasm'],
  },
  {
    id: 'academic',
    emoji: '🎓',
    title: 'The Academic',
    description: "I read papers and write research fine. Conferences and formal talks work. Casual hallway chat? Nope.",
    profile: {
      technicalWriting: 90, academicReading: 90, registerFlexibility: 30,
      casualConversation: 35, socialSmallTalk: 25, impromptuSpeaking: 45,
      humorSarcasm: 30, culturalReferences: 35,
    },
    primaryGaps: ['registerFlexibility', 'socialSmallTalk', 'humorSarcasm'],
  },
  {
    id: 'presenter',
    emoji: '🎤',
    title: 'The Scripted Presenter',
    description: "I can deliver a rehearsed talk well. But when questions come up or I'm off-script, I panic.",
    profile: {
      technicalWriting: 75, academicReading: 75, registerFlexibility: 50,
      casualConversation: 50, socialSmallTalk: 45, impromptuSpeaking: 25,
      humorSarcasm: 40, culturalReferences: 45,
    },
    primaryGaps: ['impromptuSpeaking', 'socialSmallTalk'],
  },
  {
    id: 'formal_only',
    emoji: '👔',
    title: 'Too Formal',
    description: "My English sounds stiff. I use 'Furthermore' in Slack. I want to sound more natural and human.",
    profile: {
      technicalWriting: 85, academicReading: 80, registerFlexibility: 20,
      casualConversation: 45, socialSmallTalk: 40, impromptuSpeaking: 50,
      humorSarcasm: 35, culturalReferences: 40,
    },
    primaryGaps: ['registerFlexibility', 'humorSarcasm', 'culturalReferences'],
  },
  {
    id: 'conversational_weak',
    emoji: '💬',
    title: 'Missing the Nuances',
    description: "I can function in English, but I miss jokes, idioms, and cultural references. Everything feels literal.",
    profile: {
      technicalWriting: 70, academicReading: 70, registerFlexibility: 55,
      casualConversation: 55, socialSmallTalk: 50, impromptuSpeaking: 55,
      humorSarcasm: 25, culturalReferences: 20,
    },
    primaryGaps: ['humorSarcasm', 'culturalReferences'],
  },
  {
    id: 'custom',
    emoji: '🎯',
    title: "I'm Not Sure",
    description: "Start me at a balanced middle level. I'll figure it out as I practice.",
    profile: createDefaultImbalanceProfile(),
    primaryGaps: ['casualConversation', 'socialSmallTalk'],
  },
]

function ProLevelPicker({ onComplete }: { onComplete: (assessment: ImbalanceAssessment) => void }) {
  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full py-12">
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-aura-text mb-2">
          Which <GradientText className="text-3xl font-bold">Sounds Like You</GradientText>?
        </h2>
        <p className="text-aura-text-dim">Pick the description that fits best. You can always change it later.</p>
      </div>

      <div className="w-full flex flex-col gap-3 mb-8">
        {PRO_PROFILE_PRESETS.map((preset, i) => (
          <Card
            key={preset.id}
            variant="gradient"
            padding="md"
            hoverable
            onClick={() => {
              const recommendationMap: Record<string, string> = {
                casualConversation: 'Practice everyday conversations and informal expressions.',
                socialSmallTalk: 'Build small talk skills for social situations.',
                impromptuSpeaking: 'Train spontaneous responses to unexpected questions.',
                humorSarcasm: 'Learn to recognize and use humor and sarcasm.',
                registerFlexibility: 'Practice switching between formal and casual.',
                culturalReferences: 'Learn common idioms, slang, and cultural expressions.',
              }
              onComplete({
                completedAt: new Date().toISOString(),
                profile: preset.profile,
                primaryGaps: preset.primaryGaps,
                anxietyScenes: [],
                recommendations: preset.primaryGaps.map(g => recommendationMap[g] || `Work on ${IMBALANCE_LABELS[g]}.`),
              })
            }}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">{preset.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-aura-text mb-1">{preset.title}</h3>
                <p className="text-sm text-aura-text-dim leading-relaxed">{preset.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mode Selection
// ---------------------------------------------------------------------------

function ModeSelection({ onSelect }: { onSelect: (mode: UserMode) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full">
      <div className="text-center mb-10 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-aura-text mb-2">
          Which describes <GradientText className="text-3xl font-bold">you</GradientText> better?
        </h2>
        <p className="text-aura-text-dim">
          This helps us personalize your learning experience.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <Card
          variant="gradient"
          padding="lg"
          hoverable
          onClick={() => onSelect('general')}
          className="animate-fade-in-up"
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">📚</span>
            <div>
              <h3 className="text-lg font-semibold text-aura-text mb-1">General Learner</h3>
              <p className="text-sm text-aura-text-dim leading-relaxed">
                I want to improve my overall English skills — reading, writing, speaking, and listening.
              </p>
            </div>
          </div>
        </Card>

        <Card
          variant="gradient"
          padding="lg"
          hoverable
          onClick={() => onSelect('professional')}
          className="animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">💼</span>
            <div>
              <h3 className="text-lg font-semibold text-aura-text mb-1">Professional</h3>
              <p className="text-sm text-aura-text-dim leading-relaxed">
                I know many advanced and technical words, but I struggle with casual conversation,
                small talk, and speaking naturally in social situations.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Professional Imbalance Assessment
// ---------------------------------------------------------------------------

function ProAssessmentStep({ onComplete }: { onComplete: (assessment: ImbalanceAssessment) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { value: string; index?: number }>>({})
  const [textInput, setTextInput] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const questions = PRO_ASSESSMENT_QUESTIONS
  const question = questions[currentIndex]
  const progress = (currentIndex / questions.length) * 100

  const handleMCSelect = useCallback((optionIndex: number) => {
    if (isTransitioning) return
    setSelectedOption(optionIndex)
    setIsTransitioning(true)

    const newAnswers = { ...answers, [question.id]: { value: question.options?.[optionIndex]?.text || '', index: optionIndex } }
    setAnswers(newAnswers)

    setTimeout(() => advance(newAnswers), 600)
  }, [answers, currentIndex, isTransitioning, question])

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return
    const newAnswers = { ...answers, [question.id]: { value: textInput.trim() } }
    setAnswers(newAnswers)
    setTextInput('')
    advance(newAnswers)
  }, [answers, question, textInput])

  const advance = useCallback((newAnswers: typeof answers) => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
      setIsTransitioning(false)
    } else {
      // Score the assessment
      const profile = scoreProAssessment(newAnswers)
      const primaryGaps = (Object.entries(profile) as [ImbalanceDimension, number][])
        .filter(([, v]) => v < 50)
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => k)

      const recommendations = primaryGaps.map((gap) => {
        const labels: Record<string, string> = {
          casualConversation: 'Practice everyday conversational phrases and informal expressions.',
          socialSmallTalk: 'Work on small talk skills for social situations.',
          impromptuSpeaking: 'Train spontaneous responses to unexpected questions.',
          humorSarcasm: 'Learn to recognize and use humor, irony, and sarcasm.',
          registerFlexibility: 'Practice switching between formal and casual registers.',
          culturalReferences: 'Learn common idioms, slang, and cultural expressions.',
        }
        return labels[gap] || `Improve your ${IMBALANCE_LABELS[gap]}.`
      })

      onComplete({
        completedAt: new Date().toISOString(),
        profile,
        primaryGaps,
        anxietyScenes: [],
        recommendations,
      })
    }
  }, [currentIndex, questions.length, onComplete])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full">
      <div className="w-full mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-aura-text">Imbalance Assessment</h2>
          <span className="text-sm text-aura-text-dim">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="w-full h-2 bg-aura-surface rounded-full overflow-hidden">
          <div className="h-full bg-aura-purple rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div key={question.id} className="w-full animate-fade-in-up">
        <Card variant="gradient" padding="lg" className="mb-6">
          <p className="text-lg font-medium text-aura-text leading-relaxed">{question.prompt}</p>
          <span className="inline-block mt-3 text-xs font-medium text-aura-text-dim uppercase tracking-wider px-2 py-1 rounded-md bg-aura-surface">
            {IMBALANCE_LABELS[question.dimension as ImbalanceDimension] || question.dimension}
          </span>
        </Card>

        {question.type === 'multiple_choice' && question.options && (
          <div className="flex flex-col gap-3">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx
              const isCorrect = isSelected && idx === question.correctIndex
              const isWrong = isSelected && idx !== question.correctIndex
              return (
                <button
                  key={idx}
                  onClick={() => handleMCSelect(idx)}
                  disabled={isTransitioning}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${
                    isCorrect ? 'border-green-500 bg-green-500/10 text-green-400'
                    : isWrong ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-aura-border bg-aura-surface hover:border-aura-purple/50 text-aura-text'
                  } ${isTransitioning && !isSelected ? 'opacity-50' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      isSelected ? (isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : 'bg-aura-midnight text-aura-text-dim'
                    }`}>{String.fromCharCode(65 + idx)}</span>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {(question.type === 'rewrite' || question.type === 'respond') && (
          <div className="flex flex-col gap-4">
            {question.formalInput && (
              <Card variant="default" padding="sm">
                <p className="text-xs text-aura-text-dim mb-1">Original (formal):</p>
                <p className="text-aura-text italic">"{question.formalInput}"</p>
              </Card>
            )}
            {question.scenario && (
              <Card variant="default" padding="sm">
                <p className="text-xs text-aura-text-dim mb-1">Scenario:</p>
                <p className="text-aura-text">{question.scenario}</p>
              </Card>
            )}
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response..."
              rows={3}
              className="w-full bg-aura-surface border border-aura-border rounded-xl px-4 py-3 text-aura-text placeholder-aura-text-dim/40 focus:outline-none focus:border-aura-purple/50 resize-none"
            />
            <Button variant="gold" onClick={handleTextSubmit} disabled={!textInput.trim()}>
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function scoreProAssessment(answers: Record<string, { value: string; index?: number }>): ImbalanceProfile {
  const profile = createDefaultImbalanceProfile()
  const dimScores: Record<string, { correct: number; total: number }> = {}

  for (const q of PRO_ASSESSMENT_QUESTIONS) {
    const dim = q.dimension
    if (!dimScores[dim]) dimScores[dim] = { correct: 0, total: 0 }
    dimScores[dim].total++

    const answer = answers[q.id]
    if (!answer) continue

    if (q.type === 'multiple_choice' && answer.index !== undefined) {
      if (answer.index === q.correctIndex) dimScores[dim].correct++
    } else if (q.type === 'rewrite' || q.type === 'respond') {
      // For text answers, give partial credit based on length and casualness
      const text = answer.value.toLowerCase()
      const isCasual = !text.includes('would like') && !text.includes('furthermore') &&
        !text.includes('hereby') && text.length < 200
      dimScores[dim].correct += isCasual ? 0.8 : 0.3
    }
  }

  for (const [dim, { correct, total }] of Object.entries(dimScores)) {
    if (total > 0 && dim in profile) {
      (profile as unknown as Record<string, number>)[dim] = Math.round((correct / total) * 100)
    }
  }

  return profile
}

// ---------------------------------------------------------------------------
// Professional Assessment Results (Radar Chart)
// ---------------------------------------------------------------------------

function ProAssessmentResults({
  assessment,
  onContinue,
}: {
  assessment: ImbalanceAssessment
  onContinue: () => void
}) {
  const radarData = (Object.entries(assessment.profile) as [ImbalanceDimension, number][]).map(
    ([key, value]) => ({
      dimension: IMBALANCE_LABELS[key],
      score: value,
      fullMark: 100,
    })
  )

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 max-w-2xl mx-auto w-full py-12">
      <div className="animate-fade-in-up text-center mb-6">
        <h2 className="text-2xl font-bold text-aura-text mb-2">Your Imbalance Profile</h2>
        <p className="text-aura-text-dim">This shows where your English is strong and where it needs work.</p>
      </div>

      {/* Radar Chart */}
      <Card variant="glass" padding="md" className="w-full mb-6 animate-fade-in-up">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#2A2560" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: '#9B97B8', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#7B2FBE"
              fill="rgba(123, 47, 190, 0.3)"
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Primary Gaps */}
      {assessment.primaryGaps.length > 0 && (
        <Card variant="glass" padding="lg" className="w-full mb-6 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide mb-3">
            Your Gaps (Focus Areas)
          </h3>
          <div className="flex flex-wrap gap-2">
            {assessment.primaryGaps.map((gap) => (
              <span key={gap} className="px-3 py-1.5 rounded-lg bg-aura-error/10 text-aura-error text-sm font-medium border border-aura-error/20">
                {IMBALANCE_LABELS[gap]}
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
        Choose Your Scenes
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Professional Scene Selection
// ---------------------------------------------------------------------------

function SceneSelection({ onComplete }: { onComplete: (sceneIds: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 max-w-3xl mx-auto w-full py-12">
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-aura-text mb-2">
          Choose Your <GradientText className="text-3xl font-bold">Scenes</GradientText>
        </h2>
        <p className="text-aura-text-dim">Select scenarios you want to practice. Pick at least 2.</p>
      </div>

      <div className="w-full space-y-6 mb-10">
        {PRO_CATEGORIES.map((tier) => (
          <div key={tier.id} className="animate-fade-in-up">
            <h3 className="text-sm font-semibold text-aura-text-dim uppercase tracking-wide mb-3">
              {tier.icon} {tier.label}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {tier.children?.map((scene) => {
                const isSelected = selected.has(scene.id)
                return (
                  <Card
                    key={scene.id}
                    variant={isSelected ? 'gradient' : 'default'}
                    padding="sm"
                    hoverable
                    onClick={() => toggle(scene.id)}
                    className={`relative ${isSelected ? 'ring-2 ring-aura-purple' : ''}`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-aura-purple flex items-center justify-center text-white text-[10px]">
                        &#10003;
                      </span>
                    )}
                    <span className="text-lg block mb-1">{scene.icon}</span>
                    <h4 className="text-sm font-medium text-aura-text">{scene.label}</h4>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-aura-text-dim">{selected.size} of 2 minimum selected</p>
        <Button variant="gold" size="lg" disabled={selected.size < 2} onClick={() => onComplete(Array.from(selected))}>
          Start Training
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
  const [mode, setMode] = useState<UserMode>('general')
  const [assessment, setAssessment] = useState<LevelAssessment | null>(null)
  const [proAssessment, setProAssessment] = useState<ImbalanceAssessment | null>(null)

  const navigate = useNavigate()
  const {
    createProfile, setLevel, setSelectedCategories,
    setMode: saveMode, setImbalanceAssessment, setSelectedScenes,
  } = useUserStore()

  const handleModeSelect = useCallback((selectedMode: UserMode) => {
    setMode(selectedMode)
    setStep('assessment')
  }, [])

  const handleAssessmentComplete = useCallback((result: LevelAssessment) => {
    setAssessment(result)
    setStep('results')
  }, [])

  const handleProAssessmentComplete = useCallback((result: ImbalanceAssessment) => {
    setProAssessment(result)
    setStep('results')
  }, [])

  const handleGeneralComplete = useCallback(async (categoryIds: string[]) => {
    await createProfile()
    await saveMode('general')
    if (assessment) await setLevel(assessment)
    await setSelectedCategories(categoryIds)
    navigate('/')
  }, [assessment, createProfile, saveMode, setLevel, setSelectedCategories, navigate])

  const handleProComplete = useCallback(async (sceneIds: string[]) => {
    await createProfile()
    await saveMode('professional')
    if (proAssessment) await setImbalanceAssessment(proAssessment)
    await setSelectedScenes(sceneIds)
    navigate('/')
  }, [proAssessment, createProfile, saveMode, setImbalanceAssessment, setSelectedScenes, navigate])

  const steps: { key: OnboardingStep; label: string }[] = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'mode_select', label: 'Mode' },
    { key: 'assessment', label: 'Your Level' },
    { key: 'categories', label: mode === 'professional' ? 'Scenes' : 'Interests' },
  ]
  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-aura-purple/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-aura-purple/5 blur-[120px]" />
      </div>

      {step !== 'welcome' && step !== 'mode_select' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-aura-midnight/80 backdrop-blur-md border-b border-aura-border/50">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {steps.filter(s => s.key !== 'mode_select').map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < currentStepIndex - 1 ? 'bg-aura-purple text-white'
                    : i === currentStepIndex - 1 ? 'bg-aura-purple/20 text-aura-purple border border-aura-purple'
                    : 'bg-aura-surface text-aura-text-dim'
                  }`}>
                    {i < currentStepIndex - 1 ? '\u2713' : i + 1}
                  </span>
                  <span className={`text-sm hidden sm:inline ${i === currentStepIndex - 1 ? 'text-aura-text' : 'text-aura-text-dim'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={step !== 'welcome' && step !== 'mode_select' ? 'pt-16' : ''}>
        {step === 'welcome' && (
          <WelcomeSlides onComplete={() => setStep('mode_select')} />
        )}

        {step === 'mode_select' && (
          <ModeSelection onSelect={handleModeSelect} />
        )}

        {step === 'assessment' && mode === 'general' && (
          <GeneralLevelPicker onComplete={(a) => {
            setAssessment(a)
            setStep('categories')
          }} />
        )}

        {step === 'assessment' && mode === 'professional' && (
          <ProLevelPicker onComplete={(a) => {
            setProAssessment(a)
            setStep('categories')
          }} />
        )}

        {step === 'categories' && mode === 'general' && (
          <CategorySelection onComplete={handleGeneralComplete} />
        )}

        {step === 'categories' && mode === 'professional' && (
          <SceneSelection onComplete={handleProComplete} />
        )}
      </div>
    </div>
  )
}
