from collections.abc import Callable

from fastapi import Depends

from app.core.rate_limit import external_lookup_limiter
from app.dependencies.auth import CurrentUser, require_authenticated
from app.models.enums import UserRole


def require_external_lookup_access() -> Callable:
    allowed_roles = {
        UserRole.PLAYER,
        UserRole.CLUB_ADMIN,
        UserRole.LEAGUE_COORDINATOR,
        UserRole.FEDERATION_ADMIN,
    }

    async def guard(current_user: CurrentUser = Depends(require_authenticated)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            from app.core.exceptions import Forbidden

            raise Forbidden("You do not have permission to perform external account lookups.")
        external_lookup_limiter.check(str(current_user.id))
        return current_user

    return guard


require_external_lookup = require_external_lookup_access()
