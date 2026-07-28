from enum import Enum


class UserRole(str, Enum):
    PLAYER = "PLAYER"
    CLUB_ADMIN = "CLUB_ADMIN"
    LEAGUE_COORDINATOR = "LEAGUE_COORDINATOR"
    FEDERATION_ADMIN = "FEDERATION_ADMIN"


class RegistrationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TransferStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ApprovalDecision(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"