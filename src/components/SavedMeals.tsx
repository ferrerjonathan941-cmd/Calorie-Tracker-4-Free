'use client'

import { Trash2, Zap } from 'lucide-react'
import { SavedMeal } from '@/lib/types'

interface SavedMealsProps {
  meals: SavedMeal[]
  onQuickLog: (meal: SavedMeal) => void
  onDelete: (id: string) => void
}

export default function SavedMeals({ meals, onQuickLog, onDelete }: SavedMealsProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-4">
      <h2 className="text-lg font-semibold text-white mb-3">Saved Meals</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex-shrink-0 w-44 bg-white/[0.03] rounded-xl p-3 border border-border"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium text-white truncate flex-1">{meal.name}</p>
              <button
                onClick={() => onDelete(meal.id)}
                className="p-0.5 text-white/20 hover:text-white/60 rounded ml-1 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-text-dim mb-2">{meal.total_calories} cal</p>
            <button
              onClick={() => onQuickLog(meal)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-white bg-white/[0.08] rounded-lg hover:bg-white/[0.14] transition-colors"
            >
              <Zap className="w-3 h-3" />
              Quick Log
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
