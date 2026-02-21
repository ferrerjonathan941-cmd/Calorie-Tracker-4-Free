'use client'

import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { FoodEntry } from '@/lib/types'

interface DailyLogProps {
  entries: FoodEntry[]
  onDelete: (id: string) => void
  onEdit: (entry: FoodEntry) => void
  isToday?: boolean
}

export default function DailyLog({ entries, onDelete, onEdit, isToday = true }: DailyLogProps) {
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.total_calories,
      protein: acc.protein + entry.total_protein,
      carbs: acc.carbs + entry.total_carbs,
      fat: acc.fat + entry.total_fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="space-y-4">
      {/* Daily totals */}
      <div className="bg-gradient-to-b from-surface to-surface-2 rounded-2xl shadow-sm border border-border p-4">
        <h2 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-display)]">{isToday ? "Today\u2019s Totals" : 'Daily Totals'}</h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{Math.round(totals.calories)}</p>
            <p className="text-xs text-text-dim">Calories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{Math.round(totals.protein)}g</p>
            <p className="text-xs text-text-dim">Protein</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{Math.round(totals.carbs)}g</p>
            <p className="text-xs text-text-dim">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{Math.round(totals.fat)}g</p>
            <p className="text-xs text-text-dim">Fat</p>
          </div>
        </div>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 text-center">
          <p className="text-text-dim">{isToday ? 'No entries yet today. Snap a photo to get started!' : 'No entries for this day.'}</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onEdit(entry)}
            className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden cursor-pointer hover:border-white/10 transition-colors"
          >
            <div className="flex">
              {entry.image_url && (
                <img
                  src={entry.image_url}
                  alt="Food"
                  className="w-24 h-24 object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-text-dim">
                        {format(new Date(entry.logged_at), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 truncate">
                      {entry.food_items.map((item) => item.name).join(', ')}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="font-medium text-white">{entry.total_calories} cal</span>
                      <span className="text-white/60">P: {entry.total_protein}g</span>
                      <span className="text-white/60">C: {entry.total_carbs}g</span>
                      <span className="text-white/60">F: {entry.total_fat}g</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
                    className="p-1.5 text-white/20 hover:text-white/60 hover:bg-white/[0.04] rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
