from app.core.exceptions import DuplicateResource
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
