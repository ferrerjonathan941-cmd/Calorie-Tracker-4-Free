'use client'

import { motion } from 'framer-motion'

interface PageIndicatorProps {
  count: number
  activeIndex: number
}

export default function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="h-1 rounded-full bg-white"
          animate={{
            width: i === activeIndex ? 20 : 6,
            opacity: i === activeIndex ? 0.8 : 0.25,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      ))}
    </div>
  )
}
