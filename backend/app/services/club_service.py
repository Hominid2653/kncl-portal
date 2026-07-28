from app.core.exceptions import DuplicateResource
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
