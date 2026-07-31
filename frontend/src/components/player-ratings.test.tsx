import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PlayerRatingsBadges from '@/components/player-ratings'

describe('PlayerRatingsBadges', () => {
  it('shows a placeholder when no ratings exist', () => {
    render(<PlayerRatingsBadges ratings={{}} />)
    expect(screen.getByText('No ratings')).toBeInTheDocument()
  })

  it('renders available rating badges', () => {
    render(
      <PlayerRatingsBadges
        ratings={{
          classicalRating: 1800,
          rapidRating: 1720,
          blitzRating: 1650,
        }}
      />,
    )

    expect(screen.getByText('Std 1800')).toBeInTheDocument()
    expect(screen.getByText('Rpd 1720')).toBeInTheDocument()
    expect(screen.getByText('Blz 1650')).toBeInTheDocument()
  })
})
