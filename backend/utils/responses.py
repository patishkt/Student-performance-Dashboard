from typing import Any


def api_response(success: bool = True, data: Any = None, message: str = "") -> dict:
    return {
        "success": success,
        "data": data,
        "message": message,
    }
