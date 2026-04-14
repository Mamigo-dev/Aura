import type { UserMode } from '../../types/user'

interface ModeSwitcherProps {
  currentMode: UserMode
  onSwitch: (mode: UserMode) => void
  compact?: boolean
}

const MODES: { key: UserMode; icon: string; label: string }[] = [
  { key: 'general', icon: '\uD83D\uDCDA', label: 'General' },
  { key: 'professional', icon: '\uD83D\uDCBC', label: 'Professional' },
]

export function ModeSwitcher({ currentMode, onSwitch, compact = false }: ModeSwitcherProps) {
  if (compact) {
    const nextMode: UserMode = currentMode === 'general' ? 'professional' : 'general'
    const nextMeta = MODES.find((m) => m.key === nextMode)!

    return (
      <button
        onClick={() => onSwitch(nextMode)}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-aura-surface hover:bg-aura-surface-hi border border-aura-border/50 transition-all duration-200"
        title={`Switch to ${nextMeta.label} mode`}
      >
        <span className="text-base">{nextMeta.icon}</span>
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      {MODES.map((mode) => {
        const isActive = currentMode === mode.key
        return (
          <button
            key={mode.key}
            onClick={() => onSwitch(mode.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              isActive
                ? 'bg-aura-purple text-white shadow-lg shadow-aura-purple/20'
                : 'bg-aura-surface text-aura-text-dim hover:bg-aura-surface-hi hover:text-aura-text border border-aura-border/50'
            }`}
          >
            <span className="text-lg">{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
