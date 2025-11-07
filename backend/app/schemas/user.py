from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    full_name: str | None = None
    role: str = "admin"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True

