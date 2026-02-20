'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Home, ClipboardList, Target, Settings } from 'lucide-react'
import FoodCapture from '@/components/FoodCapture'
import DailyLog from '@/components/DailyLog'
import EditEntryModal from '@/components/EditEntryModal'
import SavedMeals from '@/components/SavedMeals'
import { MenuBar } from '@/components/ui/bottom-menu'
import { FoodEntry, SavedMeal } from '@/lib/types'

const DotScreenShader = dynamic(
  () => import('@/components/ui/dot-shader-background').then((mod) => mod.DotScreenShader),
  { ssr: false }
)

type View = 'home' | 'logs' | 'macros' | 'settings'

const menuItems = [
  { icon: Home, label: 'Home' },
  { icon: ClipboardList, label: 'Logs' },
  { icon: Target, label: 'Macros' },
  { icon: Settings, label: 'Settings' },
]

const viewMap: View[] = ['home', 'logs', 'macros', 'settings']

interface DashboardProps {
  initialEntries: FoodEntry[]
  initialSavedMeals?: unknown[]
  userEmail: string
}

export default function Dashboard({ initialEntries, userEmail }: DashboardProps) {
  const [view, setView] = useState<View>('home')
  const [entries, setEntries] = useState<FoodEntry[]>(initialEntries)
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([])
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null)

  useEffect(() => {
    fetch('/api/saved-meals')
      .then((res) => res.json())
      .then((data) => setSavedMeals(data))
      .catch(() => {})
  }, [])

  const handleNewEntry = (entry: FoodEntry) => {
    setEntries((prev) => [entry, ...prev])
  }

  const handleDeleteEntry = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
      }
    } catch {}
  }, [])

  const handleEditSave = useCallback((updated: FoodEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setEditingEntry(null)
  }, [])

  const handleQuickLog = useCallback(async (meal: SavedMeal) => {
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: meal.meal_type,
          food_items: meal.food_items,
          total_calories: meal.total_calories,
          total_protein: meal.total_protein,
          total_carbs: meal.total_carbs,
          total_fat: meal.total_fat,
        }),
      })
      if (res.ok) {
        const entry = await res.json()
        setEntries((prev) => [entry, ...prev])
        // Increment use count
        await fetch(`/api/saved-meals/${meal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ increment_use_count: true }),
        })
      }
    } catch {}
  }, [])

  const handleDeleteMeal = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/saved-meals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedMeals((prev) => prev.filter((m) => m.id !== id))
      }
    } catch {}
  }, [])

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
    <div className="h-screen overflow-hidden bg-bg flex flex-col relative">
      {/* Dot shader background */}
      <div className="absolute inset-0 h-full w-full touch-none">
        <DotScreenShader />
      </div>

      {/* Main content */}
      <div className={`flex-1 relative z-10 pb-[calc(5rem+env(safe-area-inset-bottom))] ${view === 'home' ? 'pointer-events-none overflow-hidden' : 'overflow-y-auto'}`}>
        {/* ── Home View ── */}
        {view === 'home' && (
          <div className="flex flex-col h-full px-4">
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-3xl font-light text-white tracking-tight">
                What did you eat?
              </h1>
            </div>
            <div className="w-full max-w-lg mx-auto pb-6 pointer-events-auto">
              <FoodCapture onNewEntry={handleNewEntry} />
            </div>
          </div>
        )}

        {/* ── Logs View ── */}
        {view === 'logs' && (
          <div className="w-full max-w-lg mx-auto px-4 pt-6 space-y-4">
            <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
              Today&apos;s Log
            </h1>

            {savedMeals.length > 0 && (
              <SavedMeals
                meals={savedMeals}
                onQuickLog={handleQuickLog}
                onDelete={handleDeleteMeal}
              />
            )}

            <DailyLog
              entries={entries}
              onDelete={handleDeleteEntry}
              onEdit={setEditingEntry}
            />
          </div>
        )}

        {/* ── Macros View ── */}
        {view === 'macros' && (
          <div className="w-full max-w-lg mx-auto px-4 pt-6 space-y-6">
            <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
              Macros
            </h1>

            {/* Today's macro summary */}
            <div className="bg-surface/80 backdrop-blur rounded-2xl border border-white/[0.06] p-5 space-y-4">
              <p className="text-sm text-text-dim">Today</p>
              <div className="text-center">
                <p className="text-5xl font-bold text-white font-[family-name:var(--font-display)]">
                  {Math.round(totals.calories)}
                </p>
                <p className="text-sm text-text-dim mt-1">calories</p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-2">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all"
                      style={{ width: `${Math.min((totals.protein / 150) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
                    {Math.round(totals.protein)}g
                  </p>
                  <p className="text-xs text-text-dim">Protein</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-2">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all"
                      style={{ width: `${Math.min((totals.carbs / 250) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
                    {Math.round(totals.carbs)}g
                  </p>
                  <p className="text-xs text-text-dim">Carbs</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-2">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all"
                      style={{ width: `${Math.min((totals.fat / 80) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
                    {Math.round(totals.fat)}g
                  </p>
                  <p className="text-xs text-text-dim">Fat</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-dim text-center">
              Goal setting coming soon
            </p>
          </div>
        )}

        {/* ── Settings View ── */}
        {view === 'settings' && (
          <div className="w-full max-w-lg mx-auto px-4 pt-6 space-y-6">
            <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
              Settings
            </h1>

            <div className="bg-surface/80 backdrop-blur rounded-2xl border border-white/[0.06] p-4">
              <p className="text-xs text-text-dim">Account</p>
              <p className="text-sm text-white mt-1">{userEmail}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom menu */}
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MenuBar
            items={menuItems}
            activeIndex={viewMap.indexOf(view)}
            onSelect={(i) => setView(viewMap[i])}
          />
        </div>
      </div>

      {/* Edit modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={handleEditSave}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  )
}
