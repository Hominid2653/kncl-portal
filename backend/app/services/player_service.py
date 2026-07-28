from app.core.exceptions import DuplicateResource
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
