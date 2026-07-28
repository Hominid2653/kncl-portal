from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.base_repository import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    async def get_by_user(self, db: AsyncSession, user_profile_id: str):
        result = await db.execute(
            select(AuditLog).where(AuditLog.user_profile_id == user_profile_id)
        )
        return result.scalars().all()
