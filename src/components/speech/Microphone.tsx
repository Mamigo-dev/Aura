import { useCallback } from 'react'

interface MicrophoneProps {
  isListening: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Microphone({ isListening, onStart, onStop, disabled, size = 'md' }: MicrophoneProps) {
  const toggle = useCallback(() => {
    if (isListening) {
      onStop()
    } else {
      onStart()
    }
  }, [isListening, onStart, onStop])

  const sizeStyles = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  }

  const iconSize = {
    sm: 24,
    md: 32,
    lg: 40,
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={toggle}
        disabled={disabled}
        className={`${sizeStyles[size]} rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
          isListening
            ? 'bg-aura-error animate-pulse-ring'
            : 'gradient-gold hover:shadow-lg hover:shadow-aura-gold/30 active:scale-95'
        }`}
      >
        {isListening ? (
          <StopIcon size={iconSize[size]} />
        ) : (
          <MicIcon size={iconSize[size]} />
        )}
      </button>

      {/* Waveform animation */}
      {isListening && (
        <div className="flex items-end gap-1 h-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-aura-gold rounded-full waveform-bar"
              style={{
                animationDelay: `${i * 0.15}s`,
                height: '4px',
              }}
            />
          ))}
        </div>
      )}

      <span className="text-xs text-aura-text-dim">
        {isListening ? 'Tap to stop' : 'Tap to speak'}
      </span>
    </div>
  )
}

function MicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0D0B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon({ size }: { size: number }) {
  return (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="white">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}
