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


class ApplicationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class OtpPurpose(str, Enum):
    APPLICATION_SUBMIT = "APPLICATION_SUBMIT"
    STATUS_LOOKUP = "STATUS_LOOKUP"


class TransferSource(str, Enum):
    ENGAGEMENT = "ENGAGEMENT"
    PLAYER_REQUEST = "PLAYER_REQUEST"
    COORDINATOR_MANUAL = "COORDINATOR_MANUAL"


class PlayerCommitmentStatus(str, Enum):
    FREE_AGENT = "FREE_AGENT"
    COMMITTED = "COMMITTED"


class EngagementStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    WITHDRAWN = "WITHDRAWN"


class EngagementRecipientType(str, Enum):
    PLAYER = "PLAYER"
    CLUB_CAPTAIN = "CLUB_CAPTAIN"


class HeadshotSource(str, Enum):
    UPLOAD = "UPLOAD"
    URL = "URL"
    EXTERNAL = "EXTERNAL"