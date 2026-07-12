from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from backend.config import get_settings


settings = get_settings()
client: MongoClient = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
db: Database = client[settings.mongodb_db]


def get_students_collection() -> Collection:
    return db["students"]


def create_indexes() -> None:
    students = get_students_collection()
    students.create_index([("roll_number", ASCENDING)], unique=True)
    students.create_index([("department", ASCENDING)])
    students.create_index([("class", ASCENDING)])
    students.create_index([("semester", ASCENDING)])
    students.create_index([("grade", ASCENDING)])
    students.create_index([("gender", ASCENDING)])


def ping_database() -> bool:
    client.admin.command("ping")
    return True
