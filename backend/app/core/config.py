from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Infra360 API"
    version: str = "0.1.0"
    environment: str = "development"
    secret_key: str = Field(min_length=32)
    access_token_expire_minutes: int = 60 * 8

    initial_admin_username: str = "admin"
    initial_admin_password: str = Field(min_length=12)
    initial_admin_full_name: str = "System Administrator"

    # Keep the existing database filename for backward compatibility.
    database_url: str = f"sqlite:///{BASE_DIR / 'dwbi.db'}"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

