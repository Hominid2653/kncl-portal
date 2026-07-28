from uuid import UUID

from app.core.exceptions import DuplicateResource
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

    async def update(self, db, obj_id: UUID, obj_in: dict):
        if "name" in obj_in:
            existing = await self.repository.get_by_name(db, obj_in["name"])
            if existing and existing.id != obj_id:
                raise DuplicateResource("League already exists.")

        return await super().update(db, obj_id, obj_in)
