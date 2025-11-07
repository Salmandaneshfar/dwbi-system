from sqlmodel import Session

from app.core.security import get_password_hash
from app.db.session import engine
from app.models import Module, ModuleRow, User
from app.services import module_data as data_service
from app.services import modules as module_service
from app.services import users as user_service


def seed_initial_data() -> None:
    """
    Seed the database with initial data if tables are empty.
    """
    with Session(engine) as session:
        ensure_admin_user(session)
        ensure_default_module(session)


def ensure_admin_user(session: Session) -> None:
    if user_service.get_user_by_username(session, "admin"):
        return
    admin = User(
        username="admin",
        full_name="مدیر سیستم",
        role="admin",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
    )
    session.add(admin)
    session.commit()


def ensure_default_module(session: Session) -> None:
    module_id = "servers"
    if module_service.get_module(session, module_id):
        return

    module = Module(
        id=module_id,
        name="سرورها",
        columns="نام سرور,IP,وضعیت,سیستم‌عامل",
        description="نمونه ماژول اولیه برای مدیریت سرورها",
    )
    session.add(module)
    session.commit()

    rows = [
        ["Server-01", "192.168.1.10", "Active", "Ubuntu 22.04"],
        ["Server-02", "192.168.1.20", "Maintenance", "Windows Server 2019"],
    ]

    for idx, data in enumerate(rows):
        data_service.create_row(
            session,
            ModuleRow(module_id=module_id, idx=idx, data=data),
        )

