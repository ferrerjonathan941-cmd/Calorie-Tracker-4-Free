'use client'

import { useMemo, useState } from 'react'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { DailySummary } from '@/lib/types'

interface AllTimeSummaryViewProps {
  summaries: DailySummary[]
  onSelectDate: (date: Date) => void
}

function calculateStreaks(summaries: DailySummary[]) {
  if (summaries.length === 0) return { current: 0, longest: 0 }

  // Sort ascending by date
  const sorted = [...summaries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let longest = 1
  let streak = 1

  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(sorted[i].date),
      parseISO(sorted[i - 1].date)
    )
    if (diff === 1) {
      streak++
      if (streak > longest) longest = streak
    } else {
      streak = 1
    }
  }

  // Current streak: count backward from today/yesterday
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const yesterdayStr = format(
    new Date(today.getTime() - 86400000),
    'yyyy-MM-dd'
  )

  const lastDate = sorted[sorted.length - 1].date
  let current = 0
  if (lastDate === todayStr || lastDate === yesterdayStr) {
    current = 1
    for (let i = sorted.length - 2; i >= 0; i--) {
      const diff = differenceInCalendarDays(
        parseISO(sorted[i + 1].date),
        parseISO(sorted[i].date)
      )
      if (diff === 1) {
        current++
      } else {
        break
      }
    }
  }

  return { current, longest }
}

interface MonthGroup {
  key: string
  label: string
  summaries: DailySummary[]
  avgCalories: number
  daysTracked: number
}

export default function AllTimeSummaryView({
  summaries,
  onSelectDate,
}: AllTimeSummaryViewProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  const { streaks, totalCalories, monthGroups } = useMemo(() => {
    const streaks = calculateStreaks(summaries)
    const totalCalories = summaries.reduce((s, d) => s + d.total_calories, 0)

    // Group by month (descending)
    const groupMap = new Map<string, DailySummary[]>()
    for (const s of summaries) {
      const d = parseISO(s.date)
      const key = format(d, 'yyyy-MM')
      const existing = groupMap.get(key) || []
      existing.push(s)
      groupMap.set(key, existing)
    }

    const monthGroups: MonthGroup[] = Array.from(groupMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, days]) => ({
        key,
        label: format(parseISO(`${key}-01`), 'MMMM yyyy'),
        summaries: days.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        avgCalories: Math.round(
          days.reduce((s, d) => s + d.total_calories, 0) / days.length
        ),
        daysTracked: days.length,
      }))

    return { streaks, totalCalories, monthGroups }
  }, [summaries])

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 text-center">
        <p className="text-text-dim">No entries yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats card */}
      <div className="bg-gradient-to-b from-surface to-surface-2 rounded-2xl shadow-sm border border-border p-4">
        <h2 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-display)]">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
              {summaries.length}
            </p>
            <p className="text-xs text-text-dim">Days Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
              {Math.round(totalCalories).toLocaleString()}
            </p>
            <p className="text-xs text-text-dim">Total Calories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent font-[family-name:var(--font-display)]">
              {streaks.current}
            </p>
            <p className="text-xs text-text-dim">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
              {streaks.longest}
            </p>
            <p className="text-xs text-text-dim">Longest Streak</p>
          </div>
        </div>
      </div>

      {/* Monthly groups */}
      {monthGroups.map((group) => {
        const isExpanded = expandedMonths.has(group.key)
        return (
          <div key={group.key} className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <button
              onClick={() => toggleMonth(group.key)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div>
                <p className="text-sm font-medium text-white">{group.label}</p>
                <p className="text-xs text-text-dim mt-0.5">
                  {group.avgCalories.toLocaleString()} cal/day avg &middot; {group.daysTracked} days
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/40 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {group.summaries.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => onSelectDate(parseISO(day.date))}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-3 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-white">
                        {format(parseISO(day.date), 'EEE, MMM d')}
                      </p>
                      <span className="text-xs text-text-dim">
                        {day.entry_count} {day.entry_count === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <p className="font-bold text-white font-[family-name:var(--font-display)]">
                          {Math.round(day.total_calories)}
                        </p>
                        <p className="text-xs text-text-dim">Cal</p>
                      </div>
                      <div>
                        <p className="font-bold text-white font-[family-name:var(--font-display)]">
                          {Math.round(day.total_protein)}g
                        </p>
                        <p className="text-xs text-text-dim">P</p>
                      </div>
                      <div>
                        <p className="font-bold text-white font-[family-name:var(--font-display)]">
                          {Math.round(day.total_carbs)}g
                        </p>
                        <p className="text-xs text-text-dim">C</p>
                      </div>
                      <div>
                        <p className="font-bold text-white font-[family-name:var(--font-display)]">
                          {Math.round(day.total_fat)}g
                        </p>
                        <p className="text-xs text-text-dim">F</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
