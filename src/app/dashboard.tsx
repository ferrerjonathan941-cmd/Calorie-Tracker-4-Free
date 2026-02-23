'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import FoodCapture from '@/components/FoodCapture'
import DailyLog from '@/components/DailyLog'
import EditEntryModal from '@/components/EditEntryModal'
import DateNavigator from '@/components/DateNavigator'
import HistorySummaryList from '@/components/HistorySummaryList'
import MonthCalendarView from '@/components/MonthCalendarView'
import AllTimeSummaryView from '@/components/AllTimeSummaryView'
import SwipeContainer from '@/components/SwipeContainer'
import PageIndicator from '@/components/PageIndicator'
import { FoodEntry, DailySummary } from '@/lib/types'

const DotScreenShader = dynamic(
  () => import('@/components/ui/dot-shader-background').then((mod) => mod.DotScreenShader),
  { ssr: false }
)

type View = 'home' | 'logs' | 'macros' | 'settings'
type HistoryTab = 'day' | 'week' | 'month' | 'all'

const viewMap: View[] = ['home', 'logs', 'macros', 'settings']

const historyTabs: { key: HistoryTab; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All Time' },
]

interface DashboardProps {
  initialEntries: FoodEntry[]
  userEmail: string
}

export default function Dashboard({ initialEntries, userEmail }: DashboardProps) {
  const [viewIndex, setViewIndex] = useState(0)
  const view = viewMap[viewIndex]
  const [entries, setEntries] = useState<FoodEntry[]>(() => {
    const now = new Date()
    const dayStart = startOfDay(now)
    const dayEnd = endOfDay(now)
    return initialEntries.filter(e => {
      const t = new Date(e.logged_at).getTime()
      return t >= dayStart.getTime() && t <= dayEnd.getTime()
    })
  })
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null)

  // Track FoodCapture phase for disabling swipe
  const [capturePhase, setCapturePhase] = useState<string>('input')
  const isOverlayActive = capturePhase !== 'input' || editingEntry !== null

  // History state
  const [historyTab, setHistoryTab] = useState<HistoryTab>('day')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [historyEntries, setHistoryEntries] = useState<FoodEntry[]>([])
  const [historySummaries, setHistorySummaries] = useState<DailySummary[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Clean up old images on mount (fire-and-forget)
  useEffect(() => {
    fetch('/api/cleanup-images', { method: 'POST' }).catch(() => {})
  }, [])

  // Fetch history when logs view is active and tab/date changes
  useEffect(() => {
    if (viewIndex !== 1) return

    const isToday = isSameDay(selectedDate, new Date())

    if (historyTab === 'day' && isToday) {
      setHistoryEntries(entries)
      setLoadingHistory(false)
      return
    }

    const controller = new AbortController()
    setLoadingHistory(true)

    const fetchHistory = async () => {
      try {
        let from: string
        let to: string
        const useSummary = historyTab !== 'day'

        if (historyTab === 'day') {
          from = startOfDay(selectedDate).toISOString()
          to = endOfDay(selectedDate).toISOString()
        } else if (historyTab === 'week') {
          from = startOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString()
          to = endOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString()
        } else if (historyTab === 'month') {
          from = startOfMonth(selectedDate).toISOString()
          to = endOfMonth(selectedDate).toISOString()
        } else {
          // all time
          from = ''
          to = ''
        }

        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (useSummary) params.set('summary', 'true')
        params.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone)

        const res = await fetch(`/api/entries?${params}`, { signal: controller.signal })
        if (!res.ok) throw new Error()
        const data = await res.json()

        if (useSummary) {
          setHistorySummaries(data.summaries || [])
        } else {
          setHistoryEntries(data.entries || [])
        }
      } catch {
        if (!controller.signal.aborted) {
          setHistoryEntries([])
          setHistorySummaries([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistory(false)
        }
      }
    }

    fetchHistory()
    return () => controller.abort()
  }, [viewIndex, historyTab, selectedDate, entries])

  const handleNewEntry = (entry: FoodEntry) => {
    setEntries((prev) => [entry, ...prev])
  }

  const handleDeleteEntry = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        setHistoryEntries((prev) => prev.filter((e) => e.id !== id))
      }
    } catch {}
  }, [])

  const handleEditSave = useCallback((updated: FoodEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setHistoryEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setEditingEntry(null)
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

  const isDayToday = historyTab === 'day' && isSameDay(selectedDate, new Date())

  return (
    <div className="h-screen overflow-hidden bg-bg flex flex-col relative">
      {/* Dot shader background */}
      <div className="absolute inset-0 h-full w-full touch-none">
        <DotScreenShader />
      </div>

      {/* Page indicator */}
      <div className="relative z-10">
        <PageIndicator count={4} activeIndex={viewIndex} />
      </div>

      {/* Main content — swipeable pages */}
      <div className="flex-1 relative z-10 min-h-0">
        <SwipeContainer
          currentIndex={viewIndex}
          onIndexChange={setViewIndex}
          disabled={isOverlayActive}
        >
          {/* ── Page 0: Home ── */}
          <div className="h-full">
            <div className="flex flex-col h-full px-4 pointer-events-none">
              <div className="flex-1 flex items-center justify-center">
                <h1 className="text-3xl font-light text-white tracking-tight">
                  What did you eat?
                </h1>
              </div>
              <div className="w-full max-w-lg mx-auto pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-auto">
                <FoodCapture onNewEntry={handleNewEntry} onPhaseChange={setCapturePhase} />
              </div>
            </div>
          </div>

          {/* ── Page 1: Logs ── */}
          <div className="h-full overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="w-full max-w-lg mx-auto px-4 pt-6 space-y-4">
              <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
                Log
              </h1>

              {/* Period tabs */}
              <div className="flex gap-1 bg-surface/60 backdrop-blur rounded-xl p-1 border border-white/[0.06]">
                {historyTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setHistoryTab(tab.key)
                      setSelectedDate(new Date())
                    }}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      historyTab === tab.key
                        ? 'bg-white/[0.10] text-white'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date navigator (hidden for "all") */}
              {historyTab !== 'all' && historyTab !== 'month' && (
                <DateNavigator
                  mode={historyTab}
                  date={selectedDate}
                  onChange={setSelectedDate}
                />
              )}

              {/* Content */}
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                </div>
              ) : historyTab === 'day' ? (
                <DailyLog
                  entries={isDayToday ? entries : historyEntries}
                  onDelete={handleDeleteEntry}
                  onEdit={setEditingEntry}
                  isToday={isDayToday}
                />
              ) : historyTab === 'month' ? (
                <MonthCalendarView
                  summaries={historySummaries}
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date)
                    setHistoryTab('day')
                  }}
                  onMonthChange={setSelectedDate}
                />
              ) : historyTab === 'all' ? (
                <AllTimeSummaryView
                  summaries={historySummaries}
                  onSelectDate={(date) => {
                    setSelectedDate(date)
                    setHistoryTab('day')
                  }}
                />
              ) : (
                <HistorySummaryList summaries={historySummaries} />
              )}
            </div>
          </div>

          {/* ── Page 2: Macros ── */}
          <div className="h-full overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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

            </div>
          </div>

          {/* ── Page 3: Settings ── */}
          <div className="h-full overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="w-full max-w-lg mx-auto px-4 pt-6 space-y-6">
              <h1 className="text-2xl font-semibold text-white font-[family-name:var(--font-display)]">
                Settings
              </h1>

              <div className="bg-surface/80 backdrop-blur rounded-2xl border border-white/[0.06] p-4">
                <p className="text-xs text-text-dim">Account</p>
                <p className="text-sm text-white mt-1">{userEmail}</p>
              </div>
            </div>
          </div>
        </SwipeContainer>
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
