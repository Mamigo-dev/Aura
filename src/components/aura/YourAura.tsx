import type { ReactNode } from 'react'
import { Card } from '../ui/Card'
import { GradientText } from '../ui/GradientText'

interface AuraExampleData {
  content: string
  highlights: string[]
  explanation: string
}

interface YourAuraProps {
  example: AuraExampleData | null
  exerciseType: string
}

function renderHighlightedContent(content: string, highlights: string[]): ReactNode {
  if (!highlights.length) return content

  const parts: ReactNode[] = []
  let remaining = content
  let key = 0

  // Sort highlights by position of first occurrence so we process in order
  const sorted = [...highlights].sort((a, b) => {
    const idxA = remaining.toLowerCase().indexOf(a.toLowerCase())
    const idxB = remaining.toLowerCase().indexOf(b.toLowerCase())
    return idxA - idxB
  })

  for (const phrase of sorted) {
    const idx = remaining.toLowerCase().indexOf(phrase.toLowerCase())
    if (idx === -1) continue

    if (idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
    }
    parts.push(
      <span key={key++} className="text-aura-gold font-bold">
        {remaining.slice(idx, idx + phrase.length)}
      </span>
    )
    remaining = remaining.slice(idx + phrase.length)
  }

  if (remaining) {
    parts.push(<span key={key++}>{remaining}</span>)
  }

  return parts.length > 0 ? <>{parts}</> : content
}

export function YourAura({ example, exerciseType: _exerciseType }: YourAuraProps) {
  if (!example) return null

  return (
    <Card variant="aura" padding="lg">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          {/* Sparkle icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-aura-gold"
          >
            <path
              d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
          <GradientText variant="gold" className="text-lg font-bold">
            Your Aura
          </GradientText>
        </div>

        {/* Model example content */}
        <p className="text-aura-text leading-loose text-lg">
          {renderHighlightedContent(example.content, example.highlights)}
        </p>

        {/* Explanation */}
        <p className="text-sm text-aura-text-dim italic leading-relaxed">
          {example.explanation}
        </p>

        {/* Aspirational note */}
        <div className="flex items-center gap-2 pt-1 border-t border-aura-border/30">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-aura-text-dim shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-xs text-aura-text-dim">
            This is an aspirational example one level above your current ability
          </span>
        </div>
      </div>
    </Card>
  )
}
