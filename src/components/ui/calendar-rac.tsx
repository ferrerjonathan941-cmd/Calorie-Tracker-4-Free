'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  Calendar as AriaCalendar,
  Heading as AriaHeading,
  Button as AriaButton,
  type CalendarProps as AriaCalendarProps,
  type DateValue,
  composeRenderProps,
} from 'react-aria-components'
import { isToday as _isToday, getLocalTimeZone } from '@internationalized/date'

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

// ─── Calendar ──────────────────────────────────────────────
function Calendar<T extends DateValue>({
  className,
  ...props
}: AriaCalendarProps<T> & { className?: string }) {
  return (
    <AriaCalendar className={className} {...props}>
      {composeRenderProps(props.children, (children) => (
        <>
          <CalendarHeader />
          <CalendarGrid>
            <CalendarGridHeader />
            <CalendarGridBody>
              {(date) => <CalendarCell date={date} />}
            </CalendarGridBody>
          </CalendarGrid>
          {children}
        </>
      ))}
    </AriaCalendar>
  )
}

// ─── Header with month/year + navigation arrows ────────────
function CalendarHeader() {
  return (
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
  )
}

// ─── Grid wrappers ─────────────────────────────────────────
function CalendarGrid(props: React.ComponentProps<typeof AriaCalendarGrid>) {
  return <AriaCalendarGrid className="w-full border-collapse" {...props} />
}

function CalendarGridHeader(
  props: Partial<React.ComponentProps<typeof AriaCalendarGridHeader>>
) {
  return (
    <AriaCalendarGridHeader {...props}>
      {(day) => (
        <CalendarHeaderCell day={day} />
      )}
    </AriaCalendarGridHeader>
  )
}

function CalendarHeaderCell({ day }: { day: string }) {
  return (
    <AriaCalendarHeaderCell className="size-9 text-xs font-medium text-text-dim text-center">
      {day}
    </AriaCalendarHeaderCell>
  )
}

function CalendarGridBody(
  props: React.ComponentProps<typeof AriaCalendarGridBody>
) {
  return <AriaCalendarGridBody {...props} />
}

// ─── Cell ──────────────────────────────────────────────────
function CalendarCell({
  date,
  ...props
}: React.ComponentProps<typeof AriaCalendarCell>) {
  const today = _isToday(date, getLocalTimeZone())

  return (
    <AriaCalendarCell
      date={date}
      className="p-0.5 text-center"
      {...props}
    >
      {({ isSelected, isDisabled, isUnavailable, isOutsideVisibleRange, isHovered }) => (
        <div className="relative flex flex-col items-center">
          <span
            className={getCellClassName({
              isSelected,
              isToday: today,
              isDisabled,
              isUnavailable,
              isOutsideMonth: isOutsideVisibleRange,
              isHovered,
            })}
          >
            {date.day}
          </span>
          {today && !isSelected && (
            <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent" />
          )}
        </div>
      )}
    </AriaCalendarCell>
  )
}

export {
  Calendar,
  CalendarHeader,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  CalendarCell,
}
