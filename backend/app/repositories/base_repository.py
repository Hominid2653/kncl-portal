from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, model):
        self.model = model

    async def get_by_id(
        self,
        db: AsyncSession,
        obj_id: UUID,
    ):
        result = await db.execute(
            select(self.model).where(self.model.id == obj_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(self.model))
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj):
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def delete(self, db: AsyncSession, obj):
        await db.delete(obj)
        await db.commit()