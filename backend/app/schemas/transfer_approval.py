from datetime import datetime
from pydantic import BaseModel

from app.models.enums import ApprovalDecision
from app.schemas.common import ListResponse, TimestampSchema


class TransferApprovalCreate(BaseModel):
    transfer_id: str
    approved_by: str
    decision: ApprovalDecision
    remarks: str | None = None
    approved_at: datetime


class TransferApprovalUpdate(BaseModel):
    decision: ApprovalDecision | None = None
    remarks: str | None = None


class TransferApprovalResponse(TimestampSchema):
    transfer_id: str
    approved_by: str
    decision: ApprovalDecision
    remarks: str | None = None
    approved_at: datetime


class TransferApprovalListResponse(ListResponse):
    items: list[TransferApprovalResponse]
