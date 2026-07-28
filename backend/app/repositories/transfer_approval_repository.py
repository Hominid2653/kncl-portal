from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer_approval import TransferApproval
from app.repositories.base_repository import BaseRepository


class TransferApprovalRepository(BaseRepository[TransferApproval]):
    def __init__(self):
        super().__init__(TransferApproval)

    async def get_by_transfer(self, db: AsyncSession, transfer_id: str):
        result = await db.execute(
            select(TransferApproval).where(TransferApproval.transfer_id == transfer_id)
        )
        return result.scalars().all()
