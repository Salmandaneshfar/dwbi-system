from collections.abc import Sequence

from sqlalchemy import func
from sqlmodel import Session, select

from app.models import ModuleRow


def list_rows(session: Session, module_id: str) -> Sequence[ModuleRow]:
    statement = select(ModuleRow).where(ModuleRow.module_id == module_id).order_by(ModuleRow.idx)
    return session.exec(statement).all()


def get_row(session: Session, row_id: int) -> ModuleRow | None:
    return session.get(ModuleRow, row_id)


def get_row_by_index(session: Session, module_id: str, idx: int) -> ModuleRow | None:
    statement = select(ModuleRow).where(ModuleRow.module_id == module_id, ModuleRow.idx == idx)
    return session.exec(statement).first()


def get_next_index(session: Session, module_id: str) -> int:
    statement = select(func.max(ModuleRow.idx)).where(ModuleRow.module_id == module_id)
    result = session.exec(statement).first()
    return (result or 0) + 1 if result is not None else 0


def create_row(session: Session, row: ModuleRow) -> ModuleRow:
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_row(session: Session, row: ModuleRow, data: list[str]) -> ModuleRow:
    row.data = data
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def delete_row(session: Session, row: ModuleRow) -> None:
    session.delete(row)
    session.commit()

