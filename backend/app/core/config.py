from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Resource Management API"
    version: str = "0.1.0"
    environment: str = "development"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 8

    database_url: str = f"sqlite:///{BASE_DIR / 'dwbi.db'}"

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

