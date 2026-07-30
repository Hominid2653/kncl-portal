import type { ReactNode } from 'react'

interface MarketingPageShellProps {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
  /** Content width — default `7xl` for listings/about, `5xl` for forms */
  width?: '3xl' | '5xl' | '7xl'
  className?: string
}

const widthClass = {
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
} as const

export default function MarketingPageShell({
  eyebrow,
  title,
  description,
  children,
  width = '7xl',
  className = '',
}: MarketingPageShellProps) {
  return (
    <div className={`mx-auto ${widthClass[width]} space-y-10 px-4 py-12 sm:px-6 sm:py-16 ${className}`}>
      <header className="max-w-3xl space-y-4 border-b border-border/60 pb-8">
        {eyebrow && (
          <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && (
          <p className="text-base leading-7 text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-10">{children}</div>
    </div>
  )
}
