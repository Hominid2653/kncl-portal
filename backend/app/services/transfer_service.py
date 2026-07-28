from app.models.transfer import Transfer
from app.repositories.transfer_repository import TransferRepository
from app.schemas.transfer import TransferCreate
from app.services.base_services import BaseService


class TransferService(BaseService[Transfer]):
    def __init__(self):
        super().__init__(TransferRepository())

    async def create(self, db, data: TransferCreate):
        transfer = Transfer(**data.model_dump())
        return await super().create(db, transfer)
