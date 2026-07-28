from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar('ModelType')


class BaseRepository(Generic[ModelType]):
    def __init__(self, model):
        self.model = model

    async def get_by_id(self, db: AsyncSession, obj_id: UUID):
        result = await db.execute(select(self.model).where(self.model.id == obj_id))
        return result.scalar_one_or_none()

    async def exists(self, db: AsyncSession, obj_id: UUID) -> bool:
        return await self.get_by_id(db, obj_id) is not None

    def _apply_query_options(
        self,
        query,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
    ):
        if filters:
            for field, value in filters.items():
                if value is None:
                    continue
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)

        if search and search_fields:
            conditions = [
                getattr(self.model, field).ilike(f"%{search}%")
                for field in search_fields
                if hasattr(self.model, field)
            ]
            if conditions:
                query = query.where(or_(*conditions))

        return query

    async def get_all(
        self,
        db: AsyncSession,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
        sort_by: str | None = None,
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 20,
    ):
        query = select(self.model)
        query = self._apply_query_options(query, filters, search, search_fields)

        if sort_by and hasattr(self.model, sort_by):
            order_attr = getattr(self.model, sort_by)
            query = query.order_by(desc(order_attr) if sort_order.lower() == "desc" else asc(order_attr))
        elif hasattr(self.model, "created_at"):
            query = query.order_by(desc(getattr(self.model, "created_at")))

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        return result.scalars().all()

    async def count(
        self,
        db: AsyncSession,
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
    ):
        query = select(func.count()).select_from(self.model)
        query = self._apply_query_options(query, filters, search, search_fields)
        result = await db.execute(query)
        return result.scalar_one()

    async def create(self, db: AsyncSession, obj):
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def update(self, db: AsyncSession, obj, obj_in: dict):
        for field, value in obj_in.items():
            setattr(obj, field, value)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def delete(self, db: AsyncSession, obj):
        await db.delete(obj)
        await db.commit()
