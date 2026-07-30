import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import PresentationControls from '@/presentation/components/PresentationControls'
import SlideContent, { SlideFrame } from '@/presentation/components/SlideContent'
import { presentationSlides } from '@/presentation/slides'

const TOTAL = presentationSlides.length

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
}

export default function PresentationPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const [notesOpen, setNotesOpen] = useState(false)

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1)
    setCurrent(Math.max(0, Math.min(TOTAL - 1, index)))
  }, [current])

  const goNext = useCallback(() => {
    if (current < TOTAL - 1) goTo(current + 1)
  }, [current, goTo])

  const goPrev = useCallback(() => {
    if (current > 0) goTo(current - 1)
  }, [current, goTo])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goTo(TOTAL - 1)
      } else if (e.key === 'n' || e.key === 'N') {
        setNotesOpen((open) => !open)
      } else if (e.key === 'Escape') {
        navigate('/')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, goTo, navigate])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, [role="button"]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x > rect.width / 2) {
      goNext()
    } else {
      goPrev()
    }
  }

  const slide = presentationSlides[current]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="relative flex-1 overflow-hidden" onClick={handleClick} role="presentation">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <SlideFrame slide={slide} index={current} total={TOTAL}>
              <SlideContent slide={slide} />
            </SlideFrame>
          </motion.div>
        </AnimatePresence>

        <PresentationControls
          current={current}
          total={TOTAL}
          onPrev={goPrev}
          onNext={goNext}
          onExit={() => navigate('/')}
          notesOpen={notesOpen}
          onToggleNotes={() => setNotesOpen((o) => !o)}
          canGoPrev={current > 0}
          canGoNext={current < TOTAL - 1}
        />
      </div>

      <AnimatePresence>
        {notesOpen && (
          <motion.aside
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden border-t-2 border-[#006b3f] bg-[#111b2e] text-white"
          >
            <div className="max-h-40 overflow-y-auto px-6 py-4 sm:px-12">
              <p className="mb-1 text-xs font-semibold tracking-widest text-white/50 uppercase">
                Speaker notes — press N to hide
              </p>
              <p className="text-lg font-semibold leading-relaxed text-white/90 xl:text-xl">
                {slide.speakerNotes}
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
