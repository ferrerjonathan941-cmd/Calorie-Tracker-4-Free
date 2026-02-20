"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface MenuBarItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
}

interface MenuBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: MenuBarItem[]
  activeIndex?: number
  onSelect?: (index: number) => void
}

const springConfig = {
  duration: 0.3,
  ease: "easeInOut" as const
}

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter
          id="menu-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

export function MenuBar({ items, activeIndex: selectedIndex = 0, onSelect, className, ...props }: MenuBarProps) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = React.useState({ left: 0, width: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (hoverIndex !== null && menuRef.current && tooltipRef.current) {
      const menuItem = menuRef.current.children[hoverIndex] as HTMLElement
      const menuRect = menuRef.current.getBoundingClientRect()
      const itemRect = menuItem.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      const left = itemRect.left - menuRect.left + (itemRect.width - tooltipRect.width) / 2

      setTooltipPosition({
        left: Math.max(0, Math.min(left, menuRect.width - tooltipRect.width)),
        width: tooltipRect.width
      })
    }
  }, [hoverIndex])

  return (
    <div className={cn("relative", className)} {...props}>
      <AnimatePresence>
        {hoverIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={springConfig}
            className="absolute left-0 right-0 -top-[31px] pointer-events-none z-50"
          >
            <motion.div
              ref={tooltipRef}
              className={cn(
                "h-7 px-3 rounded-lg inline-flex justify-center items-center overflow-hidden",
                "bg-surface/95 backdrop-blur",
                "border border-white/[0.08]",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              )}
              initial={{ x: tooltipPosition.left }}
              animate={{ x: tooltipPosition.left }}
              transition={springConfig}
              style={{ width: "auto" }}
            >
              <p className="text-[13px] font-medium leading-tight whitespace-nowrap text-text">
                {items[hoverIndex].label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liquid glass menu bar */}
      <div className="relative">
        {/* Glass shadow layer */}
        <div className="absolute top-0 left-0 z-0 h-full w-full rounded-full
          shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]"
        />
        {/* Glass distortion layer */}
        <div
          className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
          style={{ backdropFilter: 'url("#menu-glass")' }}
        />

        <div
          ref={menuRef}
          className={cn(
            "relative h-12 px-2 inline-flex justify-center items-center gap-1 z-10",
            "rounded-full bg-white/[0.04] backdrop-blur-xl",
            "border border-white/[0.08]"
          )}
        >
          {items.map((item, index) => {
            const isActive = index === selectedIndex
            const Icon = item.icon
            return (
              <button
                key={index}
                className={cn(
                  "w-10 h-10 rounded-full flex justify-center items-center transition-colors relative",
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                )}
                onClick={() => onSelect?.(index)}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-white/[0.10]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex justify-center items-center">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="sr-only">{item.label}</span>
              </button>
            )
          })}
        </div>

        <GlassFilter />
      </div>
    </div>
  )
}
