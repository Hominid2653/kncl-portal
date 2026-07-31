import { Badge } from '@/components/ui/badge'
import { hasAnyRating, type PlayerRatings } from '@/lib/player-ratings'
import { cn } from '@/lib/utils'

interface PlayerRatingsBadgesProps {
  ratings: PlayerRatings
  className?: string
  size?: 'sm' | 'md'
}

export default function PlayerRatingsBadges({ ratings, className, size = 'md' }: PlayerRatingsBadgesProps) {
  if (!hasAnyRating(ratings)) {
    return (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        No ratings
      </Badge>
    )
  }

  const text = size === 'sm' ? 'text-xs' : 'text-sm'
  const items = [
    { label: 'Std', value: ratings.classicalRating },
    { label: 'Rpd', value: ratings.rapidRating },
    { label: 'Blz', value: ratings.blitzRating },
  ].filter((item) => item.value)

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {items.map((item) => (
        <Badge key={item.label} variant="secondary" className={cn('font-semibold tabular-nums', text)}>
          {item.label} {item.value}
        </Badge>
      ))}
    </div>
  )
}
