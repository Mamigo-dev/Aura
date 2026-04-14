import { useState, type ReactNode } from 'react'
import { Card } from '../ui/Card'
import { GradientText } from '../ui/GradientText'
import type { MultiRegisterAura } from '../../types/professional'

interface YourAuraProProps {
  aura: MultiRegisterAura | null
}

type RegisterTab = 'professional' | 'casual' | 'superInformal'

const TABS: { key: RegisterTab; label: string; icon: string }[] = [
  { key: 'professional', label: 'Professional', icon: '\uD83C\uDFE2' },
  { key: 'casual', label: 'Casual', icon: '\uD83D\uDCAC' },
  { key: 'superInformal', label: 'Informal', icon: '\uD83C\uDF89' },
]

function renderHighlightedContent(content: string, highlights: string[]): ReactNode {
  if (!highlights.length) return content

  const parts: ReactNode[] = []
  let remaining = content
  let key = 0

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

export function YourAuraPro({ aura }: YourAuraProProps) {
  const [activeTab, setActiveTab] = useState<RegisterTab>('professional')

  if (!aura) return null

  const tabData = aura[activeTab]

  return (
    <Card variant="aura" padding="lg">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
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

        {/* Tabs */}
        <div className="flex gap-1 bg-aura-midnight/50 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-aura-surface-hi text-aura-text shadow-sm'
                  : 'text-aura-text-dim hover:text-aura-text'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in-up">
          <p className="text-aura-text leading-loose text-lg">
            {renderHighlightedContent(tabData.content, tabData.highlights)}
          </p>
        </div>

        {/* Shared explanation */}
        <p className="text-sm text-aura-text-dim italic leading-relaxed">
          {aura.explanation}
        </p>

        {/* Note */}
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
            Three ways to say the same thing — practice switching between them
          </span>
        </div>
      </div>
    </Card>
  )
}
