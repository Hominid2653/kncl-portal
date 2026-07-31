export interface PlayerRatings {
  classicalRating?: number
  rapidRating?: number
  blitzRating?: number
  fideId?: string
}

/** Primary rating for display: classical (FIDE standard) first, then rapid, then blitz. */
export function primaryRating(ratings: PlayerRatings): number | undefined {
  return ratings.classicalRating ?? ratings.rapidRating ?? ratings.blitzRating
}

export function hasAnyRating(ratings: PlayerRatings): boolean {
  return Boolean(ratings.classicalRating ?? ratings.rapidRating ?? ratings.blitzRating)
}

export function ratingSourceLabel(ratings: PlayerRatings & { fideId?: string; lichessUsername?: string; chesscomUsername?: string }): string {
  if (ratings.fideId && ratings.classicalRating) return 'FIDE'
  if (ratings.lichessUsername) return 'Lichess'
  if (ratings.chesscomUsername) return 'Chess.com'
  return 'Not synced'
}
