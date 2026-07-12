from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel
import os


ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_PATH)


class Settings(BaseModel):
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongodb_db: str = os.getenv(
        "MONGODB_DB_NAME",
        os.getenv("MONGODB_DB", "student_performance"),
    )
    pass_mark: int = int(os.getenv("PASS_MARK", "40"))
    app_name: str = "Student Academic Performance Visualization & Analytics System"


@lru_cache
def get_settings() -> Settings:
    return Settings()
