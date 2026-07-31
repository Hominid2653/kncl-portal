import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MarketingImageBackdropProps {
  children: ReactNode
  className?: string
  imagePosition?: string
  variant?: 'hero' | 'cta' | 'footer'
}

export default function MarketingImageBackdrop({
  children,
  className,
  imagePosition = 'center 40%',
  variant = 'cta',
}: MarketingImageBackdropProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src="/image.png"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: imagePosition }}
      />
      {variant === 'hero' && (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0b1220]/95 via-[#111b2e]/88 to-[#111b2e]/30"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/70 via-transparent to-[#0b1220]/25"
            aria-hidden
          />
        </>
      )}
      {variant === 'cta' && (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0b1220]/94 via-[#111b2e]/90 to-[#111b2e]/85"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/60 via-transparent to-[#0b1220]/40"
            aria-hidden
          />
        </>
      )}
      {variant === 'footer' && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/97 via-[#0b1220]/93 to-[#0b1220]/90"
          aria-hidden
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
