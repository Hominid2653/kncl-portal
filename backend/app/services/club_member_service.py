from app.core.exceptions import DuplicateResource
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
