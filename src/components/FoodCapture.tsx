'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Paperclip, Loader2, X, Plus, Minus, Trash2, Check, RotateCcw, ArrowUp, ScanEye } from 'lucide-react'
import { FoodEntry, FoodItem, FoodAnalysis } from '@/lib/types'
import PortionAdjuster from '@/components/PortionAdjuster'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

type Phase = 'input' | 'analyzing' | 'draft'

interface FoodCaptureProps {
  onNewEntry: (entry: FoodEntry) => void
  onPhaseChange?: (phase: Phase) => void
}

export default function FoodCapture({ onNewEntry, onPhaseChange }: FoodCaptureProps) {
  // Input phase state
  const mealType = 'snack'
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFileRef = useRef<File | null>(null)
  const base64Ref = useRef<string | null>(null)

  // Phase state
  const [phase, setPhase] = useState<Phase>('input')
  const [error, setError] = useState<string | null>(null)

  // Notify parent of phase changes
  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  // Draft phase state
  const [draftAnalysis, setDraftAnalysis] = useState<FoodAnalysis | null>(null)
  const [draftItems, setDraftItems] = useState<FoodItem[]>([])
  const [baseItems, setBaseItems] = useState<FoodItem[]>([])
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null)
  const [draftNotes, setDraftNotes] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [portionMultiplier, setPortionMultiplier] = useState(1.0)
  const [saving, setSaving] = useState(false)

  // Mixed dish re-analyze state
  const [additionalDescription, setAdditionalDescription] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)

  // Missed items re-scan state
  const [missedMode, setMissedMode] = useState(false)
  const [missedHint, setMissedHint] = useState('')
  const [findingMissed, setFindingMissed] = useState(false)
  const [missedMessage, setMissedMessage] = useState<string | null>(null)

  // Global paste handler: allow pasting images anywhere during input phase
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (phase !== 'input') return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleFileSelect(file)
          return
        }
      }
    }
    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])


  const resetToInput = () => {
    setPhase('input')
    setPreview(null)
    setDescription('')
    setDraftAnalysis(null)
    setDraftItems([])
    setBaseItems([])
    setDraftImageUrl(null)
    setDraftNotes(null)
    setWarnings([])
    setPortionMultiplier(1.0)
    setError(null)
    setAdditionalDescription('')
    setMissedMode(false)
    setMissedHint('')
    setFindingMissed(false)
    setMissedMessage(null)
    pendingFileRef.current = null
    base64Ref.current = null
  }

  const submitAnalysis = async (file?: File, extraDescription?: string) => {
    setPhase('analyzing')
    setError(null)

    const formData = new FormData()
    if (file) {
      formData.append('image', file)
    }
    formData.append('mealType', mealType)
    formData.append('draftMode', 'true')

    const desc = extraDescription || description.trim()
    if (desc) {
      formData.append('description', desc)
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        let errorMsg = 'Failed to analyze food'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json()
      const analysis: FoodAnalysis = data.analysis
      setDraftAnalysis(analysis)
      setDraftItems(analysis.food_items.map((item) => ({ ...item })))
      setBaseItems(analysis.food_items.map((item) => ({ ...item })))
      setDraftImageUrl(data.image_url)
      setDraftNotes(data.notes)
      setWarnings(data.warnings || [])
      setPortionMultiplier(1.0)
      setPhase('draft')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('input')
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      // Store base64 for potential re-analysis
      base64Ref.current = result.split(',')[1] || null
    }
    reader.readAsDataURL(file)

    pendingFileRef.current = file
  }

  const handleSend = () => {
    const hasImage = !!pendingFileRef.current
    const hasText = !!description.trim()
    if (!hasImage && !hasText) return
    submitAnalysis(pendingFileRef.current || undefined, description.trim() || undefined)
  }

  const handleReanalyze = async () => {
    if (!additionalDescription.trim()) return
    setReanalyzing(true)
    const combinedDescription = `${description}. Additional details: ${additionalDescription}`
    await submitAnalysis(pendingFileRef.current || undefined, combinedDescription)
    setReanalyzing(false)
  }

  const handleFindMissed = async () => {
    if (!pendingFileRef.current) return
    setFindingMissed(true)
    setMissedMessage(null)
    setError(null)

    const formData = new FormData()
    formData.append('image', pendingFileRef.current)
    formData.append('mealType', mealType)
    formData.append('draftMode', 'true')
    formData.append('findMissed', 'true')
    formData.append('existingItems', JSON.stringify(draftItems.map((item) => item.name)))
    if (missedHint.trim()) {
      formData.append('description', missedHint.trim())
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        let errorMsg = 'Failed to re-scan'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json()

      if (data.noNewItems) {
        setMissedMessage('No additional items found. Try adding a hint about what was missed.')
        setFindingMissed(false)
        return
      }

      const newItems: FoodItem[] = data.analysis.food_items
      setDraftItems((prev) => [...prev, ...newItems])
      setBaseItems((prev) => [...prev, ...newItems])
      setWarnings((prev) => [...prev, ...(data.warnings || [])])
      setPortionMultiplier(1.0)
      setMissedMode(false)
      setMissedHint('')
      setMissedMessage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setFindingMissed(false)
  }

  // Draft item management
  const updateDraftItem = (index: number, field: keyof FoodItem, value: string | number) => {
    setDraftItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setBaseItems(draftItems.map((item) => ({ ...item })))
    setPortionMultiplier(1.0)
  }

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleServingsChange = (index: number, newServings: number) => {
    if (newServings < 1) return
    const currentItem = draftItems[index]
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

    setDraftItems((prev) => prev.map((item, i) => (i === index ? scaledItem : item)))
    setBaseItems((prev) => prev.map((item, i) => (i === index ? scaledItem : item)))
    setPortionMultiplier(1.0)
  }

  const addDraftItem = () => {
    setDraftItems((prev) => [
      ...prev,
      { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '1 serving' },
    ])
  }

  const handlePortionChange = (multiplier: number) => {
    setPortionMultiplier(multiplier)
    setDraftItems(
      baseItems.map((item) => ({
        ...item,
        calories: Math.round(item.calories * multiplier),
        protein: Math.round(item.protein * multiplier * 10) / 10,
        carbs: Math.round(item.carbs * multiplier * 10) / 10,
        fat: Math.round(item.fat * multiplier * 10) / 10,
      }))
    )
  }

  const recalculateTotals = () => ({
    total_calories: draftItems.reduce((sum, item) => sum + item.calories, 0),
    total_protein: Math.round(draftItems.reduce((sum, item) => sum + item.protein, 0) * 10) / 10,
    total_carbs: Math.round(draftItems.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10,
    total_fat: Math.round(draftItems.reduce((sum, item) => sum + item.fat, 0) * 10) / 10,
  })

  const handleConfirm = async () => {
    setSaving(true)
    setError(null)

    const totals = recalculateTotals()

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: draftImageUrl,
          meal_type: mealType,
          food_items: draftItems,
          ...totals,
          notes: draftNotes,
          logged_at: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save entry')
      }

      const entry = await res.json()
      onNewEntry(entry)
      setSaving(false)
      resetToInput()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const totals = recalculateTotals()

  // ─── Draft Phase ───
  if (phase === 'draft') {
    return (
      <div className="fixed inset-0 bg-bg z-[60] flex flex-col pointer-events-auto">
        <div className="flex-1 overflow-y-auto pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] px-4">
          <div className="w-full max-w-lg mx-auto">
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-text">Review & Edit</h2>
                <button onClick={resetToInput} className="p-1.5 text-text-dim hover:text-text rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-r from-surface-2 to-surface-3 rounded-xl p-3 mb-3">
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

              {/* Image thumbnail */}
              {preview && (
                <img src={preview} alt="Food" className="w-full h-32 object-cover rounded-xl mb-3" />
              )}


              {/* Mixed dish prompt */}
              {draftAnalysis?.needsInput && (
                <div className="mb-3 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                  <p className="text-sm text-white/80 font-medium mb-2">
                    This looks like a mixed dish — can you describe the ingredients?
                  </p>
                  <textarea
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                    placeholder="e.g., rice, black beans, grilled chicken, pico de gallo, sour cream"
                    rows={2}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-text-dim resize-none focus:outline-none focus:ring-2 focus:ring-white/20 mb-2"
                  />
                  <button
                    onClick={handleReanalyze}
                    disabled={reanalyzing || !additionalDescription.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/[0.08] rounded-lg hover:bg-white/[0.14] disabled:opacity-50 transition-colors"
                  >
                    {reanalyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Re-analyze with details
                  </button>
                </div>
              )}

              {/* Editable food items */}
              <div className="space-y-2 mb-3">
                {draftItems.map((item, index) => (
                  <div key={index} className="bg-white/[0.03] border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateDraftItem(index, 'name', e.target.value)}
                        className="flex-1 text-sm font-medium text-white bg-transparent border-b border-border focus:border-white/30 focus:outline-none pb-0.5"
                        placeholder="Food name"
                      />
                      <button
                        onClick={() => removeDraftItem(index)}
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
                          onChange={(e) => updateDraftItem(index, 'calories', Number(e.target.value))}
                          className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-dim">Protein</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.protein}
                          onChange={(e) => updateDraftItem(index, 'protein', Number(e.target.value))}
                          className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-dim">Carbs</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.carbs}
                          onChange={(e) => updateDraftItem(index, 'carbs', Number(e.target.value))}
                          className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-dim">Fat</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.fat}
                          onChange={(e) => updateDraftItem(index, 'fat', Number(e.target.value))}
                          className="w-full text-sm text-text bg-white/[0.04] border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => updateDraftItem(index, 'quantity', e.target.value)}
                      className="w-full text-xs text-text-dim bg-transparent border-b border-border focus:border-white/30 focus:outline-none pb-0.5"
                      placeholder="Quantity (e.g., 1 cup)"
                    />
                  </div>
                ))}
              </div>

              {/* Missed something re-scan */}
              {preview && !missedMode && (
                <button
                  onClick={() => { setMissedMode(true); setMissedMessage(null) }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-1"
                >
                  <ScanEye className="w-4 h-4" />
                  Missed something? Tap to re-scan
                </button>
              )}

              {missedMode && (
                <div className="mb-3 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/80 font-medium">What did we miss?</p>
                    <button
                      onClick={() => { setMissedMode(false); setMissedHint(''); setMissedMessage(null) }}
                      className="p-0.5 text-white/30 hover:text-white/60 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={missedHint}
                    onChange={(e) => setMissedHint(e.target.value)}
                    placeholder="e.g., there's a drink behind the plate"
                    rows={2}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-text-dim resize-none focus:outline-none focus:ring-2 focus:ring-white/20 mb-2"
                  />
                  <button
                    onClick={handleFindMissed}
                    disabled={findingMissed}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/[0.08] rounded-lg hover:bg-white/[0.14] disabled:opacity-50 transition-colors"
                  >
                    {findingMissed ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ScanEye className="w-3.5 h-3.5" />
                    )}
                    Re-scan photo
                  </button>
                  {missedMessage && (
                    <p className="mt-2 text-xs text-white/50">{missedMessage}</p>
                  )}
                </div>
              )}

              <button
                onClick={addDraftItem}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors mb-3"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>

              {error && (
                <div className="mb-3 bg-white/[0.04] text-white/60 text-sm p-3 rounded-lg">{error}</div>
              )}

              {/* Portion adjuster */}
              <div className="mb-3 flex justify-center">
                <PortionAdjuster currentMultiplier={portionMultiplier} onChange={handlePortionChange} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetToInput}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-text-dim bg-transparent border border-border rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving || draftItems.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-white/[0.10] border border-white/[0.08] rounded-xl hover:bg-white/[0.16] disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Analyzing Phase ───
  if (phase === 'analyzing') {
    return (
      <div className="fixed inset-0 bg-bg z-[60] flex flex-col pointer-events-auto">
        <div className="flex-1 overflow-y-auto pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] px-4 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-4">
              <h2 className="text-lg font-semibold text-text mb-3">Log Food</h2>
              {preview ? (
                <div className="mb-4 relative">
                  <img src={preview} alt="Food preview" className="w-full h-48 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Analyzing food...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 bg-white/[0.03] rounded-xl p-6 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
                    <p className="text-sm text-text-dim">Looking up nutrition facts...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Input Phase ───
  return (
    <div className="bg-[#111111] rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.24)] border border-white/[0.06] p-4">
      {/* Borderless textarea */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && (description.trim() || pendingFileRef.current)) {
            e.preventDefault()
            handleSend()
          }
        }}
        onPaste={(e) => {
          const items = e.clipboardData?.items
          if (!items) return
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              e.preventDefault()
              const file = item.getAsFile()
              if (file) handleFileSelect(file)
              return
            }
          }
        }}
        placeholder={preview ? 'Add context or describe what you ate (optional)...' : 'Snap a photo, paste, or describe what you ate...'}
        rows={2}
        className="w-full px-1 py-2 bg-transparent border-none text-base text-white resize-none focus:outline-none transparent-placeholder"
      />
      {description.trim() && !preview && (
        <p className="text-xs text-text-dim mb-2 px-1">
          Press Enter to send
        </p>
      )}

      {/* Image preview */}
      {preview && (
        <div className="mb-3 relative">
          <img src={preview} alt="Food preview" className="w-full h-48 object-cover rounded-xl" />
          <button
            onClick={() => { setPreview(null); pendingFileRef.current = null; base64Ref.current = null }}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-3 bg-white/[0.04] text-white/60 text-sm p-3 rounded-lg">{error}</div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture')
              fileInputRef.current.click()
            }
          }}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-white/[0.04] text-white hover:bg-white/[0.08] transition-colors"
          title="Upload from library"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        {description.trim() || preview ? (
          <LiquidButton
            size="icon"
            onClick={handleSend}
            className="h-14 w-14 rounded-full text-white [&_svg]:!size-7"
            title="Send"
          >
            <ArrowUp className="w-7 h-7" />
          </LiquidButton>
        ) : (
          <LiquidButton
            size="icon"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.capture = 'environment'
                fileInputRef.current.click()
              }
            }}
            className="h-14 w-14 rounded-full text-white [&_svg]:!size-7"
            title="Take photo"
          >
            <Camera className="w-7 h-7" />
          </LiquidButton>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
        className="hidden"
      />
    </div>
  )
}
