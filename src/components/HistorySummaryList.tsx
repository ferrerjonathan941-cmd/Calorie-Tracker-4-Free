'use client'

import { format, parseISO } from 'date-fns'
import { DailySummary } from '@/lib/types'

interface HistorySummaryListProps {
  summaries: DailySummary[]
}

export default function HistorySummaryList({ summaries }: HistorySummaryListProps) {
  if (summaries.length === 0) {
    return (
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 text-center">
        <p className="text-text-dim">No entries for this period.</p>
      </div>
    )
  }

  const days = summaries.length
  const avgCals = Math.round(summaries.reduce((s, d) => s + d.total_calories, 0) / days)
  const avgProtein = Math.round(summaries.reduce((s, d) => s + d.total_protein, 0) / days)
  const avgCarbs = Math.round(summaries.reduce((s, d) => s + d.total_carbs, 0) / days)
  const avgFat = Math.round(summaries.reduce((s, d) => s + d.total_fat, 0) / days)

  return (
    <div className="space-y-4">
      {/* Daily averages */}
      <div className="bg-gradient-to-b from-surface to-surface-2 rounded-2xl shadow-sm border border-border p-4">
        <h2 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-display)]">Daily Average</h2>
        <div className="text-center mb-3">
          <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{avgCals.toLocaleString()}</p>
          <p className="text-xs text-text-dim">Calories / Day</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">{avgProtein}g</p>
            <p className="text-xs text-text-dim">Protein</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">{avgCarbs}g</p>
            <p className="text-xs text-text-dim">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">{avgFat}g</p>
            <p className="text-xs text-text-dim">Fat</p>
          </div>
        </div>
      </div>

      {/* Daily rows */}
      {summaries.map((day) => (
        <div
          key={day.date}
          className="bg-surface rounded-2xl shadow-sm border border-border p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">
              {format(parseISO(day.date), 'EEE, MMM d')}
            </p>
            <span className="text-xs text-text-dim">
              {day.entry_count} {day.entry_count === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <p className="font-bold text-white font-[family-name:var(--font-display)]">{Math.round(day.total_calories)}</p>
              <p className="text-xs text-text-dim">Cal</p>
            </div>
            <div>
              <p className="font-bold text-white font-[family-name:var(--font-display)]">{Math.round(day.total_protein)}g</p>
              <p className="text-xs text-text-dim">P</p>
            </div>
            <div>
              <p className="font-bold text-white font-[family-name:var(--font-display)]">{Math.round(day.total_carbs)}g</p>
              <p className="text-xs text-text-dim">C</p>
            </div>
            <div>
              <p className="font-bold text-white font-[family-name:var(--font-display)]">{Math.round(day.total_fat)}g</p>
              <p className="text-xs text-text-dim">F</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
