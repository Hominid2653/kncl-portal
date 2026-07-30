from uuid import UUID

import pytest

from app.lib.business_rules import (
    MIN_ROSTER_SIZE,
    can_initiate_roster_enrollment,
    can_initiate_transfer,
    is_club_in_initial_roster_period,
)
from app.models.club import Club
from app.seed.data import LEAGUE_ID


def test_can_initiate_roster_enrollment_initial_period() -> None:
    assert can_initiate_roster_enrollment(
        roster_enrollment_open=True,
        transfers_open=False,
        in_initial_roster_period=True,
    )


def test_can_initiate_roster_enrollment_transfer_window() -> None:
    assert can_initiate_roster_enrollment(
        roster_enrollment_open=True,
        transfers_open=True,
        in_initial_roster_period=False,
    )


def test_roster_enrollment_closed_without_window() -> None:
    assert not can_initiate_roster_enrollment(
        roster_enrollment_open=False,
        transfers_open=True,
        in_initial_roster_period=True,
    )


def test_transfer_requires_open_window() -> None:
    assert can_initiate_transfer(transfers_open=True)
    assert not can_initiate_transfer(transfers_open=False)


def test_initial_roster_period_ends_at_min_roster_size() -> None:
    club = Club(
        name="Test",
        league_id=LEAGUE_ID,
        initial_roster_period_active=True,
        approved_roster_count=MIN_ROSTER_SIZE - 1,
    )
    assert is_club_in_initial_roster_period(club)

    club.approved_roster_count = MIN_ROSTER_SIZE
    assert not is_club_in_initial_roster_period(club)
