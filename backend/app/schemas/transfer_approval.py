from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import ApprovalDecision
from app.schemas.common import ListResponse, TimestampSchema


class TransferApprovalCreate(BaseModel):
    transfer_id: UUID
    approved_by: UUID
    decision: ApprovalDecision
    remarks: str | None = None
    approved_at: datetime


class TransferApprovalUpdate(BaseModel):
    decision: ApprovalDecision | None = None
    remarks: str | None = None


class TransferApprovalResponse(TimestampSchema):
    transfer_id: UUID
    approved_by: UUID
    decision: ApprovalDecision
    remarks: str | None = None
    approved_at: datetime


class TransferApprovalListResponse(ListResponse):
    items: list[TransferApprovalResponse]
