from typing import Generic, TypeVar

from app.core.exceptions import ResourceNotFound
from app.repositories.base_repository import BaseRepository

ModelType = TypeVar('ModelType')


class BaseService(Generic[ModelType]):
    def __init__(self, repository: BaseRepository[ModelType]):
        self.repository = repository

    async def list(self, db):
        return await self.repository.get_all(db)

    async def get(self, db, obj_id):
        obj = await self.repository.get_by_id(db, obj_id)
        if not obj:
            raise ResourceNotFound(f'{self.repository.model.__name__} not found.')
        return obj

    async def create(self, db, obj):
        return await self.repository.create(db, obj)

    async def update(self, db, obj_id, obj_in: dict):
        obj = await self.get(db, obj_id)
        return await self.repository.update(db, obj, obj_in)

    async def delete(self, db, obj_id):
        obj = await self.get(db, obj_id)
        await self.repository.delete(db, obj)
        return obj
