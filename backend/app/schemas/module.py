from pydantic import BaseModel


class ModuleBase(BaseModel):
    id: str
    name: str
    columns: str
    description: str | None = None


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    name: str | None = None
    columns: str | None = None
    description: str | None = None


class ModuleRead(ModuleBase):
    class Config:
        from_attributes = True

