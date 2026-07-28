from app.core.exceptions import DuplicateResource
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
