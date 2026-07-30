import type { ReactNode } from 'react'

import type { SlideDefinition } from '@/presentation/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface SlideContentProps {
  slide: SlideDefinition
}

function BulletList({ items, centered = true }: { items: SlideDefinition['bullets']; centered?: boolean }) {
  if (!items) return null
  return (
    <ul
      className={cn(
        'mx-auto w-full max-w-5xl space-y-6',
        centered && 'text-center',
      )}
    >
      {items.map((item) => (
        <li
          key={item.text}
          className="text-3xl leading-snug font-bold text-[#111b2e] xl:text-4xl 2xl:text-[2.5rem]"
        >
          <span>{item.text}</span>
          {item.sub && (
            <ul className="mt-3 space-y-2 text-2xl font-semibold text-muted-foreground xl:text-3xl">
              {item.sub.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function SlideContent({ slide }: SlideContentProps) {
  switch (slide.layout) {
    case 'title':
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="mb-10 h-1.5 w-32 bg-[#bb1e2d]" aria-hidden />
          <h1 className="max-w-5xl text-6xl font-bold tracking-tight text-[#111b2e] xl:text-7xl 2xl:text-8xl">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="mt-6 text-4xl font-bold text-[#006b3f] xl:text-5xl 2xl:text-6xl">{slide.subtitle}</p>
          )}
          {slide.meta && (
            <div className="mt-14 space-y-4 text-2xl font-semibold text-[#111b2e]/80 xl:text-3xl 2xl:text-4xl">
              {slide.meta.map((m) => (
                <p key={m.label}>
                  <span className="font-bold text-[#111b2e]">{m.label}:</span> {m.value}
                </p>
              ))}
            </div>
          )}
        </div>
      )

    case 'agenda':
      return (
        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-5 sm:grid-cols-2">
          {slide.bullets?.map((item, i) => (
            <div
              key={item.text}
              className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-[#111b2e]/15 bg-white px-6 py-6 text-center"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#111b2e] text-2xl font-bold text-white xl:size-16 xl:text-3xl">
                {i + 1}
              </span>
              <span className="text-2xl font-bold text-[#111b2e] xl:text-3xl 2xl:text-4xl">{item.text}</span>
            </div>
          ))}
        </div>
      )

    case 'bullets':
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
          {slide.subtitle && (
            <p className="max-w-4xl text-3xl font-semibold text-muted-foreground xl:text-4xl">{slide.subtitle}</p>
          )}
          <BulletList items={slide.bullets} />
        </div>
      )

    case 'two-column':
      return (
        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 lg:grid-cols-2">
          {slide.columns?.map((col) => (
            <Card key={col.heading} className="border-2 border-[#111b2e]/15 shadow-none">
              <CardContent className="space-y-6 p-8 text-center xl:p-10">
                <h3 className="border-b-2 border-[#006b3f] pb-3 text-3xl font-bold text-[#111b2e] xl:text-4xl">
                  {col.heading}
                </h3>
                <ul className="space-y-4">
                  {col.items.map((item) => (
                    <li key={item} className="text-2xl font-bold text-[#111b2e] xl:text-3xl 2xl:text-4xl">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )

    case 'grid':
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-8 text-center">
          {slide.subtitle && (
            <p className="text-2xl font-semibold text-muted-foreground xl:text-3xl">{slide.subtitle}</p>
          )}
          <div className="grid w-full gap-5 sm:grid-cols-2">
            {slide.grid?.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border-2 border-[#111b2e]/10 bg-white px-6 py-5"
              >
                <p className="text-2xl font-bold text-[#111b2e] xl:text-3xl 2xl:text-4xl">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-muted-foreground xl:text-2xl 2xl:text-3xl">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'table':
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 overflow-hidden text-center">
          {slide.subtitle && (
            <p className="text-2xl font-semibold text-muted-foreground xl:text-3xl">{slide.subtitle}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center text-2xl font-bold xl:text-3xl">Criterion</TableHead>
                <TableHead className="text-center text-2xl font-bold xl:text-3xl">Evidence in this project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slide.table?.map((row) => (
                <TableRow key={row.criterion}>
                  <TableCell className="text-center text-xl font-bold text-[#111b2e] xl:text-2xl 2xl:text-3xl">
                    {row.criterion}
                  </TableCell>
                  <TableCell className="text-center text-xl font-semibold text-muted-foreground xl:text-2xl 2xl:text-3xl">
                    {row.evidence}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )

    case 'diagram':
      return (
        <div className="flex flex-1 flex-col items-center gap-6 overflow-hidden text-center">
          {slide.subtitle && (
            <p className="shrink-0 text-2xl font-semibold text-muted-foreground xl:text-3xl 2xl:text-4xl">
              {slide.subtitle}
            </p>
          )}
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">{slide.diagram}</div>
          {slide.bullets && slide.bullets.length > 0 && (
            <div className="shrink-0 border-t-2 border-border pt-4">
              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xl font-bold text-[#111b2e] xl:text-2xl 2xl:text-3xl">
                {slide.bullets.map((b) => (
                  <li key={b.text}>{b.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )

    case 'demo':
      return (
        <div className="flex flex-1 items-center justify-center">{slide.diagram}</div>
      )

    case 'closing':
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h2 className="text-7xl font-bold text-[#111b2e] xl:text-8xl 2xl:text-9xl">{slide.title}</h2>
          {slide.subtitle && (
            <p className="mt-8 text-5xl font-bold text-[#006b3f] xl:text-6xl 2xl:text-7xl">{slide.subtitle}</p>
          )}
          <div className="mt-12">
            <Badge variant="outline" className="px-6 py-3 text-2xl font-bold xl:text-3xl">
              KNCL Transfer Portal
            </Badge>
          </div>
        </div>
      )

    default:
      return null
  }
}

interface SlideFrameProps {
  slide: SlideDefinition
  index: number
  total: number
  children: ReactNode
}

export function SlideFrame({ slide, index, total, children }: SlideFrameProps) {
  const isTitle = slide.layout === 'title' || slide.layout === 'closing'

  return (
    <div className="flex h-full w-full flex-col bg-white px-10 py-8 xl:px-20 xl:py-12 2xl:px-28 2xl:py-14">
      {!isTitle && (
        <header className="mb-8 shrink-0 border-b-2 border-[#111b2e]/10 pb-5 text-center">
          <h2 className="text-5xl font-bold tracking-tight text-[#111b2e] xl:text-6xl 2xl:text-7xl">
            {slide.title}
          </h2>
          {slide.subtitle && slide.layout !== 'bullets' && slide.layout !== 'diagram' && (
            <p className="mt-3 text-2xl font-semibold text-muted-foreground xl:text-3xl 2xl:text-4xl">
              {slide.subtitle}
            </p>
          )}
        </header>
      )}

      <div className={cn('flex min-h-0 flex-1 flex-col items-center', isTitle && 'justify-center')}>
        {children}
      </div>

      <footer className="mt-8 flex shrink-0 items-center justify-between text-lg font-semibold text-muted-foreground xl:text-xl">
        <span className="tracking-wide text-[#111b2e]/60 uppercase">KNCL Transfer Portal</span>
        <span className="font-bold text-[#111b2e]">
          {index + 1} / {total}
        </span>
      </footer>
    </div>
  )
}

export { SlideContent }
