from datetime import datetime

from bson import ObjectId


def mongo_to_public(document: dict) -> dict:
    parsed = {}
    for key, value in document.items():
        if key == "_id":
            parsed["id"] = str(value)
        elif isinstance(value, ObjectId):
            parsed[key] = str(value)
        elif isinstance(value, datetime):
            parsed[key] = value
        else:
            parsed[key] = value
    return parsed
