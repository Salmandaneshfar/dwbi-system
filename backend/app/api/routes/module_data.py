from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api import deps
from app.models import ModuleRow
from app.schemas import ModuleRowCreate, ModuleRowRead, ModuleRowUpdate
from app.services import module_data as data_service
from app.services import modules as module_service

router = APIRouter()


@router.get("/{module_id}/rows", response_model=list[ModuleRowRead])
def list_module_rows(
    module_id: str,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> list[ModuleRowRead]:
    module = module_service.get_module(session, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    rows = data_service.list_rows(session, module_id)
    return [ModuleRowRead.model_validate(row) for row in rows]


@router.post("/{module_id}/rows", response_model=ModuleRowRead, status_code=status.HTTP_201_CREATED)
def upsert_module_row(
    module_id: str,
    payload: ModuleRowCreate,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> ModuleRowRead:
    module = module_service.get_module(session, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    if payload.idx is not None:
        existing = data_service.get_row_by_index(session, module_id, payload.idx)
        if existing:
            updated = data_service.update_row(session, existing, payload.data)
            return ModuleRowRead.model_validate(updated)
        idx = payload.idx
    else:
        idx = data_service.get_next_index(session, module_id)

    created = data_service.create_row(session, ModuleRow(module_id=module_id, idx=idx, data=payload.data))
    return ModuleRowRead.model_validate(created)


@router.patch("/{module_id}/rows/{idx}", response_model=ModuleRowRead)
def update_module_row(
    module_id: str,
    idx: int,
    payload: ModuleRowUpdate,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> ModuleRowRead:
    module = module_service.get_module(session, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    row = data_service.get_row_by_index(session, module_id, idx)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")

    if payload.data is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No data provided")

    updated = data_service.update_row(session, row, payload.data)
    return ModuleRowRead.model_validate(updated)


@router.delete("/{module_id}/rows/{idx}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module_row(
    module_id: str,
    idx: int,
    session: Session = Depends(deps.get_db),  # noqa: B008
    _: object = Depends(deps.get_current_user),
) -> None:
    module = module_service.get_module(session, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    row = data_service.get_row_by_index(session, module_id, idx)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")

    data_service.delete_row(session, row)

