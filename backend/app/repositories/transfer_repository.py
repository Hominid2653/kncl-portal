from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import TransferStatus
from app.models.transfer import Transfer
from app.repositories.base_repository import BaseRepository


class TransferRepository(BaseRepository[Transfer]):
    def __init__(self):
        super().__init__(Transfer)

    async def get_by_registration(self, db: AsyncSession, registration_id: UUID):
        result = await db.execute(
            select(Transfer).where(Transfer.registration_id == registration_id)
        )
        return list(result.scalars().all())

    async def get_pending_for_registration(
        self,
        db: AsyncSession,
        registration_id: UUID,
    ) -> Transfer | None:
        result = await db.execute(
            select(Transfer).where(
                Transfer.registration_id == registration_id,
                Transfer.status == TransferStatus.PENDING,
            )
        )
        return result.scalar_one_or_none()
