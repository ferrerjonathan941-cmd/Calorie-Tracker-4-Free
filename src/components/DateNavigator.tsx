'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isAfter,
  isSameDay,
  startOfDay,
} from 'date-fns'

interface DateNavigatorProps {
  mode: 'day' | 'week' | 'month'
  date: Date
  onChange: (date: Date) => void
}

export default function DateNavigator({ mode, date, onChange }: DateNavigatorProps) {
  const today = startOfDay(new Date())

  const canGoForward = () => {
    if (mode === 'day') return !isSameDay(date, today) && !isAfter(date, today)
    if (mode === 'week') return isAfter(today, endOfWeek(date, { weekStartsOn: 1 }))
    if (mode === 'month') return isAfter(today, endOfMonth(date))
    return false
  }

  const goBack = () => {
    if (mode === 'day') onChange(addDays(date, -1))
    else if (mode === 'week') onChange(addWeeks(date, -1))
    else if (mode === 'month') onChange(addMonths(date, -1))
  }

  const goForward = () => {
    if (!canGoForward()) return
    if (mode === 'day') onChange(addDays(date, 1))
    else if (mode === 'week') onChange(addWeeks(date, 1))
    else if (mode === 'month') onChange(addMonths(date, 1))
  }

  const label = () => {
    if (mode === 'day') {
      return isSameDay(date, today) ? 'Today' : format(date, 'EEE, MMM d')
    }
    if (mode === 'week') {
      const start = startOfWeek(date, { weekStartsOn: 1 })
      const end = endOfWeek(date, { weekStartsOn: 1 })
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
    }
    if (mode === 'month') {
      return format(date, 'MMMM yyyy')
    }
    return ''
  }

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={goBack}
        className="p-2 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-white">{label()}</span>
      <button
        onClick={goForward}
        disabled={!canGoForward()}
        className="p-2 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
