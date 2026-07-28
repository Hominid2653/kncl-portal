from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit import AuditLogCreate
from app.services.base_services import BaseService


class AuditLogService(BaseService[AuditLog]):
    def __init__(self):
        super().__init__(AuditLogRepository())

    async def create(self, db, data: AuditLogCreate):
        audit_log = AuditLog(**data.model_dump())
        return await super().create(db, audit_log)
