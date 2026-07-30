import type { ReactNode } from 'react'

interface MarketingSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export default function MarketingSection({ title, description, children }: MarketingSectionProps) {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {children}
    </section>
  )
}
