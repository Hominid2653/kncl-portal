import { ChevronLeftIcon, ChevronRightIcon, StickyNoteIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PresentationControlsProps {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  onExit: () => void
  notesOpen: boolean
  onToggleNotes: () => void
  canGoPrev: boolean
  canGoNext: boolean
}

export default function PresentationControls({
  current,
  total,
  onPrev,
  onNext,
  onExit,
  notesOpen,
  onToggleNotes,
  canGoPrev,
  canGoNext,
}: PresentationControlsProps) {
  const progress = ((current + 1) / total) * 100

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-3 sm:px-6">
        <div className="pointer-events-auto h-1.5 overflow-hidden rounded-full bg-[#111b2e]/10 xl:h-2">
          <div
            className="h-full bg-[#006b3f] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-4 pb-4 sm:px-6">
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-14 border-[#111b2e]/20 bg-white/95 shadow-sm xl:size-16"
            onClick={onPrev}
            disabled={!canGoPrev}
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="size-7 xl:size-8" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-14 border-[#111b2e]/20 bg-white/95 shadow-sm xl:size-16"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next slide"
          >
            <ChevronRightIcon className="size-7 xl:size-8" />
          </Button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden border-[#111b2e]/20 bg-white/95 sm:inline-flex"
            onClick={onToggleNotes}
            aria-pressed={notesOpen}
          >
            <StickyNoteIcon className="size-4" data-icon="inline-start" />
            Notes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onExit}
          >
            <XIcon className="size-4" data-icon="inline-start" />
            Exit
          </Button>
        </div>
      </div>
    </>
  )
}
