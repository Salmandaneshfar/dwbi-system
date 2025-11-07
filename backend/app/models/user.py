from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    full_name: str | None = Field(default=None)
    role: str = Field(default="admin")
    hashed_password: str = Field(sa_column=Column("password_hash", String, nullable=False))
    is_active: bool = Field(default=True)

