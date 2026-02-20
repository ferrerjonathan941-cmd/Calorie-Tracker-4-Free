'use client'

interface PortionAdjusterProps {
  currentMultiplier: number
  onChange: (multiplier: number) => void
}

const SIZES = [
  { label: 'S', multiplier: 0.6 },
  { label: 'M', multiplier: 1.0 },
  { label: 'L', multiplier: 1.4 },
  { label: 'XL', multiplier: 2.0 },
]

export default function PortionAdjuster({ currentMultiplier, onChange }: PortionAdjusterProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-2.5 flex items-center gap-2">
      <span className="text-xs text-text-dim font-medium uppercase tracking-wide">Portion:</span>
      <div className="flex gap-1">
        {SIZES.map((size) => (
          <button
            key={size.label}
            onClick={() => onChange(size.multiplier)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              currentMultiplier === size.multiplier
                ? 'bg-gradient-to-r from-accent to-[#FF8F65] text-white shadow-lg shadow-accent/25'
                : 'bg-white/[0.04] text-text-dim hover:bg-white/[0.08]'
            }`}
          >
            {size.label}
          </button>
        ))}
      </div>
      <span className="text-xs text-text-dim">{currentMultiplier}x</span>
    </div>
  )
}
