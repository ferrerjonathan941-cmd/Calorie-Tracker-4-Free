'use client'

import { useRef, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useAnimation } from 'framer-motion'

interface SwipeContainerProps {
  currentIndex: number
  onIndexChange: (index: number) => void
  disabled?: boolean
  children: React.ReactNode[]
}

const DIRECTION_LOCK_THRESHOLD = 10
const FLICK_VELOCITY_THRESHOLD = 300
const RUBBER_BAND_FACTOR = 0.3
const SPRING_CONFIG = { stiffness: 300, damping: 30 }

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A', 'LABEL'])

export default function SwipeContainer({
  currentIndex,
  onIndexChange,
  disabled = false,
  children,
}: SwipeContainerProps) {
  const pageCount = children.length
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const controls = useAnimation()

  // Drag tracking refs
  const dragging = useRef(false)
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const pointerId = useRef<number | null>(null)

  const getPageWidth = useCallback(() => {
    return containerRef.current?.parentElement?.offsetWidth ?? window.innerWidth
  }, [])

  // Snap to a given page index
  const snapToPage = useCallback(
    (index: number) => {
      const pageWidth = getPageWidth()
      controls.start({
        x: -index * pageWidth,
        transition: { type: 'spring', ...SPRING_CONFIG },
      })
    },
    [controls, getPageWidth]
  )

  // Sync position when currentIndex changes externally
  useEffect(() => {
    snapToPage(currentIndex)
  }, [currentIndex, snapToPage])

  // Re-snap on window resize
  useEffect(() => {
    const handleResize = () => snapToPage(currentIndex)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentIndex, snapToPage])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return

      // Skip drag on interactive elements
      const target = e.target as HTMLElement
      if (INTERACTIVE_TAGS.has(target.tagName)) return
      if (target.closest('button, a, input, textarea, select, label, [role="button"]')) return

      dragging.current = true
      directionLocked.current = null
      startX.current = e.clientX
      startY.current = e.clientY
      lastX.current = e.clientX
      lastTime.current = Date.now()
      velocity.current = 0
      pointerId.current = e.pointerId

      // Stop any in-progress animation
      controls.stop()
    },
    [disabled, controls]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || disabled) return
      if (e.pointerId !== pointerId.current) return

      const dx = e.clientX - startX.current
      const dy = e.clientY - startY.current

      // Direction lock decision
      if (directionLocked.current === null) {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)

        if (absDx < DIRECTION_LOCK_THRESHOLD && absDy < DIRECTION_LOCK_THRESHOLD) {
          return // Not enough movement yet
        }

        if (absDx > absDy) {
          directionLocked.current = 'horizontal'
          // Capture pointer for horizontal drag
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        } else {
          directionLocked.current = 'vertical'
          dragging.current = false
          return // Let browser handle vertical scroll
        }
      }

      if (directionLocked.current !== 'horizontal') return

      e.preventDefault()

      // Track velocity
      const now = Date.now()
      const dt = now - lastTime.current
      if (dt > 0) {
        velocity.current = (e.clientX - lastX.current) / dt * 1000
        lastX.current = e.clientX
        lastTime.current = now
      }

      // Calculate position with rubber-band at edges
      const pageWidth = getPageWidth()
      const baseOffset = -currentIndex * pageWidth
      let offset = baseOffset + dx

      // Rubber-band: overscroll past first page
      if (offset > 0) {
        offset = dx * RUBBER_BAND_FACTOR
      }
      // Rubber-band: overscroll past last page
      const maxOffset = -(pageCount - 1) * pageWidth
      if (offset < maxOffset) {
        const overscroll = offset - maxOffset
        offset = maxOffset + overscroll * RUBBER_BAND_FACTOR
      }

      x.set(offset)
    },
    [disabled, currentIndex, pageCount, x, getPageWidth]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || e.pointerId !== pointerId.current) return
      dragging.current = false

      if (directionLocked.current !== 'horizontal') return

      const dx = e.clientX - startX.current
      const pageWidth = getPageWidth()
      const v = velocity.current

      let targetIndex = currentIndex

      // Flick detection: fast swipe triggers page change
      if (Math.abs(v) > FLICK_VELOCITY_THRESHOLD) {
        targetIndex = v > 0 ? currentIndex - 1 : currentIndex + 1
      } else {
        // Distance-based: snap to nearest page
        const threshold = pageWidth * 0.3
        if (dx < -threshold) {
          targetIndex = currentIndex + 1
        } else if (dx > threshold) {
          targetIndex = currentIndex - 1
        }
      }

      // Clamp to valid range
      targetIndex = Math.max(0, Math.min(pageCount - 1, targetIndex))

      if (targetIndex !== currentIndex) {
        onIndexChange(targetIndex)
      }
      // Always snap (even if same page, to reset rubber-band)
      const finalX = -targetIndex * pageWidth
      controls.start({
        x: finalX,
        transition: { type: 'spring', ...SPRING_CONFIG },
      })
    },
    [currentIndex, pageCount, onIndexChange, controls, getPageWidth]
  )

  return (
    <div className="w-full h-full overflow-hidden" style={{ touchAction: 'pan-y' }}>
      <motion.div
        ref={containerRef}
        className="flex h-full"
        style={{ x, width: `${pageCount * 100}%` }}
        animate={controls}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="h-full"
            style={{ width: `${100 / pageCount}%` }}
          >
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
