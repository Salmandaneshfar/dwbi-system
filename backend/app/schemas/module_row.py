from pydantic import BaseModel


class ModuleRowBase(BaseModel):
    data: list[str]


class ModuleRowCreate(ModuleRowBase):
    idx: int | None = None


class ModuleRowUpdate(BaseModel):
    data: list[str] | None = None


class ModuleRowRead(ModuleRowBase):
    id: int
    module_id: str
    idx: int

    class Config:
        from_attributes = True

