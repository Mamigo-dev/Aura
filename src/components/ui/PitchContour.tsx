import type { PitchPoint } from '../../lib/pitchAnalyzer'

interface PitchContourProps {
  points: PitchPoint[]
  durationSeconds: number
  className?: string
}

export function PitchContour({ points, durationSeconds, className = '' }: PitchContourProps) {
  const width = 600
  const height = 120
  const padding = { top: 10, right: 10, bottom: 25, left: 35 }

  const voicedPoints = points.filter((p) => p.frequency > 0)
  if (voicedPoints.length < 2) {
    return (
      <div className={`text-center text-sm text-aura-text-dim py-4 ${className}`}>
        Not enough voice data for pitch analysis
      </div>
    )
  }

  const minF = Math.min(...voicedPoints.map((p) => p.frequency)) * 0.9
  const maxF = Math.max(...voicedPoints.map((p) => p.frequency)) * 1.1

  const scaleX = (time: number) =>
    padding.left + (time / durationSeconds) * (width - padding.left - padding.right)
  const scaleY = (freq: number) =>
    height - padding.bottom - ((freq - minF) / (maxF - minF)) * (height - padding.top - padding.bottom)

  // Build SVG path from voiced points
  const pathSegments: string[] = []
  let inSegment = false

  for (const point of points) {
    if (point.frequency > 0) {
      const x = scaleX(point.time)
      const y = scaleY(point.frequency)
      if (!inSegment) {
        pathSegments.push(`M ${x} ${y}`)
        inSegment = true
      } else {
        pathSegments.push(`L ${x} ${y}`)
      }
    } else {
      inSegment = false
    }
  }

  const pathD = pathSegments.join(' ')

  // Color segments based on pitch direction
  const getSegmentColor = (i: number): string => {
    if (i < 1) return '#7B2FBE'
    const prev = voicedPoints[i - 1]
    const curr = voicedPoints[i]
    const diff = curr.frequency - prev.frequency
    if (Math.abs(diff) < 5) return '#9B97B8' // flat - dim
    if (diff > 0) return '#4ADE80' // rising - green
    return '#D4A843' // falling - gold
  }

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => {
          const y = padding.top + frac * (height - padding.top - padding.bottom)
          return (
            <line
              key={frac}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#2A2560"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Pitch contour line */}
        <path
          d={pathD}
          fill="none"
          stroke="#7B2FBE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Dots at voiced points (sampled) */}
        {voicedPoints
          .filter((_, i) => i % Math.max(1, Math.floor(voicedPoints.length / 40)) === 0)
          .map((point, i) => (
            <circle
              key={i}
              cx={scaleX(point.time)}
              cy={scaleY(point.frequency)}
              r="2"
              fill={getSegmentColor(i)}
            />
          ))}

        {/* Y axis labels */}
        <text x={padding.left - 5} y={padding.top + 5} textAnchor="end" className="text-[8px] fill-aura-text-dim">
          {Math.round(maxF)}Hz
        </text>
        <text x={padding.left - 5} y={height - padding.bottom} textAnchor="end" className="text-[8px] fill-aura-text-dim">
          {Math.round(minF)}Hz
        </text>

        {/* X axis - time markers */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <text
            key={frac}
            x={scaleX(frac * durationSeconds)}
            y={height - 5}
            textAnchor="middle"
            className="text-[8px] fill-aura-text-dim"
          >
            {(frac * durationSeconds).toFixed(1)}s
          </text>
        ))}

        {/* Legend */}
        <circle cx={width - 120} cy={8} r="3" fill="#4ADE80" />
        <text x={width - 114} y={11} className="text-[7px] fill-aura-text-dim">Rising</text>
        <circle cx={width - 80} cy={8} r="3" fill="#D4A843" />
        <text x={width - 74} y={11} className="text-[7px] fill-aura-text-dim">Falling</text>
        <circle cx={width - 40} cy={8} r="3" fill="#9B97B8" />
        <text x={width - 34} y={11} className="text-[7px] fill-aura-text-dim">Flat</text>
      </svg>
    </div>
  )
}
