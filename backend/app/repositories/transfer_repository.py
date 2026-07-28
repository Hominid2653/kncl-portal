from sqlalchemy import select
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
