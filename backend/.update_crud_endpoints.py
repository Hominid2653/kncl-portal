from pathlib import Path

base_repo = Path('app/repositories/base_repository.py')
base_repo.write_text('''from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar('ModelType')


class BaseRepository(Generic[ModelType]):
    def __init__(self, model):
        self.model = model

    async def get_by_id(self, db: AsyncSession, obj_id: UUID):
        result = await db.execute(select(self.model).where(self.model.id == obj_id))
        return result.scalar_one_or_none()

    def _apply_query_options(
        self,
        query,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
    ):
        if filters:
            for field, value in filters.items():
                if value is None:
                    continue
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)

        if search and search_fields:
            conditions = [
                getattr(self.model, field).ilike(f"%{search}%")
                for field in search_fields
                if hasattr(self.model, field)
            ]
            if conditions:
                query = query.where(or_(*conditions))

        return query

    async def get_all(
        self,
        db: AsyncSession,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
        sort_by: str | None = None,
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 20,
    ):
        query = select(self.model)
        query = self._apply_query_options(query, filters, search, search_fields)

        if sort_by and hasattr(self.model, sort_by):
            order_attr = getattr(self.model, sort_by)
            query = query.order_by(desc(order_attr) if sort_order.lower() == "desc" else asc(order_attr))
        elif hasattr(self.model, "created_at"):
            query = query.order_by(desc(getattr(self.model, "created_at")))

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        return result.scalars().all()

    async def count(
        self,
        db: AsyncSession,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
    ):
        query = select(func.count()).select_from(self.model)
        query = self._apply_query_options(query, filters, search, search_fields)
        result = await db.execute(query)
        return result.scalar_one()

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
''')

base_service = Path('app/services/base_services.py')
base_service.write_text('''from typing import Any, Generic, TypeVar

from app.core.exceptions import ResourceNotFound
from app.repositories.base_repository import BaseRepository

ModelType = TypeVar('ModelType')


class BaseService(Generic[ModelType]):
    def __init__(self, repository: BaseRepository[ModelType]):
        self.repository = repository

    async def list(
        self,
        db,
        *,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
        sort_by: str | None = None,
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 20,
    ):
        items = await self.repository.get_all(
            db,
            filters=filters,
            search=search,
            search_fields=search_fields,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )
        total = await self.repository.count(
            db,
            filters=filters,
            search=search,
            search_fields=search_fields,
        )
        return {"items": items, "total": total}

    async def get(self, db, obj_id):
        obj = await self.repository.get_by_id(db, obj_id)
        if not obj:
            raise ResourceNotFound(f"{self.repository.model.__name__} not found.")
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
''')

common = Path('app/api/v1/endpoints/common.py')
common.write_text('''from typing import Any


def parse_filters(filter_expressions: list[str] | None) -> dict[str, Any]:
    if not filter_expressions:
        return {}

    filters: dict[str, Any] = {}
    for expression in filter_expressions:
        if "=" not in expression:
            continue
        key, value = expression.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key and value:
            filters[key] = value
    return filters
''')

endpoint_data = {
    'leagues.py': {
        'model': 'League',
        'tag': 'Leagues',
        'router_prefix': '/leagues',
        'create_schema': 'LeagueCreate',
        'update_schema': 'LeagueUpdate',
        'response_schema': 'LeagueResponse',
        'list_response': 'LeagueListResponse',
        'search_fields': ['name', 'description'],
        'service_module': 'league_services',
        'service_class': 'LeagueService',
        'entity': 'league',
        'has_update': True,
        'has_delete': True,
    },
    'clubs.py': {
        'model': 'Club',
        'tag': 'Clubs',
        'router_prefix': '/clubs',
        'create_schema': 'ClubCreate',
        'update_schema': 'ClubUpdate',
        'response_schema': 'ClubResponse',
        'list_response': 'ClubListResponse',
        'search_fields': ['name', 'county', 'description'],
        'service_module': 'club_service',
        'service_class': 'ClubService',
        'entity': 'club',
        'has_update': True,
        'has_delete': True,
    },
    'seasons.py': {
        'model': 'Season',
        'tag': 'Seasons',
        'router_prefix': '/seasons',
        'create_schema': 'SeasonCreate',
        'update_schema': 'SeasonUpdate',
        'response_schema': 'SeasonResponse',
        'list_response': 'SeasonListResponse',
        'search_fields': ['name'],
        'service_module': 'season_service',
        'service_class': 'SeasonService',
        'entity': 'season',
        'has_update': True,
        'has_delete': True,
    },
    'user_profiles.py': {
        'model': 'UserProfile',
        'tag': 'User Profiles',
        'router_prefix': '/user-profiles',
        'create_schema': 'UserProfileCreate',
        'update_schema': 'UserProfileUpdate',
        'response_schema': 'UserProfileResponse',
        'list_response': 'UserProfileListResponse',
        'search_fields': ['first_name', 'last_name', 'phone'],
        'service_module': 'user_profile_service',
        'service_class': 'UserProfileService',
        'entity': 'user_profile',
        'has_update': True,
        'has_delete': True,
    },
    'players.py': {
        'model': 'Player',
        'tag': 'Players',
        'router_prefix': '/players',
        'create_schema': 'PlayerCreate',
        'update_schema': 'PlayerUpdate',
        'response_schema': 'PlayerResponse',
        'list_response': 'PlayerListResponse',
        'search_fields': ['federation_id', 'fide_id', 'chesscom_username', 'lichess_username', 'nationality'],
        'service_module': 'player_service',
        'service_class': 'PlayerService',
        'entity': 'player',
        'has_update': True,
        'has_delete': True,
    },
    'club_members.py': {
        'model': 'ClubMember',
        'tag': 'Club Members',
        'router_prefix': '/club-members',
        'create_schema': 'ClubMemberCreate',
        'update_schema': 'ClubMemberUpdate',
        'response_schema': 'ClubMemberResponse',
        'list_response': 'ClubMemberListResponse',
        'search_fields': ['position'],
        'service_module': 'club_member_service',
        'service_class': 'ClubMemberService',
        'entity': 'club_member',
        'has_update': True,
        'has_delete': True,
    },
    'registrations.py': {
        'model': 'Registration',
        'tag': 'Registrations',
        'router_prefix': '/registrations',
        'create_schema': 'RegistrationCreate',
        'update_schema': 'RegistrationUpdate',
        'response_schema': 'RegistrationResponse',
        'list_response': 'RegistrationListResponse',
        'search_fields': ['status'],
        'service_module': 'registration_service',
        'service_class': 'RegistrationService',
        'entity': 'registration',
        'has_update': True,
        'has_delete': True,
    },
    'transfers.py': {
        'model': 'Transfer',
        'tag': 'Transfers',
        'router_prefix': '/transfers',
        'create_schema': 'TransferCreate',
        'update_schema': 'TransferUpdate',
        'response_schema': 'TransferResponse',
        'list_response': 'TransferListResponse',
        'search_fields': ['reason', 'status'],
        'service_module': 'transfer_service',
        'service_class': 'TransferService',
        'entity': 'transfer',
        'has_update': True,
        'has_delete': True,
    },
    'transfer_approvals.py': {
        'model': 'TransferApproval',
        'tag': 'Transfer Approvals',
        'router_prefix': '/transfer-approvals',
        'create_schema': 'TransferApprovalCreate',
        'update_schema': 'TransferApprovalUpdate',
        'response_schema': 'TransferApprovalResponse',
        'list_response': 'TransferApprovalListResponse',
        'search_fields': ['remarks', 'decision'],
        'service_module': 'transfer_approval_service',
        'service_class': 'TransferApprovalService',
        'entity': 'transfer_approval',
        'has_update': True,
        'has_delete': True,
    },
    'documents.py': {
        'model': 'Document',
        'tag': 'Documents',
        'router_prefix': '/documents',
        'create_schema': 'DocumentCreate',
        'update_schema': 'DocumentUpdate',
        'response_schema': 'DocumentResponse',
        'list_response': 'DocumentListResponse',
        'search_fields': ['document_type', 'file_name', 'file_url'],
        'service_module': 'document_service',
        'service_class': 'DocumentService',
        'entity': 'document',
        'has_update': True,
        'has_delete': True,
    },
    'notifications.py': {
        'model': 'Notification',
        'tag': 'Notifications',
        'router_prefix': '/notifications',
        'create_schema': 'NotificationCreate',
        'update_schema': 'NotificationUpdate',
        'response_schema': 'NotificationResponse',
        'list_response': 'NotificationListResponse',
        'search_fields': ['title', 'message'],
        'service_module': 'notification_service',
        'service_class': 'NotificationService',
        'entity': 'notification',
        'has_update': True,
        'has_delete': True,
    },
    'audit_logs.py': {
        'model': 'AuditLog',
        'tag': 'Audit Logs',
        'router_prefix': '/audit-logs',
        'create_schema': 'AuditLogCreate',
        'update_schema': None,
        'response_schema': 'AuditLogResponse',
        'list_response': 'AuditLogListResponse',
        'search_fields': ['action', 'entity', 'ip_address'],
        'service_module': 'audit_log_service',
        'service_class': 'AuditLogService',
        'entity': 'audit_log',
        'has_update': False,
        'has_delete': False,
    },
}

endpoint_template = '''from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.{schema_module} import (
    {schema_imports},
)
from app.services.{service_module} import {service_class}

router = APIRouter(prefix='{router_prefix}', tags=['{tag}'])
service = {service_class}()


@router.get('/', response_model={list_response}, summary='List {tag}')
async def list_{entity}(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str | None = Query(None),
    sort_order: str = Query('asc', regex='^(asc|desc)$'),
    search: str | None = Query(None),
    filter: list[str] | None = Query(default=None, alias='filter'),
):
    filters = parse_filters(filter)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields={search_fields},
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get('/{{item_id}}', response_model={response_schema}, summary='Get {model} by id')
async def get_{entity}(item_id: UUID, db: AsyncSession = Depends(get_db)):
    return await service.get(db, item_id)


@router.post('/', response_model={response_schema}, summary='Create {model}', status_code=201)
async def create_{entity}(
    payload: {create_schema},
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)

{{extra_routes}}'''

update_route = '''


@router.patch('/{item_id}', response_model={response_schema}, summary='Update {model}')
async def update_{entity}(
    item_id: UUID,
    payload: {update_schema},
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    payload_data = payload.model_dump(exclude_unset=True)
    return await service.update(db, item_id, payload_data)
'''

delete_route = '''


@router.delete('/{item_id}', status_code=204, summary='Delete {model}')
async def delete_{entity}(item_id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_federation_admin)):
    await service.delete(db, item_id)
    return Response(status_code=204)
'''

for filename, config in endpoint_data.items():
    schema_module = filename[:-3]
    if filename == 'audit_logs.py':
        schema_module = 'audit'
    elif filename == 'transfer_approvals.py':
        schema_module = 'transfer_approval'

    extra_routes = ''
    if config['has_update']:
        extra_routes += update_route.format(
            response_schema=config['response_schema'],
            model=config['model'],
            entity=config['entity'],
            update_schema=config['update_schema'],
        )
    if config['has_delete']:
        extra_routes += delete_route.format(
            model=config['model'],
            entity=config['entity'],
        )

    schema_imports = [
        config['create_schema'],
        config['list_response'],
        config['response_schema'],
    ]
    if config['update_schema']:
        schema_imports.append(config['update_schema'])
    else:
        schema_imports.append('BaseModel')

    content = endpoint_template.format(
        schema_module=schema_module,
        schema_imports=',\n    '.join(schema_imports),
        create_schema=config['create_schema'],
        list_response=config['list_response'],
        response_schema=config['response_schema'],
        update_schema=config['update_schema'] or 'BaseModel',
        service_module=config['service_module'],
        service_class=config['service_class'],
        router_prefix=config['router_prefix'],
        tag=config['tag'],
        search_fields=config['search_fields'],
        model=config['model'],
        entity=config['entity'],
        extra_routes=extra_routes,
    )

    Path('app/api/v1/endpoints').joinpath(filename).write_text(content)

league_service = Path('app/services/league_services.py')
league_service.write_text('''from app.core.exceptions import DuplicateResource
from app.models.league import League
from app.repositories.league_repository import LeagueRepository
from app.schemas.league import LeagueCreate
from app.services.base_services import BaseService


class LeagueService(BaseService[League]):
    def __init__(self):
        super().__init__(LeagueRepository())

    async def create(self, db, data: LeagueCreate):
        existing = await self.repository.get_by_name(db, data.name)
        if existing:
            raise DuplicateResource("League already exists.")

        league = League(**data.model_dump())
        return await super().create(db, league)
''')

print('updated base classes, endpoints, and league service')
