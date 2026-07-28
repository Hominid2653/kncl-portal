import secrets
from datetime import UTC, datetime

from app.models.player import Player
from app.schemas.external_accounts import (
    ExternalAccountProfile,
    ExternalRatingDetails,
    ExternalRatings,
    PlayerExternalAccountComparison,
    RatingConfidence,
    RatingDrift,
)

VERIFICATION_PREFIX = "KNCL"


def generate_verification_code() -> str:
    return f"{VERIFICATION_PREFIX}-{secrets.token_hex(3).upper()}"


def utc_now() -> datetime:
    return datetime.now(UTC)


def _confidence_from_perf(perf: dict | None) -> RatingConfidence | None:
    if not perf:
        return None
    rating = perf.get("rating")
    return RatingConfidence(
        rating=int(rating) if rating is not None else None,
        games=int(perf.get("games") or 0),
        provisional=bool(perf.get("prov")),
    )


def lichess_timestamp_to_datetime(value: int | None) -> datetime | None:
    if value is None:
        return None
    seconds = value / 1000 if value > 10_000_000_000 else value
    return datetime.fromtimestamp(seconds, tz=UTC)


def chesscom_timestamp_to_datetime(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value, tz=UTC)


def lichess_to_profile(
    data: dict,
    *,
    player: Player | None = None,
    stored_username: str | None = None,
) -> ExternalAccountProfile:
    perfs = data.get("perfs") or {}
    profile = data.get("profile") or {}
    username = data["username"]
    first_name = profile.get("firstName") or ""
    last_name = profile.get("lastName") or ""
    display_name = " ".join(part for part in [first_name, last_name] if part).strip() or None

    return ExternalAccountProfile(
        username=username,
        external_user_id=data.get("id"),
        title=data.get("title"),
        display_name=display_name,
        profile_url=data.get("url") or f"https://lichess.org/@/{username}",
        country=profile.get("country"),
        fide_rating=profile.get("fideRating"),
        ratings=ExternalRatings(
            bullet=_rating_from_perfs(perfs, "bullet"),
            blitz=_rating_from_perfs(perfs, "blitz"),
            rapid=_rating_from_perfs(perfs, "rapid"),
            classical=_rating_from_perfs(perfs, "classical"),
        ),
        rating_details=ExternalRatingDetails(
            bullet=_confidence_from_perf(perfs.get("bullet")),
            blitz=_confidence_from_perf(perfs.get("blitz")),
            rapid=_confidence_from_perf(perfs.get("rapid")),
            classical=_confidence_from_perf(perfs.get("classical")),
        ),
        account_created_at=lichess_timestamp_to_datetime(data.get("createdAt")),
        last_seen_at=lichess_timestamp_to_datetime(data.get("seenAt")),
        portal_verified=player.lichess_verified if player else False,
        portal_verified_at=player.lichess_verified_at if player else None,
        matches_stored_username=(
            stored_username.lower() == username.lower()
            if stored_username
            else None
        ),
    )


def chesscom_country_code(country_url: str | None) -> str | None:
    if not country_url:
        return None
    return country_url.rstrip("/").split("/")[-1].upper()


def chesscom_rating_from_stats(stats: dict, key: str) -> int | None:
    section = stats.get(key) or {}
    last = section.get("last") or {}
    rating = last.get("rating")
    return int(rating) if rating is not None else None


def chesscom_games_from_stats(stats: dict, key: str) -> int:
    section = stats.get(key) or {}
    record = section.get("record") or {}
    return int(record.get("win", 0) + record.get("loss", 0) + record.get("draw", 0))


def chesscom_to_profile(
    player_data: dict,
    stats: dict,
    *,
    player: Player | None = None,
    stored_username: str | None = None,
) -> ExternalAccountProfile:
    username = player_data["username"]
    return ExternalAccountProfile(
        username=username,
        external_user_id=str(player_data.get("player_id")) if player_data.get("player_id") else None,
        title=player_data.get("title"),
        display_name=player_data.get("name"),
        profile_url=f"https://www.chess.com/member/{username}",
        country=chesscom_country_code(player_data.get("country")),
        avatar_url=player_data.get("avatar"),
        ratings=ExternalRatings(
            bullet=chesscom_rating_from_stats(stats, "chess_bullet"),
            blitz=chesscom_rating_from_stats(stats, "chess_blitz"),
            rapid=chesscom_rating_from_stats(stats, "chess_rapid"),
            classical=chesscom_rating_from_stats(stats, "chess_daily"),
        ),
        rating_details=ExternalRatingDetails(
            bullet=RatingConfidence(
                rating=chesscom_rating_from_stats(stats, "chess_bullet"),
                games=chesscom_games_from_stats(stats, "chess_bullet"),
            ),
            blitz=RatingConfidence(
                rating=chesscom_rating_from_stats(stats, "chess_blitz"),
                games=chesscom_games_from_stats(stats, "chess_blitz"),
            ),
            rapid=RatingConfidence(
                rating=chesscom_rating_from_stats(stats, "chess_rapid"),
                games=chesscom_games_from_stats(stats, "chess_rapid"),
            ),
            classical=RatingConfidence(
                rating=chesscom_rating_from_stats(stats, "chess_daily"),
                games=chesscom_games_from_stats(stats, "chess_daily"),
            ),
        ),
        account_created_at=chesscom_timestamp_to_datetime(player_data.get("joined")),
        portal_verified=player.chesscom_verified if player else False,
        portal_verified_at=player.chesscom_verified_at if player else None,
        matches_stored_username=(
            stored_username.lower() == username.lower()
            if stored_username
            else None
        ),
    )


def _rating_from_perfs(perfs: dict, key: str) -> int | None:
    perf = perfs.get(key) or {}
    rating = perf.get("rating")
    return int(rating) if rating is not None else None


def build_player_comparison(
    *,
    player: Player,
    platform: str,
    live: ExternalAccountProfile,
) -> PlayerExternalAccountComparison:
    stored_ratings = ExternalRatings(
        bullet=None,
        blitz=player.blitz_rating,
        rapid=player.rapid_rating,
        classical=player.classical_rating,
    )
    drift = {
        "blitz": RatingDrift(
            stored=player.blitz_rating,
            live=live.ratings.blitz,
            drift=_drift(player.blitz_rating, live.ratings.blitz),
        ),
        "rapid": RatingDrift(
            stored=player.rapid_rating,
            live=live.ratings.rapid,
            drift=_drift(player.rapid_rating, live.ratings.rapid),
        ),
        "classical": RatingDrift(
            stored=player.classical_rating,
            live=live.ratings.classical,
            drift=_drift(player.classical_rating, live.ratings.classical),
        ),
    }
    stored_username = player.lichess_username if platform == "lichess" else player.chesscom_username
    verified = player.lichess_verified if platform == "lichess" else player.chesscom_verified
    verified_at = player.lichess_verified_at if platform == "lichess" else player.chesscom_verified_at

    return PlayerExternalAccountComparison(
        player_id=player.id,
        platform=platform,
        stored_username=stored_username,
        matches_stored_username=bool(
            stored_username and stored_username.lower() == live.username.lower()
        ),
        portal_verified=verified,
        portal_verified_at=verified_at,
        live=live,
        stored_ratings=stored_ratings,
        drift=drift,
    )


def _drift(stored: int | None, live: int | None) -> int | None:
    if stored is None or live is None:
        return None
    return live - stored


def names_match(display_name: str | None, first_name: str, last_name: str) -> bool:
    if not display_name:
        return False
    normalized = display_name.lower()
    return first_name.lower() in normalized and last_name.lower() in normalized
