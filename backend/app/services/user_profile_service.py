from app.core.exceptions import DuplicateResource
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
