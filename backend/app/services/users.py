from collections.abc import Sequence

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import User


def get_user_by_username(session: Session, username: str) -> User | None:
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()


def create_user(session: Session, username: str, password: str, full_name: str | None = None, role: str = "admin") -> User:
    user = User(username=username, full_name=full_name, role=role, hashed_password=get_password_hash(password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, username: str, password: str) -> User | None:
    user = get_user_by_username(session, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def list_users(session: Session) -> Sequence[User]:
    statement = select(User)
    return session.exec(statement).all()

