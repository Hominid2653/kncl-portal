from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.repositories.base_repository import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    def __init__(self):
        super().__init__(Document)

    async def get_by_transfer(self, db: AsyncSession, transfer_id: str):
        result = await db.execute(
            select(Document).where(Document.transfer_id == transfer_id)
        )
        return result.scalars().all()
