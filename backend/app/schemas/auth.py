from datetime import datetime

from pydantic import BaseModel, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None

    @field_validator("exp")
    @classmethod
    def validate_exp(cls, value: int | None) -> int | None:
        if value is None:
            return value
        if datetime.utcfromtimestamp(value) < datetime.utcnow():
            raise ValueError("Token expired")
        return value

