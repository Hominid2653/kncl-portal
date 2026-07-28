import pytest

from app.services.external_account_helpers import names_match


def test_names_match_accepts_full_name() -> None:
    assert names_match("Elias Mwangi", "Elias", "Mwangi") is True


def test_names_match_rejects_mismatch() -> None:
    assert names_match("Someone Else", "Elias", "Mwangi") is False
