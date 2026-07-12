from datetime import datetime
from typing import Any

from bson import ObjectId


def serialize_document(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_document(item) for item in value]
    if isinstance(value, dict):
        serialized = {key: serialize_document(item) for key, item in value.items()}
        if "_id" in serialized:
            serialized["id"] = serialized.pop("_id")
        return serialized
    return value
