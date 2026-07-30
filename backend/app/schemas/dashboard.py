from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class ClubPendingSummary(BaseModel):
    club_id: UUID
    club_name: str
    pending_transfers: int
    pending_registrations: int


class SeasonRegistrationSummary(BaseModel):
    season_id: UUID
    season_name: str
    total: int
    by_status: list[StatusCount]


class ActivityItem(BaseModel):
    id: UUID
    activity_type: str
    action: str
    summary: str
    occurred_at: datetime
    entity_id: UUID | None = None


class DashboardTotals(BaseModel):
    clubs: int
    players: int
    registrations: int
    transfers: int
    unread_notifications: int
    pending_club_applications: int = 0
    pending_player_applications: int = 0
    pending_engagements: int = 0
    pending_headshots: int = 0


class AdminDashboardResponse(BaseModel):
    totals: DashboardTotals
    transfer_counts: list[StatusCount]
    pending_by_club: list[ClubPendingSummary]
    registrations_by_season: list[SeasonRegistrationSummary]
    recent_activity: list[ActivityItem]


class ClubDashboardClubSummary(BaseModel):
    club_id: UUID
    club_name: str
    pending_transfers: int
    pending_registrations: int
    pending_engagements: int = 0
    transfer_counts: list[StatusCount]


class ClubDashboardResponse(BaseModel):
    clubs: list[ClubDashboardClubSummary]
    unread_notifications: int
    recent_activity: list[ActivityItem]


class PlayerRegistrationSummary(BaseModel):
    registration_id: UUID
    season_id: UUID
    club_id: UUID
    status: str
    registered_at: datetime


class PlayerTransferSummary(BaseModel):
    transfer_id: UUID
    status: str
    from_club_id: UUID
    to_club_id: UUID
    submitted_at: datetime


class PlayerDashboardResponse(BaseModel):
    registrations: list[PlayerRegistrationSummary]
    transfers: list[PlayerTransferSummary]
    transfer_counts: list[StatusCount]
    unread_notifications: int
    recent_activity: list[ActivityItem]
