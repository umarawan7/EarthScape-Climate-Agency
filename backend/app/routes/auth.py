from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.dependencies import get_current_user
from app.core.security import TokenError, decode_token
from app.models.user import RefreshTokenRequest, ResetPasswordRequest, TokenPair, UserCreate, UserLogin
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/self-register")
async def self_register(payload: UserCreate) -> dict:
    return await AuthService().self_register(payload)


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest) -> dict:
    return await AuthService().reset_password(payload.email, payload.new_password)


@router.post("/register")
async def register(payload: UserCreate, authorization: str | None = Header(default=None)) -> dict:
    actor = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            decoded = decode_token(token)
            if decoded.get("type") == "access" and decoded.get("sub"):
                actor = await AuthService().get_by_id(decoded["sub"])
        except TokenError:
            raise HTTPException(status_code=401, detail="Invalid bearer token")

    return await AuthService().register_user(payload, actor)


@router.post("/login", response_model=TokenPair)
async def login(payload: UserLogin) -> TokenPair:
    return await AuthService().login(payload.email, payload.password)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshTokenRequest) -> TokenPair:
    return await AuthService().refresh(payload.refresh_token)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
