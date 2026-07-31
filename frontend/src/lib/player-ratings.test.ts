import { describe, expect, it } from 'vitest'

import { hasAnyRating, primaryRating, ratingSourceLabel } from '@/lib/player-ratings'

describe('player-ratings', () => {
  it('prefers classical, then rapid, then blitz for primary rating', () => {
    expect(primaryRating({ classicalRating: 1800, rapidRating: 1700, blitzRating: 1600 })).toBe(1800)
    expect(primaryRating({ rapidRating: 1700, blitzRating: 1600 })).toBe(1700)
    expect(primaryRating({ blitzRating: 1600 })).toBe(1600)
    expect(primaryRating({})).toBeUndefined()
  })

  it('detects when any rating is present', () => {
    expect(hasAnyRating({ classicalRating: 1500 })).toBe(true)
    expect(hasAnyRating({})).toBe(false)
  })

  it('labels the rating source in priority order', () => {
    expect(
      ratingSourceLabel({
        fideId: '1510303',
        classicalRating: 1800,
        lichessUsername: 'player',
      }),
    ).toBe('FIDE')
    expect(ratingSourceLabel({ lichessUsername: 'player', blitzRating: 1500 })).toBe('Lichess')
    expect(ratingSourceLabel({ chesscomUsername: 'player' })).toBe('Chess.com')
    expect(ratingSourceLabel({})).toBe('Not synced')
  })
})
