from app.models.transfer_approval import TransferApproval
from app.repositories.transfer_approval_repository import TransferApprovalRepository
from app.schemas.transfer_approval import TransferApprovalCreate
from app.services.base_services import BaseService


class TransferApprovalService(BaseService[TransferApproval]):
    def __init__(self):
        super().__init__(TransferApprovalRepository())

    async def create(self, db, data: TransferApprovalCreate):
        approval = TransferApproval(**data.model_dump())
        return await super().create(db, approval)
