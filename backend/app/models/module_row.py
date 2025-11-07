from typing import Optional

from sqlalchemy import Column, ForeignKey, JSON
from sqlmodel import Field, SQLModel


class ModuleRow(SQLModel, table=True):
    __tablename__ = "module_rows"

    id: Optional[int] = Field(default=None, primary_key=True)
    module_id: str = Field(foreign_key="modules.id", index=True)
    idx: int = Field(index=True)
    data: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

