from app.seed.data import LEAGUE_ID, PLAYER_1_ID
from app.seed.seeder import is_seeded, seed_database


def test_seed_data_has_fixed_ids() -> None:
    assert str(LEAGUE_ID) == "11111111-1111-4111-8111-111111111101"
    assert str(PLAYER_1_ID) == "44444444-4444-4444-8444-444444444401"


def test_seed_functions_are_importable() -> None:
    assert callable(is_seeded)
    assert callable(seed_database)
