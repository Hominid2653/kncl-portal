import os

root = os.path.dirname(__file__)

files = {
    os.path.join(root, 'app', 'repositories', 'base_repository.py'): '''from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar('ModelType')


class BaseRepository(Generic[ModelType]):
    def __init__(self, model):
        self.model = model

    async def get_by_id(
        self,
        db: AsyncSession,
        obj_id: UUID,
    ):
        result = await db.execute(select(self.model).where(self.model.id == obj_id))
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(self.model))
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj):
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def update(self, db: AsyncSession, obj, obj_in: dict):
        for field, value in obj_in.items():
            setattr(obj, field, value)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def delete(self, db: AsyncSession, obj):
        await db.delete(obj)
        await db.commit()
''',
    os.path.join(root, 'app', 'services', 'base_services.py'): '''from typing import Generic, TypeVar

from app.core.exceptions import ResourceNotFound
from app.repositories.base_repository import BaseRepository

ModelType = TypeVar('ModelType')


class BaseService(Generic[ModelType]):
    def __init__(self, repository: BaseRepository[ModelType]):
        self.repository = repository

    async def list(self, db):
        return await self.repository.get_all(db)

    async def get(self, db, obj_id):
        obj = await self.repository.get_by_id(db, obj_id)
        if not obj:
            raise ResourceNotFound(f'{self.repository.model.__name__} not found.')
        return obj

    async def create(self, db, obj):
        return await self.repository.create(db, obj)

    async def update(self, db, obj_id, obj_in: dict):
        obj = await self.get(db, obj_id)
        return await self.repository.update(db, obj, obj_in)

    async def delete(self, db, obj_id):
        obj = await self.get(db, obj_id)
        await self.repository.delete(db, obj)
        return obj
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', '__init__.py'): '''# Package for versioned endpoint modules.
''',
    os.path.join(root, 'app', 'api', 'router.py'): '''from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.endpoints import (
    audit_logs,
    clubs,
    club_members,
    documents,
    leagues,
    notifications,
    players,
    registrations,
    seasons,
    transfer_approvals,
    transfers,
    user_profiles,
)

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(leagues.router)
api_router.include_router(clubs.router)
api_router.include_router(seasons.router)
api_router.include_router(user_profiles.router)
api_router.include_router(players.router)
api_router.include_router(club_members.router)
api_router.include_router(registrations.router)
api_router.include_router(transfers.router)
api_router.include_router(transfer_approvals.router)
api_router.include_router(documents.router)
api_router.include_router(notifications.router)
api_router.include_router(audit_logs.router)
''',
    os.path.join(root, 'app', 'schemas', 'club.py'): '''from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class ClubCreate(BaseModel):
    league_id: str
    name: str = Field(..., min_length=3, max_length=150)
    county: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    logo: str | None = Field(default=None, max_length=1000)
    founded_year: int | None = None


class ClubUpdate(BaseModel):
    league_id: str | None = None
    name: str | None = Field(default=None, min_length=3, max_length=150)
    county: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    logo: str | None = Field(default=None, max_length=1000)
    founded_year: int | None = None


class ClubResponse(TimestampSchema):
    league_id: str
    name: str
    county: str | None = None
    description: str | None = None
    logo: str | None = None
    founded_year: int | None = None


class ClubListResponse(ListResponse):
    items: list[ClubResponse]
''',
    os.path.join(root, 'app', 'schemas', 'club_member.py'): '''from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class ClubMemberCreate(BaseModel):
    club_id: str
    user_profile_id: str
    position: str = Field(..., min_length=1, max_length=50)


class ClubMemberUpdate(BaseModel):
    position: str | None = Field(default=None, min_length=1, max_length=50)


class ClubMemberResponse(TimestampSchema):
    club_id: str
    user_profile_id: str
    position: str


class ClubMemberListResponse(ListResponse):
    items: list[ClubMemberResponse]
''',
    os.path.join(root, 'app', 'schemas', 'season.py'): '''from datetime import date
from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class SeasonCreate(BaseModel):
    league_id: str
    name: str = Field(..., min_length=3, max_length=100)
    year: int
    registration_open: bool = False
    transfers_open: bool = False
    start_date: date | None = None
    end_date: date | None = None


class SeasonUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=100)
    registration_open: bool | None = None
    transfers_open: bool | None = None
    start_date: date | None = None
    end_date: date | None = None


class SeasonResponse(TimestampSchema):
    league_id: str
    name: str
    year: int
    registration_open: bool
    transfers_open: bool
    start_date: date | None = None
    end_date: date | None = None


class SeasonListResponse(ListResponse):
    items: list[SeasonResponse]
''',
    os.path.join(root, 'app', 'schemas', 'user_profile.py'): '''from pydantic import BaseModel, Field

from app.models.enums import UserRole
from app.schemas.common import ListResponse, TimestampSchema


class UserProfileCreate(BaseModel):
    auth_user_id: str
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role: UserRole


class UserProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role: UserRole | None = None


class UserProfileResponse(TimestampSchema):
    auth_user_id: str
    first_name: str
    last_name: str
    phone: str | None = None
    role: UserRole


class UserProfileListResponse(ListResponse):
    items: list[UserProfileResponse]
''',
    os.path.join(root, 'app', 'schemas', 'player.py'): '''from datetime import date
from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class PlayerCreate(BaseModel):
    user_profile_id: str
    federation_id: str | None = Field(default=None, max_length=50)
    fide_id: str | None = Field(default=None, max_length=50)
    chesscom_username: str | None = Field(default=None, max_length=100)
    lichess_username: str | None = Field(default=None, max_length=100)
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerUpdate(BaseModel):
    federation_id: str | None = Field(default=None, max_length=50)
    fide_id: str | None = Field(default=None, max_length=50)
    chesscom_username: str | None = Field(default=None, max_length=100)
    lichess_username: str | None = Field(default=None, max_length=100)
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerResponse(TimestampSchema):
    user_profile_id: str
    federation_id: str | None = None
    fide_id: str | None = None
    chesscom_username: str | None = None
    lichess_username: str | None = None
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = None
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerListResponse(ListResponse):
    items: list[PlayerResponse]
''',
    os.path.join(root, 'app', 'schemas', 'registration.py'): '''from datetime import datetime
from pydantic import BaseModel

from app.models.enums import RegistrationStatus
from app.schemas.common import ListResponse, TimestampSchema


class RegistrationCreate(BaseModel):
    player_id: str
    club_id: str
    season_id: str
    status: RegistrationStatus
    registered_at: datetime


class RegistrationUpdate(BaseModel):
    status: RegistrationStatus | None = None


class RegistrationResponse(TimestampSchema):
    player_id: str
    club_id: str
    season_id: str
    status: RegistrationStatus
    registered_at: datetime


class RegistrationListResponse(ListResponse):
    items: list[RegistrationResponse]
''',
    os.path.join(root, 'app', 'schemas', 'transfer.py'): '''from datetime import datetime
from pydantic import BaseModel

from app.models.enums import TransferStatus
from app.schemas.common import ListResponse, TimestampSchema


class TransferCreate(BaseModel):
    registration_id: str
    from_club_id: str
    to_club_id: str
    reason: str | None = None
    status: TransferStatus
    submitted_at: datetime
    completed_at: datetime | None = None


class TransferUpdate(BaseModel):
    status: TransferStatus | None = None
    completed_at: datetime | None = None
    reason: str | None = None


class TransferResponse(TimestampSchema):
    registration_id: str
    from_club_id: str
    to_club_id: str
    reason: str | None = None
    status: TransferStatus
    submitted_at: datetime
    completed_at: datetime | None = None


class TransferListResponse(ListResponse):
    items: list[TransferResponse]
''',
    os.path.join(root, 'app', 'schemas', 'transfer_approval.py'): '''from datetime import datetime
from pydantic import BaseModel

from app.models.enums import ApprovalDecision
from app.schemas.common import ListResponse, TimestampSchema


class TransferApprovalCreate(BaseModel):
    transfer_id: str
    approved_by: str
    decision: ApprovalDecision
    remarks: str | None = None
    approved_at: datetime


class TransferApprovalUpdate(BaseModel):
    decision: ApprovalDecision | None = None
    remarks: str | None = None


class TransferApprovalResponse(TimestampSchema):
    transfer_id: str
    approved_by: str
    decision: ApprovalDecision
    remarks: str | None = None
    approved_at: datetime


class TransferApprovalListResponse(ListResponse):
    items: list[TransferApprovalResponse]
''',
    os.path.join(root, 'app', 'schemas', 'document.py'): '''from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class DocumentCreate(BaseModel):
    transfer_id: str
    uploaded_by: str
    document_type: str | None = Field(default=None, max_length=100)
    file_name: str | None = Field(default=None, max_length=255)
    file_url: str | None = None
    uploaded_at: datetime


class DocumentUpdate(BaseModel):
    document_type: str | None = Field(default=None, max_length=100)
    file_name: str | None = Field(default=None, max_length=255)
    file_url: str | None = None


class DocumentResponse(TimestampSchema):
    transfer_id: str
    uploaded_by: str
    document_type: str | None = None
    file_name: str | None = None
    file_url: str | None = None
    uploaded_at: datetime


class DocumentListResponse(ListResponse):
    items: list[DocumentResponse]
''',
    os.path.join(root, 'app', 'schemas', 'notification.py'): '''from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class NotificationCreate(BaseModel):
    user_profile_id: str
    title: str = Field(..., max_length=255)
    message: str = Field(...)
    is_read: bool = False


class NotificationUpdate(BaseModel):
    is_read: bool | None = None


class NotificationResponse(TimestampSchema):
    user_profile_id: str
    title: str
    message: str
    is_read: bool


class NotificationListResponse(ListResponse):
    items: list[NotificationResponse]
''',
    os.path.join(root, 'app', 'schemas', 'audit.py'): '''from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class AuditLogCreate(BaseModel):
    user_profile_id: str
    action: str = Field(..., max_length=255)
    entity: str = Field(..., max_length=100)
    entity_id: str | None = None
    ip_address: str | None = Field(default=None, max_length=50)


class AuditLogResponse(TimestampSchema):
    user_profile_id: str
    action: str
    entity: str
    entity_id: str | None = None
    ip_address: str | None = None


class AuditLogListResponse(ListResponse):
    items: list[AuditLogResponse]
''',
    os.path.join(root, 'app', 'repositories', 'club_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club import Club
from app.repositories.base_repository import BaseRepository


class ClubRepository(BaseRepository[Club]):
    def __init__(self):
        super().__init__(Club)

    async def get_by_name(self, db: AsyncSession, league_id: str, name: str):
        result = await db.execute(
            select(Club).where(Club.league_id == league_id, Club.name == name)
        )
        return result.scalar_one_or_none()
''',
    os.path.join(root, 'app', 'repositories', 'season_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.season import Season
from app.repositories.base_repository import BaseRepository


class SeasonRepository(BaseRepository[Season]):
    def __init__(self):
        super().__init__(Season)

    async def get_by_year(self, db: AsyncSession, league_id: str, year: int):
        result = await db.execute(
            select(Season).where(Season.league_id == league_id, Season.year == year)
        )
        return result.scalar_one_or_none()
''',
    os.path.join(root, 'app', 'repositories', 'user_profile_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile
from app.repositories.base_repository import BaseRepository


class UserProfileRepository(BaseRepository[UserProfile]):
    def __init__(self):
        super().__init__(UserProfile)

    async def get_by_auth_user_id(self, db: AsyncSession, auth_user_id: str):
        result = await db.execute(
            select(UserProfile).where(UserProfile.auth_user_id == auth_user_id)
        )
        return result.scalar_one_or_none()
''',
    os.path.join(root, 'app', 'repositories', 'player_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.player import Player
from app.repositories.base_repository import BaseRepository


class PlayerRepository(BaseRepository[Player]):
    def __init__(self):
        super().__init__(Player)

    async def get_by_fide_id(self, db: AsyncSession, fide_id: str):
        result = await db.execute(
            select(Player).where(Player.fide_id == fide_id)
        )
        return result.scalar_one_or_none()
''',
    os.path.join(root, 'app', 'repositories', 'club_member_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club_member import ClubMember
from app.repositories.base_repository import BaseRepository


class ClubMemberRepository(BaseRepository[ClubMember]):
    def __init__(self):
        super().__init__(ClubMember)

    async def get_by_membership(self, db: AsyncSession, club_id: str, user_profile_id: str):
        result = await db.execute(
            select(ClubMember).where(
                ClubMember.club_id == club_id,
                ClubMember.user_profile_id == user_profile_id,
            )
        )
        return result.scalar_one_or_none()
''',
    os.path.join(root, 'app', 'repositories', 'registration_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.registration import Registration
from app.repositories.base_repository import BaseRepository


class RegistrationRepository(BaseRepository[Registration]):
    def __init__(self):
        super().__init__(Registration)

    async def get_by_player_season(
        self,
        db: AsyncSession,
        player_id: str,
        season_id: str,
    ):
        result = await db.execute(
            select(Registration).where(
                Registration.player_id == player_id,
                Registration.season_id == season_id,
            )
        )
        return result.scalar_one_or_none()
''',
    os.path.join(root, 'app', 'repositories', 'transfer_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer import Transfer
from app.repositories.base_repository import BaseRepository


class TransferRepository(BaseRepository[Transfer]):
    def __init__(self):
        super().__init__(Transfer)

    async def get_by_registration(self, db: AsyncSession, registration_id: str):
        result = await db.execute(
            select(Transfer).where(Transfer.registration_id == registration_id)
        )
        return result.scalars().all()
''',
    os.path.join(root, 'app', 'repositories', 'transfer_approval_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer_approval import TransferApproval
from app.repositories.base_repository import BaseRepository


class TransferApprovalRepository(BaseRepository[TransferApproval]):
    def __init__(self):
        super().__init__(TransferApproval)

    async def get_by_transfer(self, db: AsyncSession, transfer_id: str):
        result = await db.execute(
            select(TransferApproval).where(TransferApproval.transfer_id == transfer_id)
        )
        return result.scalars().all()
''',
    os.path.join(root, 'app', 'repositories', 'document_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.repositories.base_repository import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    def __init__(self):
        super().__init__(Document)

    async def get_by_transfer(self, db: AsyncSession, transfer_id: str):
        result = await db.execute(
            select(Document).where(Document.transfer_id == transfer_id)
        )
        return result.scalars().all()
''',
    os.path.join(root, 'app', 'repositories', 'notification_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    async def get_by_user(self, db: AsyncSession, user_profile_id: str):
        result = await db.execute(
            select(Notification).where(Notification.user_profile_id == user_profile_id)
        )
        return result.scalars().all()
''',
    os.path.join(root, 'app', 'repositories', 'audit_log_repository.py'): '''from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.base_repository import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    async def get_by_user(self, db: AsyncSession, user_profile_id: str):
        result = await db.execute(
            select(AuditLog).where(AuditLog.user_profile_id == user_profile_id)
        )
        return result.scalars().all()
''',
    os.path.join(root, 'app', 'services', 'club_service.py'): '''from app.core.exceptions import DuplicateResource
from app.models.club import Club
from app.repositories.club_repository import ClubRepository
from app.schemas.club import ClubCreate
from app.services.base_services import BaseService


class ClubService(BaseService[Club]):
    def __init__(self):
        super().__init__(ClubRepository())

    async def create(self, db, data: ClubCreate):
        existing = await self.repository.get_by_name(db, data.league_id, data.name)
        if existing:
            raise DuplicateResource('Club already exists.')

        club = Club(**data.model_dump())
        return await super().create(db, club)
''',
    os.path.join(root, 'app', 'services', 'season_service.py'): '''from app.core.exceptions import DuplicateResource
from app.models.season import Season
from app.repositories.season_repository import SeasonRepository
from app.schemas.season import SeasonCreate
from app.services.base_services import BaseService


class SeasonService(BaseService[Season]):
    def __init__(self):
        super().__init__(SeasonRepository())

    async def create(self, db, data: SeasonCreate):
        existing = await self.repository.get_by_year(db, data.league_id, data.year)
        if existing:
            raise DuplicateResource('Season already exists for this league and year.')

        season = Season(**data.model_dump())
        return await super().create(db, season)
''',
    os.path.join(root, 'app', 'services', 'user_profile_service.py'): '''from app.core.exceptions import DuplicateResource
from app.models.user_profile import UserProfile
from app.repositories.user_profile_repository import UserProfileRepository
from app.schemas.user_profile import UserProfileCreate
from app.services.base_services import BaseService


class UserProfileService(BaseService[UserProfile]):
    def __init__(self):
        super().__init__(UserProfileRepository())

    async def create(self, db, data: UserProfileCreate):
        existing = await self.repository.get_by_auth_user_id(db, data.auth_user_id)
        if existing:
            raise DuplicateResource('User profile already exists for this auth user.')

        profile = UserProfile(**data.model_dump())
        return await super().create(db, profile)
''',
    os.path.join(root, 'app', 'services', 'player_service.py'): '''from app.core.exceptions import DuplicateResource
from app.models.player import Player
from app.repositories.player_repository import PlayerRepository
from app.schemas.player import PlayerCreate
from app.services.base_services import BaseService


class PlayerService(BaseService[Player]):
    def __init__(self):
        super().__init__(PlayerRepository())

    async def create(self, db, data: PlayerCreate):
        if data.fide_id:
            existing = await self.repository.get_by_fide_id(db, data.fide_id)
            if existing:
                raise DuplicateResource('Player already exists with that FIDE ID.')

        player = Player(**data.model_dump())
        return await super().create(db, player)
''',
    os.path.join(root, 'app', 'services', 'club_member_service.py'): '''from app.core.exceptions import DuplicateResource
from app.models.club_member import ClubMember
from app.repositories.club_member_repository import ClubMemberRepository
from app.schemas.club_member import ClubMemberCreate
from app.services.base_services import BaseService


class ClubMemberService(BaseService[ClubMember]):
    def __init__(self):
        super().__init__(ClubMemberRepository())

    async def create(self, db, data: ClubMemberCreate):
        existing = await self.repository.get_by_membership(
            db,
            data.club_id,
            data.user_profile_id,
        )
        if existing:
            raise DuplicateResource('Club membership already exists.')

        membership = ClubMember(**data.model_dump())
        return await super().create(db, membership)
''',
    os.path.join(root, 'app', 'services', 'registration_service.py'): '''from app.core.exceptions import DuplicateResource
from app.models.registration import Registration
from app.repositories.registration_repository import RegistrationRepository
from app.schemas.registration import RegistrationCreate
from app.services.base_services import BaseService


class RegistrationService(BaseService[Registration]):
    def __init__(self):
        super().__init__(RegistrationRepository())

    async def create(self, db, data: RegistrationCreate):
        existing = await self.repository.get_by_player_season(
            db,
            data.player_id,
            data.season_id,
        )
        if existing:
            raise DuplicateResource('Player is already registered for this season.')

        registration = Registration(**data.model_dump())
        return await super().create(db, registration)
''',
    os.path.join(root, 'app', 'services', 'transfer_service.py'): '''from app.models.transfer import Transfer
from app.repositories.transfer_repository import TransferRepository
from app.schemas.transfer import TransferCreate
from app.services.base_services import BaseService


class TransferService(BaseService[Transfer]):
    def __init__(self):
        super().__init__(TransferRepository())

    async def create(self, db, data: TransferCreate):
        transfer = Transfer(**data.model_dump())
        return await super().create(db, transfer)
''',
    os.path.join(root, 'app', 'services', 'transfer_approval_service.py'): '''from app.models.transfer_approval import TransferApproval
from app.repositories.transfer_approval_repository import TransferApprovalRepository
from app.schemas.transfer_approval import TransferApprovalCreate
from app.services.base_services import BaseService


class TransferApprovalService(BaseService[TransferApproval]):
    def __init__(self):
        super().__init__(TransferApprovalRepository())

    async def create(self, db, data: TransferApprovalCreate):
        approval = TransferApproval(**data.model_dump())
        return await super().create(db, approval)
''',
    os.path.join(root, 'app', 'services', 'document_service.py'): '''from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import DocumentCreate
from app.services.base_services import BaseService


class DocumentService(BaseService[Document]):
    def __init__(self):
        super().__init__(DocumentRepository())

    async def create(self, db, data: DocumentCreate):
        document = Document(**data.model_dump())
        return await super().create(db, document)
''',
    os.path.join(root, 'app', 'services', 'notification_service.py'): '''from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate
from app.services.base_services import BaseService


class NotificationService(BaseService[Notification]):
    def __init__(self):
        super().__init__(NotificationRepository())

    async def create(self, db, data: NotificationCreate):
        notification = Notification(**data.model_dump())
        return await super().create(db, notification)
''',
    os.path.join(root, 'app', 'services', 'audit_log_service.py'): '''from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit import AuditLogCreate
from app.services.base_services import BaseService


class AuditLogService(BaseService[AuditLog]):
    def __init__(self):
        super().__init__(AuditLogRepository())

    async def create(self, db, data: AuditLogCreate):
        audit_log = AuditLog(**data.model_dump())
        return await super().create(db, audit_log)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'clubs.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.club import ClubCreate, ClubListResponse, ClubResponse
from app.services.club_service import ClubService

router = APIRouter(prefix='/clubs', tags=['Clubs'])
service = ClubService()


@router.get('/', response_model=ClubListResponse, summary='List clubs')
async def list_clubs(db: AsyncSession = Depends(get_db)):
    clubs = await service.list(db)
    return {'items': clubs, 'total': len(clubs)}


@router.post('/', response_model=ClubResponse, summary='Create club', status_code=201)
async def create_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'seasons.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.season import SeasonCreate, SeasonListResponse, SeasonResponse
from app.services.season_service import SeasonService

router = APIRouter(prefix='/seasons', tags=['Seasons'])
service = SeasonService()


@router.get('/', response_model=SeasonListResponse, summary='List seasons')
async def list_seasons(db: AsyncSession = Depends(get_db)):
    seasons = await service.list(db)
    return {'items': seasons, 'total': len(seasons)}


@router.post('/', response_model=SeasonResponse, summary='Create season', status_code=201)
async def create_season(
    payload: SeasonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'user_profiles.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.user_profile import (
    UserProfileCreate,
    UserProfileListResponse,
    UserProfileResponse,
)
from app.services.user_profile_service import UserProfileService

router = APIRouter(prefix='/user-profiles', tags=['User Profiles'])
service = UserProfileService()


@router.get('/', response_model=UserProfileListResponse, summary='List user profiles')
async def list_user_profiles(db: AsyncSession = Depends(get_db)):
    profiles = await service.list(db)
    return {'items': profiles, 'total': len(profiles)}


@router.post('/', response_model=UserProfileResponse, summary='Create user profile', status_code=201)
async def create_user_profile(
    payload: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'players.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.player import PlayerCreate, PlayerListResponse, PlayerResponse
from app.services.player_service import PlayerService

router = APIRouter(prefix='/players', tags=['Players'])
service = PlayerService()


@router.get('/', response_model=PlayerListResponse, summary='List players')
async def list_players(db: AsyncSession = Depends(get_db)):
    players = await service.list(db)
    return {'items': players, 'total': len(players)}


@router.post('/', response_model=PlayerResponse, summary='Create player', status_code=201)
async def create_player(
    payload: PlayerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'club_members.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.club_member import (
    ClubMemberCreate,
    ClubMemberListResponse,
    ClubMemberResponse,
)
from app.services.club_member_service import ClubMemberService

router = APIRouter(prefix='/club-members', tags=['Club Members'])
service = ClubMemberService()


@router.get('/', response_model=ClubMemberListResponse, summary='List club members')
async def list_club_members(db: AsyncSession = Depends(get_db)):
    members = await service.list(db)
    return {'items': members, 'total': len(members)}


@router.post('/', response_model=ClubMemberResponse, summary='Create club member', status_code=201)
async def create_club_member(
    payload: ClubMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'registrations.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationListResponse,
    RegistrationResponse,
)
from app.services.registration_service import RegistrationService

router = APIRouter(prefix='/registrations', tags=['Registrations'])
service = RegistrationService()


@router.get('/', response_model=RegistrationListResponse, summary='List registrations')
async def list_registrations(db: AsyncSession = Depends(get_db)):
    registrations = await service.list(db)
    return {'items': registrations, 'total': len(registrations)}


@router.post('/', response_model=RegistrationResponse, summary='Create registration', status_code=201)
async def create_registration(
    payload: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'transfers.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.transfer import TransferCreate, TransferListResponse, TransferResponse
from app.services.transfer_service import TransferService

router = APIRouter(prefix='/transfers', tags=['Transfers'])
service = TransferService()


@router.get('/', response_model=TransferListResponse, summary='List transfers')
async def list_transfers(db: AsyncSession = Depends(get_db)):
    transfers = await service.list(db)
    return {'items': transfers, 'total': len(transfers)}


@router.post('/', response_model=TransferResponse, summary='Create transfer', status_code=201)
async def create_transfer(
    payload: TransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'transfer_approvals.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.transfer_approval import (
    TransferApprovalCreate,
    TransferApprovalListResponse,
    TransferApprovalResponse,
)
from app.services.transfer_approval_service import TransferApprovalService

router = APIRouter(prefix='/transfer-approvals', tags=['Transfer Approvals'])
service = TransferApprovalService()


@router.get('/', response_model=TransferApprovalListResponse, summary='List transfer approvals')
async def list_transfer_approvals(db: AsyncSession = Depends(get_db)):
    approvals = await service.list(db)
    return {'items': approvals, 'total': len(approvals)}


@router.post('/', response_model=TransferApprovalResponse, summary='Create transfer approval', status_code=201)
async def create_transfer_approval(
    payload: TransferApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'documents.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.document import DocumentCreate, DocumentListResponse, DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix='/documents', tags=['Documents'])
service = DocumentService()


@router.get('/', response_model=DocumentListResponse, summary='List documents')
async def list_documents(db: AsyncSession = Depends(get_db)):
    documents = await service.list(db)
    return {'items': documents, 'total': len(documents)}


@router.post('/', response_model=DocumentResponse, summary='Create document', status_code=201)
async def create_document(
    payload: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'notifications.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.notification import (
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix='/notifications', tags=['Notifications'])
service = NotificationService()


@router.get('/', response_model=NotificationListResponse, summary='List notifications')
async def list_notifications(db: AsyncSession = Depends(get_db)):
    notifications = await service.list(db)
    return {'items': notifications, 'total': len(notifications)}


@router.post('/', response_model=NotificationResponse, summary='Create notification', status_code=201)
async def create_notification(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'app', 'api', 'v1', 'endpoints', 'audit_logs.py'): '''from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.audit import AuditLogCreate, AuditLogListResponse, AuditLogResponse
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix='/audit-logs', tags=['Audit Logs'])
service = AuditLogService()


@router.get('/', response_model=AuditLogListResponse, summary='List audit logs')
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    audit_logs = await service.list(db)
    return {'items': audit_logs, 'total': len(audit_logs)}


@router.post('/', response_model=AuditLogResponse, summary='Create audit log', status_code=201)
async def create_audit_log(
    payload: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
''',
    os.path.join(root, 'tests', 'test_clubs.py'): '''from app.services.club_service import ClubService


def test_club_service_is_available() -> None:
    assert ClubService is not None
''',
    os.path.join(root, 'tests', 'test_seasons.py'): '''from app.services.season_service import SeasonService


def test_season_service_is_available() -> None:
    assert SeasonService is not None
''',
    os.path.join(root, 'tests', 'test_user_profiles.py'): '''from app.services.user_profile_service import UserProfileService


def test_user_profile_service_is_available() -> None:
    assert UserProfileService is not None
''',
    os.path.join(root, 'tests', 'test_players.py'): '''from app.services.player_service import PlayerService


def test_player_service_is_available() -> None:
    assert PlayerService is not None
''',
    os.path.join(root, 'tests', 'test_club_members.py'): '''from app.services.club_member_service import ClubMemberService


def test_club_member_service_is_available() -> None:
    assert ClubMemberService is not None
''',
    os.path.join(root, 'tests', 'test_registrations.py'): '''from app.services.registration_service import RegistrationService


def test_registration_service_is_available() -> None:
    assert RegistrationService is not None
''',
    os.path.join(root, 'tests', 'test_transfers.py'): '''from app.services.transfer_service import TransferService


def test_transfer_service_is_available() -> None:
    assert TransferService is not None
''',
    os.path.join(root, 'tests', 'test_transfer_approvals.py'): '''from app.services.transfer_approval_service import TransferApprovalService


def test_transfer_approval_service_is_available() -> None:
    assert TransferApprovalService is not None
''',
    os.path.join(root, 'tests', 'test_documents.py'): '''from app.services.document_service import DocumentService


def test_document_service_is_available() -> None:
    assert DocumentService is not None
''',
    os.path.join(root, 'tests', 'test_notifications.py'): '''from app.services.notification_service import NotificationService


def test_notification_service_is_available() -> None:
    assert NotificationService is not None
''',
    os.path.join(root, 'tests', 'test_audit_logs.py'): '''from app.services.audit_log_service import AuditLogService


def test_audit_log_service_is_available() -> None:
    assert AuditLogService is not None
''',
}

for path, content in files.items():
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)

print('Scaffold complete.')
''