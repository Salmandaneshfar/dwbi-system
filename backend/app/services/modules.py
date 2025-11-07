from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import Module


def list_modules(session: Session) -> Sequence[Module]:
    statement = select(Module).order_by(Module.name)
    return session.exec(statement).all()


def get_module(session: Session, module_id: str) -> Module | None:
    return session.get(Module, module_id)


def create_module(session: Session, module: Module) -> Module:
    session.add(module)
    session.commit()
    session.refresh(module)
    return module


def update_module(session: Session, module: Module, **updates) -> Module:
    for key, value in updates.items():
        if value is not None:
            setattr(module, key, value)
    session.add(module)
    session.commit()
    session.refresh(module)
    return module


def delete_module(session: Session, module: Module) -> None:
    session.delete(module)
    session.commit()

