"""Canonical business rules — keep in sync with frontend/src/lib/business-rules.ts."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.models.club import Club
from app.models.enums import RegistrationStatus
from app.models.registration import Registration
from app.models.season import Season

MIN_ROSTER_SIZE = 6


def can_initiate_roster_enrollment(
    *,
    roster_enrollment_open: bool,
    transfers_open: bool,
    in_initial_roster_period: bool,
) -> bool:
    return roster_enrollment_open and (transfers_open or in_initial_roster_period)


def can_initiate_transfer(*, transfers_open: bool) -> bool:
    return transfers_open


def is_club_in_initial_roster_period(club: Club) -> bool:
    return club.initial_roster_period_active and club.approved_roster_count < MIN_ROSTER_SIZE


async def get_latest_season_for_league(db: AsyncSession, league_id: UUID) -> Season | None:
    result = await db.execute(
        select(Season)
        .where(Season.league_id == league_id)
        .order_by(Season.year.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def assert_roster_enrollment_window(
    db: AsyncSession,
    *,
    season_id: UUID,
    club_id: UUID,
) -> None:
    season = await db.get(Season, season_id)
    if not season:
        raise ValidationError("Season not found.")
    club = await db.get(Club, club_id)
    if not club:
        raise ValidationError("Club not found.")

    in_initial = is_club_in_initial_roster_period(club)
    if not can_initiate_roster_enrollment(
        roster_enrollment_open=season.roster_enrollment_open,
        transfers_open=season.transfers_open,
        in_initial_roster_period=in_initial,
    ):
        raise ValidationError("Roster enrollment is not allowed while windows are closed.")


async def assert_transfer_window(db: AsyncSession, *, season_id: UUID) -> None:
    season = await db.get(Season, season_id)
    if not season:
        raise ValidationError("Season not found.")
    if not can_initiate_transfer(transfers_open=season.transfers_open):
        raise ValidationError("Transfers are only allowed during an open transfer window.")


async def player_has_approved_registration(
    db: AsyncSession,
    player_id: UUID,
    *,
    season_id: UUID | None = None,
) -> Registration | None:
    query = select(Registration).where(
        Registration.player_id == player_id,
        Registration.status == RegistrationStatus.APPROVED,
    )
    if season_id:
        query = query.where(Registration.season_id == season_id)
    query = query.order_by(Registration.registered_at.desc()).limit(1)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def increment_club_roster_count(db: AsyncSession, club_id: UUID) -> None:
    club = await db.get(Club, club_id)
    if not club:
        return
    club.approved_roster_count += 1
    if club.approved_roster_count >= MIN_ROSTER_SIZE:
        club.initial_roster_period_active = False
    await db.flush()
