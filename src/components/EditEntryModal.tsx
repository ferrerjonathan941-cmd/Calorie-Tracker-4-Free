'use client'

import { useState } from 'react'
import { X, Plus, Minus, Trash2, Loader2 } from 'lucide-react'
import { FoodEntry, FoodItem } from '@/lib/types'
import PortionAdjuster from '@/components/PortionAdjuster'

interface EditEntryModalProps {
  entry: FoodEntry
  onSave: (updated: FoodEntry) => void
  onClose: () => void
}

export default function EditEntryModal({ entry, onSave, onClose }: EditEntryModalProps) {
  const [items, setItems] = useState<FoodItem[]>(
    entry.food_items.map((item) => ({ ...item }))
  )
  const [baseItems, setBaseItems] = useState<FoodItem[]>(
    entry.food_items.map((item) => ({ ...item }))
  )
  const [portionMultiplier, setPortionMultiplier] = useState(1.0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recalculateTotals = (foodItems: FoodItem[]) => ({
    total_calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
    total_protein: Math.round(foodItems.reduce((sum, item) => sum + item.protein, 0) * 10) / 10,
    total_carbs: Math.round(foodItems.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10,
    total_fat: Math.round(foodItems.reduce((sum, item) => sum + item.fat, 0) * 10) / 10,
  })

  const updateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    // Reset portion base on manual edit
    setBaseItems(items.map((item) => ({ ...item })))
    setPortionMultiplier(1.0)
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '1 serving' },
    ])
  }

  const handleServingsChange = (index: number, newServings: number) => {
    if (newServings < 1) return
    const currentItem = items[index]
    const oldServings = currentItem.servings || 1
    const ratio = newServings / oldServings

    const scaledItem = {
      ...currentItem,
      servings: newServings,
      calories: Math.round(currentItem.calories * ratio),
      protein: Math.round(currentItem.protein * ratio * 10) / 10,
      carbs: Math.round(currentItem.carbs * ratio * 10) / 10,
      fat: Math.round(currentItem.fat * ratio * 10) / 10,
    }

    setItems((prev) => prev.map((item, i) => (i === index ? scaledItem : item)))
    setBaseItems((prev) => prev.map((item, i) => (i === index ? scaledItem : item)))
    setPortionMultiplier(1.0)
  }

  const handlePortionChange = (multiplier: number) => {
    setPortionMultiplier(multiplier)
    setItems(
      baseItems.map((item) => ({
        ...item,
        calories: Math.round(item.calories * multiplier),
        protein: Math.round(item.protein * multiplier * 10) / 10,
        carbs: Math.round(item.carbs * multiplier * 10) / 10,
        fat: Math.round(item.fat * multiplier * 10) / 10,
      }))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const totals = recalculateTotals(items)

    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_items: items,
          ...totals,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update entry')
      }

      const updated = await res.json()
      onSave(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const totals = recalculateTotals(items)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-bg w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg border-b border-border p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-white">Edit Entry</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-dim hover:text-white hover:bg-white/[0.04] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Totals */}
          <div className="bg-gradient-to-r from-surface-2 to-surface-3 rounded-xl p-3">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="font-bold text-white font-[family-name:var(--font-display)]">{totals.total_calories}</p>
                <p className="text-xs text-text-dim">Cal</p>
              </div>
              <div>
                <p className="font-bold text-white font-[family-name:var(--font-display)]">{totals.total_protein}g</p>
                <p className="text-xs text-text-dim">Protein</p>
              </div>
              <div>
                <p className="font-bold text-white font-[family-name:var(--font-display)]">{totals.total_carbs}g</p>
                <p className="text-xs text-text-dim">Carbs</p>
              </div>
              <div>
                <p className="font-bold text-white font-[family-name:var(--font-display)]">{totals.total_fat}g</p>
                <p className="text-xs text-text-dim">Fat</p>
              </div>
            </div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="bg-white/[0.03] border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="flex-1 text-sm font-medium text-white bg-transparent border-b border-border focus:border-white/30 focus:outline-none pb-0.5"
                  placeholder="Food name"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="ml-2 p-1 text-white/20 hover:text-white/60 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-dim">Servings</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleServingsChange(index, (item.servings || 1) - 1)}
                    disabled={(item.servings || 1) <= 1}
                    className="w-7 h-7 flex items-center justify-center text-white/60 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm text-white font-medium tabular-nums">
                    {item.servings || 1}
                  </span>
                  <button
                    onClick={() => handleServingsChange(index, (item.servings || 1) + 1)}
                    className="w-7 h-7 flex items-center justify-center text-white/60 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-text-dim">Cal</label>
                  <input
                    type="number"
                    value={item.calories}
                    onChange={(e) => updateItem(index, 'calories', Number(e.target.value))}
                    className="w-full text-sm text-white bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim">Protein</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.protein}
                    onChange={(e) => updateItem(index, 'protein', Number(e.target.value))}
                    className="w-full text-sm text-white bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim">Carbs</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.carbs}
                    onChange={(e) => updateItem(index, 'carbs', Number(e.target.value))}
                    className="w-full text-sm text-white bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim">Fat</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.fat}
                    onChange={(e) => updateItem(index, 'fat', Number(e.target.value))}
                    className="w-full text-sm text-white bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
              </div>
              <input
                type="text"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                className="w-full text-xs text-text-dim bg-transparent border-b border-border focus:border-white/30 focus:outline-none pb-0.5"
                placeholder="Quantity (e.g., 1 cup)"
              />
            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-1 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>

          {error && (
            <div className="bg-white/[0.04] text-white/60 text-sm p-3 rounded-lg">{error}</div>
          )}

          {/* Portion adjuster */}
          <div className="flex justify-center">
            <PortionAdjuster
              currentMultiplier={portionMultiplier}
              onChange={handlePortionChange}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-text-dim bg-transparent border border-border rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-white/[0.10] rounded-xl hover:bg-white/[0.16] disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-white/[0.08]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
