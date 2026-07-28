from typing import Any

from app.core.exceptions import DuplicateResource
from app.models.player import Player
from app.repositories.player_repository import PlayerRepository
from app.schemas.player import PlayerCreate
from app.services.base_services import BaseService


class PlayerService(BaseService[Player]):
    def __init__(self):
        super().__init__(PlayerRepository())

    async def create(self, db, data: PlayerCreate):
        if data.fide_id:
            existing = await self.repository.get_by_fide_id(db, data.fide_id)
            if existing:
                raise DuplicateResource('Player already exists with that FIDE ID.')

        player = Player(**data.model_dump())
        return await super().create(db, player)

    async def update(
        self,
        db,
        obj_id,
        obj_in: dict[str, Any],
        *,
        sync_lichess: bool = False,
        sync_chesscom: bool = False,
        skip_external_validation: bool = False,
    ):
        existing = await self.get(db, obj_id)
        updates = dict(obj_in)

        if not skip_external_validation:
            if "lichess_username" in updates:
                await self._apply_lichess_username_change(
                    existing,
                    updates,
                    sync=sync_lichess,
                )
            if "chesscom_username" in updates:
                await self._apply_chesscom_username_change(
                    existing,
                    updates,
                    sync=sync_chesscom,
                )

        return await super().update(db, obj_id, updates)

    async def _apply_lichess_username_change(
        self,
        existing: Player,
        updates: dict[str, Any],
        *,
        sync: bool,
    ) -> None:
        new_username = updates.get("lichess_username")
        if new_username == existing.lichess_username:
            updates.pop("lichess_username", None)
            return

        updates["lichess_verified"] = False
        updates["lichess_verified_at"] = None
        updates["lichess_user_id"] = None
        updates["lichess_verification_code"] = None

        if not new_username:
            return

        from app.services.lichess_service import LichessService

        profile = await LichessService(player_service=self).lookup_user(new_username)
        updates["lichess_user_id"] = profile.external_user_id
        if sync:
            updates["blitz_rating"] = profile.ratings.blitz
            updates["rapid_rating"] = profile.ratings.rapid
            updates["classical_rating"] = profile.ratings.classical

    async def _apply_chesscom_username_change(
        self,
        existing: Player,
        updates: dict[str, Any],
        *,
        sync: bool,
    ) -> None:
        new_username = updates.get("chesscom_username")
        if new_username == existing.chesscom_username:
            updates.pop("chesscom_username", None)
            return

        updates["chesscom_verified"] = False
        updates["chesscom_verified_at"] = None
        updates["chesscom_verification_code"] = None

        if not new_username:
            return

        from app.services.chesscom_service import ChessComService

        profile = await ChessComService(player_service=self).lookup_user(new_username)
        if sync:
            updates["blitz_rating"] = profile.ratings.blitz
            updates["rapid_rating"] = profile.ratings.rapid
            updates["classical_rating"] = profile.ratings.classical
