from typing import Any


def success_response(
    data: Any,
    message: str = "Success",
):
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def list_response(
    items,
):
    return {
        "success": True,
        "total": len(items),
        "items": items,
    }