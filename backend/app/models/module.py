from typing import Optional

from sqlmodel import Field, SQLModel


class Module(SQLModel, table=True):
    __tablename__ = "modules"

    id: str = Field(primary_key=True)
    name: str
    columns: str
    description: Optional[str] = None

