'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, Check } from 'lucide-react'
import { FoodEntry, FoodItem } from '@/lib/types'

interface ManualEntryFormProps {
  onNewEntry: (entry: FoodEntry) => void
  onCancel?: () => void
  mealType: string
}

interface ManualItem {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
  quantity: string
}

const emptyItem = (): ManualItem => ({
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  quantity: '1 serving',
})

export default function ManualEntryForm({ onNewEntry, onCancel, mealType }: ManualEntryFormProps) {
  const [items, setItems] = useState<ManualItem[]>([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateItem = (index: number, field: keyof ManualItem, value: string) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()])
  }

  const handleSubmit = async () => {
    const foodItems: FoodItem[] = items
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        calories: Math.round(Number(item.calories) || 0),
        protein: Math.round((Number(item.protein) || 0) * 10) / 10,
        carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
        fat: Math.round((Number(item.fat) || 0) * 10) / 10,
        quantity: item.quantity || '1 serving',
      }))

    if (foodItems.length === 0) {
      setError('Add at least one food item with a name')
      return
    }

    setSaving(true)
    setError(null)

    const totals = {
      total_calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      total_protein: Math.round(foodItems.reduce((sum, item) => sum + item.protein, 0) * 10) / 10,
      total_carbs: Math.round(foodItems.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10,
      total_fat: Math.round(foodItems.reduce((sum, item) => sum + item.fat, 0) * 10) / 10,
    }

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: mealType,
          food_items: foodItems,
          logged_at: new Date().toISOString(),
          ...totals,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save entry')
      }

      const entry = await res.json()
      onNewEntry(entry)
      setItems([emptyItem()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="bg-white/[0.03] border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              className="flex-1 text-sm font-medium text-text bg-transparent border-b border-border focus:border-accent focus:outline-none pb-0.5"
              placeholder="Food name"
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="ml-2 p-1 text-white/20 hover:text-white/60 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-text-dim">Cal</label>
              <input
                type="number"
                value={item.calories}
                onChange={(e) => updateItem(index, 'calories', e.target.value)}
                className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-text-dim">Protein</label>
              <input
                type="number"
                step="0.1"
                value={item.protein}
                onChange={(e) => updateItem(index, 'protein', e.target.value)}
                className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-text-dim">Carbs</label>
              <input
                type="number"
                step="0.1"
                value={item.carbs}
                onChange={(e) => updateItem(index, 'carbs', e.target.value)}
                className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-text-dim">Fat</label>
              <input
                type="number"
                step="0.1"
                value={item.fat}
                onChange={(e) => updateItem(index, 'fat', e.target.value)}
                className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="0"
              />
            </div>
          </div>
          <input
            type="text"
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
            className="w-full text-xs text-text-dim bg-transparent border-b border-border focus:border-accent focus:outline-none pb-0.5"
            placeholder="Serving size (e.g., 1 cup)"
          />
        </div>
      ))}

      <button
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Another
      </button>

      {error && (
        <div className="bg-white/[0.04] text-white/60 text-sm p-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 text-white/60 bg-white/[0.06] border border-white/[0.08] rounded-xl font-medium hover:bg-white/[0.10] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.10] border border-white/[0.08] text-white rounded-xl font-medium hover:bg-white/[0.16] disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Entry
            </>
          )}
        </button>
      </div>
    </div>
  )
}
