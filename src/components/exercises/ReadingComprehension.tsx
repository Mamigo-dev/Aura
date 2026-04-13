import { useState, useCallback } from 'react'
import type { Exercise, ReadingComprehensionContent } from '../../types/exercise'
import type { ExerciseResult, ReadingComprehensionScore } from '../../types/scoring'
import { calculateOverallScore } from '../../types/scoring'
import { useExerciseStore } from '../../stores/exerciseStore'
import { ExerciseWrapper } from './ExerciseWrapper'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface ReadingComprehensionProps {
  exercise: Exercise
  onComplete?: (result: ExerciseResult) => void
}

export function ReadingComprehension({ exercise, onComplete }: ReadingComprehensionProps) {
  const content = exercise.content as ReadingComprehensionContent
  const { phase, elapsedSeconds, startExercise, setResult } = useExerciseStore()

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [answers, setAnswers] = useState<
    { questionId: string; selectedIndex: number; correct: boolean }[]
  >([])

  const currentQuestion = content.questions[currentQuestionIdx]
  const isLastQuestion = currentQuestionIdx === content.questions.length - 1
  const totalQuestions = content.questions.length

  const handleSelectOption = useCallback(
    (index: number) => {
      if (hasAnswered) return
      if (phase === 'ready') {
        startExercise()
      }
      setSelectedOption(index)
    },
    [hasAnswered, phase, startExercise]
  )

  const handleConfirmAnswer = useCallback(() => {
    if (selectedOption === null) return

    const correct = selectedOption === currentQuestion.correctIndex
    const answer = {
      questionId: currentQuestion.id,
      selectedIndex: selectedOption,
      correct,
    }

    setAnswers((prev) => [...prev, answer])
    setHasAnswered(true)
  }, [selectedOption, currentQuestion])

  const handleNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      // Calculate final score
      const allAnswers = answers
      const correctCount = allAnswers.filter((a) => a.correct).length

      const details: ReadingComprehensionScore = {
        type: 'reading_comprehension',
        answers: allAnswers,
        correctCount,
        totalQuestions,
      }

      const overallScore = calculateOverallScore('reading_comprehension', details)

      const result: ExerciseResult = {
        id: crypto.randomUUID(),
        exerciseId: exercise.id,
        userId: '',
        completedAt: new Date().toISOString(),
        score: overallScore,
        passed: overallScore >= exercise.passingScore,
        timeSpentSeconds: elapsedSeconds,
        details,
      }

      setResult(result)
    } else {
      setCurrentQuestionIdx((prev) => prev + 1)
      setSelectedOption(null)
      setHasAnswered(false)
    }
  }, [isLastQuestion, answers, totalQuestions, exercise, elapsedSeconds, setResult])

  const handleComplete = useCallback(
    (result: ExerciseResult) => {
      onComplete?.(result)
    },
    [onComplete]
  )

  const getOptionStyles = (index: number) => {
    const base =
      'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm'

    if (!hasAnswered) {
      if (selectedOption === index) {
        return `${base} border-aura-purple bg-aura-purple/10 text-aura-text`
      }
      return `${base} border-aura-border bg-aura-surface text-aura-text hover:border-aura-purple/50 hover:bg-aura-surface`
    }

    // After answering
    if (index === currentQuestion.correctIndex) {
      return `${base} border-aura-success/50 bg-aura-success/20 text-aura-text`
    }
    if (index === selectedOption && !answers[answers.length - 1]?.correct) {
      return `${base} border-aura-error/50 bg-aura-error/20 text-aura-text`
    }
    return `${base} border-aura-border/30 bg-aura-surface/50 text-aura-text-dim`
  }

  return (
    <ExerciseWrapper exercise={exercise} onComplete={handleComplete}>
      {/* Passage */}
      <Card variant="glass">
        <p className="text-aura-text leading-relaxed">{content.passage}</p>
      </Card>

      {/* Question progress */}
      {phase !== 'completed' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-aura-text-dim">
            Question {currentQuestionIdx + 1} of {totalQuestions}
          </span>
          <div className="flex-1 flex gap-1">
            {content.questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < currentQuestionIdx
                    ? 'bg-aura-purple'
                    : i === currentQuestionIdx
                      ? 'bg-aura-gold'
                      : 'bg-aura-surface'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current question */}
      {phase !== 'completed' && currentQuestion && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-medium text-aura-text">
            {currentQuestion.question}
          </h3>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={getOptionStyles(index)}
                onClick={() => handleSelectOption(index)}
                disabled={hasAnswered}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full border border-current/30 flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Explanation after answering */}
          {hasAnswered && (
            <Card
              variant="default"
              padding="sm"
              className={
                answers[answers.length - 1]?.correct
                  ? 'bg-aura-success/20 border-aura-success/30'
                  : 'bg-aura-error/20 border-aura-error/30'
              }
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {answers[answers.length - 1]?.correct ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-aura-success">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-aura-error">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </span>
                <p className="text-sm text-aura-text">{currentQuestion.explanation}</p>
              </div>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            {!hasAnswered ? (
              <Button
                variant="primary"
                onClick={handleConfirmAnswer}
                disabled={selectedOption === null}
              >
                Confirm Answer
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNextQuestion}>
                {isLastQuestion ? 'See Results' : 'Next Question'}
              </Button>
            )}
          </div>
        </div>
      )}
    </ExerciseWrapper>
  )
}
