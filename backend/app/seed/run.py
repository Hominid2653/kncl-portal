"""Seed the KNCL database with development reference data."""

import argparse
import sys

from app.database.database import SessionLocal
from app.seed.seeder import is_seeded, seed_database


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the KNCL Transfer Portal database.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear all seed tables and re-insert reference data.",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if not args.reset and is_seeded(db):
            print("Database already seeded. Use --reset to clear and reseed.")
            return 0

        counts = seed_database(db, reset=args.reset)
        if counts.get("skipped"):
            print("Database already seeded. Use --reset to clear and reseed.")
            return 0

        print("Database seeded successfully:")
        for resource, count in counts.items():
            print(f"  {resource}: {count}")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
