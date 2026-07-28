from typing import Any


def parse_filters(filter_expressions: list[str] | None) -> dict[str, Any]:
    if not filter_expressions:
        return {}

    filters: dict[str, Any] = {}
    for expression in filter_expressions:
        if "=" not in expression:
            continue
        key, value = expression.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key and value:
            filters[key] = value
    return filters
