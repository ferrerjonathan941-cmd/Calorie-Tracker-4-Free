'use client'

import { useMemo, createContext, useContext } from 'react'
import {
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  Calendar as AriaCalendar,
  Heading as AriaHeading,
  Button as AriaButton,
} from 'react-aria-components'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarDate, getLocalTimeZone, today, isToday as _isToday } from '@internationalized/date'
import { DailySummary } from '@/lib/types'

interface MonthCalendarViewProps {
  summaries: DailySummary[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onMonthChange: (date: Date) => void
}

// Context to pass the summary map into cells
const SummaryMapContext = createContext<Map<string, DailySummary>>(new Map())

function jsDateToCalendarDate(d: Date): CalendarDate {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function getCellClassName({
  isSelected,
  isToday,
  isDisabled,
  isUnavailable,
  isOutsideMonth,
  isHovered,
}: {
  isSelected: boolean
  isToday: boolean
  isDisabled: boolean
  isUnavailable: boolean
  isOutsideMonth: boolean
  isHovered: boolean
}) {
  const base = 'flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors'
  if (isSelected) return `${base} bg-accent text-white font-semibold`
  if (isDisabled || isUnavailable) return `${base} text-white/20 cursor-default${isUnavailable ? ' line-through' : ''}`
  if (isToday) return `${base} bg-white/[0.08] font-semibold text-white`
  if (isOutsideMonth) return `${base} text-white/15`
  if (isHovered) return `${base} bg-white/[0.06] text-white`
  return `${base} text-white/80`
}

function DottedCalendarCell({ date }: { date: CalendarDate }) {
  const summaryMap = useContext(SummaryMapContext)
  const isToday = _isToday(date, getLocalTimeZone())
  const key = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const hasEntries = summaryMap.has(key)

  return (
    <AriaCalendarCell date={date} className="p-0.5 text-center">
      {({ isSelected, isDisabled, isUnavailable, isOutsideVisibleRange, isHovered }) => (
        <div className="relative flex flex-col items-center">
          <span
            className={getCellClassName({
              isSelected,
              isToday,
              isDisabled,
              isUnavailable,
              isOutsideMonth: isOutsideVisibleRange,
              isHovered,
            })}
          >
            {date.day}
          </span>
          {hasEntries && !isOutsideVisibleRange && (
            <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent" />
          )}
        </div>
      )}
    </AriaCalendarCell>
  )
}

export default function MonthCalendarView({
  summaries,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: MonthCalendarViewProps) {
  const summaryMap = useMemo(() => {
    const map = new Map<string, DailySummary>()
    for (const s of summaries) {
      map.set(s.date, s)
    }
    return map
  }, [summaries])

  const focusedValue = jsDateToCalendarDate(selectedDate)
  const todayDate = today(getLocalTimeZone())

  // Compute monthly averages
  const avg = useMemo(() => {
    if (summaries.length === 0) return null
    const days = summaries.length
    return {
      calories: Math.round(summaries.reduce((s, d) => s + d.total_calories, 0) / days),
      protein: Math.round(summaries.reduce((s, d) => s + d.total_protein, 0) / days),
      carbs: Math.round(summaries.reduce((s, d) => s + d.total_carbs, 0) / days),
      fat: Math.round(summaries.reduce((s, d) => s + d.total_fat, 0) / days),
      days,
    }
  }, [summaries])

  return (
    <div className="space-y-4">
      <div className="bg-surface/80 backdrop-blur rounded-2xl border border-white/[0.06] p-4">
        <SummaryMapContext.Provider value={summaryMap}>
          <AriaCalendar
            aria-label="Month calendar"
            focusedValue={focusedValue}
            onFocusChange={(cd) => {
              if (cd.month !== focusedValue.month || cd.year !== focusedValue.year) {
                onMonthChange(new Date(cd.year, cd.month - 1, cd.day))
              }
            }}
            maxValue={todayDate}
            onChange={(cd) => {
              onSelectDate(new Date(cd.year, cd.month - 1, cd.day))
            }}
          >
            <header className="flex w-full items-center justify-between pb-3">
              <AriaHeading className="text-sm font-medium text-white" />
              <div className="flex items-center gap-1">
                <AriaButton
                  slot="previous"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </AriaButton>
                <AriaButton
                  slot="next"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </AriaButton>
              </div>
            </header>
            <AriaCalendarGrid className="w-full border-collapse">
              <AriaCalendarGridHeader>
                {(day) => (
                  <AriaCalendarHeaderCell className="size-9 text-xs font-medium text-text-dim text-center">
                    {day}
                  </AriaCalendarHeaderCell>
                )}
              </AriaCalendarGridHeader>
              <AriaCalendarGridBody>
                {(date) => <DottedCalendarCell date={date} />}
              </AriaCalendarGridBody>
            </AriaCalendarGrid>
          </AriaCalendar>
        </SummaryMapContext.Provider>
      </div>

      {/* Monthly averages */}
      {avg && (
        <div className="bg-gradient-to-b from-surface to-surface-2 rounded-2xl shadow-sm border border-border p-4">
          <h2 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-display)]">
            Monthly Average
          </h2>
          <p className="text-xs text-text-dim mb-3">{avg.days} days tracked</p>
          <div className="text-center mb-3">
            <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
              {avg.calories.toLocaleString()}
            </p>
            <p className="text-xs text-text-dim">Calories / Day</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">{avg.protein}g</p>
              <p className="text-xs text-text-dim">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">{avg.carbs}g</p>
              <p className="text-xs text-text-dim">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white font-[family-name:var(--font-display)]">{avg.fat}g</p>
              <p className="text-xs text-text-dim">Fat</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
