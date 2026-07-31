import type { ReactNode } from 'react'

export interface BulletItem {
  text: string
  sub?: string[]
}

export interface GridItem {
  label: string
  detail: string
}

export interface TableRow {
  criterion: string
  evidence: string
}

export interface SlideDefinition {
  id: string
  title: string
  subtitle?: string
  speakerNotes: string
  layout:
    | 'title'
    | 'agenda'
    | 'bullets'
    | 'two-column'
    | 'grid'
    | 'table'
    | 'diagram'
    | 'demo'
    | 'closing'
  bullets?: BulletItem[]
  columns?: { heading: string; items: string[] }[]
  grid?: GridItem[]
  table?: TableRow[]
  diagram?: ReactNode
  meta?: { label: string; value: string }[]
  accent?: 'green' | 'red' | 'gold' | 'navy'
}
