from app.core.exceptions import DuplicateResource, ResourceNotFound
from app.models.league import League
from app.repositories.league_repository import LeagueRepository
from app.schemas.league import LeagueCreate


class LeagueService:
    def __init__(self):
        self.repository = LeagueRepository()

    async def create(
        self,
        db,
        data: LeagueCreate,
    ):
        existing = await self.repository.get_by_name(
            db,
            data.name,
        )

        if existing:
            raise DuplicateResource("League already exists.")

        league = League(**data.model_dump())

        return await self.repository.create(
            db,
            league,
        )

    async def list(self, db):
        return await self.repository.get_all(db)

    async def get(self, db, league_id):
        league = await self.repository.get_by_id(
            db,
            league_id,
        )

        if not league:
            raise ResourceNotFound("League not found.")

        return league
