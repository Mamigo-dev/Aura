import { useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../../stores/userStore'
import { GradientText } from '../ui/GradientText'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showSettings?: boolean
  rightContent?: React.ReactNode
}

export function Header({ title, showBack, showSettings = true, rightContent }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useUserStore((s) => s.profile)
  const setMode = useUserStore((s) => s.setMode)
  const isPro = profile?.userMode === 'professional'

  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-30 glass safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {isHome ? (
            <div className="flex items-center gap-2">
              <img src="/Aura/Aura_logo.png" alt="Aura" className="w-8 h-8 rounded-lg" />
              <GradientText className="text-xl font-bold">Aura</GradientText>
            </div>
          ) : (
            <h1 className="text-lg font-semibold text-aura-text">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightContent}
          {/* Mode switcher */}
          <button
            onClick={() => setMode(isPro ? 'general' : 'professional')}
            className="h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors bg-aura-surface border border-aura-border hover:border-aura-purple/50"
            title={`Switch to ${isPro ? 'General' : 'Professional'} mode`}
          >
            <span>{isPro ? '💼' : '📚'}</span>
            <span className="text-aura-text-dim hidden sm:inline">{isPro ? 'Pro' : 'General'}</span>
          </button>
          {showSettings && (
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
