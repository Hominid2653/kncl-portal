from uuid import UUID

from sqlalchemy import JSON, TypeDecorator
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class UUIDList(TypeDecorator):
    """UUID list stored as PostgreSQL ARRAY; JSON fallback for SQLite tests."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(ARRAY(PG_UUID(as_uuid=True)))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return list(value)
        return [str(item) for item in value]

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return [item if isinstance(item, UUID) else UUID(str(item)) for item in value]
