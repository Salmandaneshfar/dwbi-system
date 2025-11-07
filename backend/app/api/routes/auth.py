from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token
from app.schemas import LoginRequest, Token, UserRead
from app.services.users import authenticate_user

router = APIRouter()


@router.post("/login", response_model=Token)
def login(data: LoginRequest, session: Session = Depends(get_db)) -> Token:
    user = authenticate_user(session, data.username, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    token = create_access_token(subject=user.username)
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def read_me(current_user=Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)

