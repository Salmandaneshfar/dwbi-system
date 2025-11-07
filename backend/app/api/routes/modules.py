from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api import deps
from app.models import Module
from app.schemas import ModuleCreate, ModuleRead, ModuleUpdate
from app.services import modules as module_service

router = APIRouter()


@router.get("/", response_model=list[ModuleRead])
def list_modules(
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> Sequence[ModuleRead]:
    mods = module_service.list_modules(session)
    return [ModuleRead.model_validate(m) for m in mods]


@router.post("/", response_model=ModuleRead, status_code=status.HTTP_201_CREATED)
def create_module(
    module: ModuleCreate,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> ModuleRead:
    existing = module_service.get_module(session, module.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Module already exists")
    created = module_service.create_module(session, Module(**module.model_dump()))
    return ModuleRead.model_validate(created)


@router.get("/{module_id}", response_model=ModuleRead)
def read_module(
    module_id: str,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> ModuleRead:
    mod = module_service.get_module(session, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return ModuleRead.model_validate(mod)


@router.patch("/{module_id}", response_model=ModuleRead)
def update_module(
    module_id: str,
    payload: ModuleUpdate,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> ModuleRead:
    mod = module_service.get_module(session, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    updated = module_service.update_module(session, mod, **payload.model_dump(exclude_none=True))
    return ModuleRead.model_validate(updated)


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: str,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> None:
    mod = module_service.get_module(session, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    module_service.delete_module(session, mod)

