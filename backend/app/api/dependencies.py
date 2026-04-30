from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.core.cache import cache
from app.db.mongodb import mongodb
from app.repositories.offer_repository import OfferRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.services.otp_service import OTPService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db():
    return mongodb.db


def get_user_repository(db=Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_offer_repository(db=Depends(get_db)) -> OfferRepository:
    return OfferRepository(db)


def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> AuthService:
    return AuthService(user_repo)


def get_cache():
    return cache.client


def get_otp_service(cache_client=Depends(get_cache)) -> OTPService:
    return OTPService(cache_client)


def get_email_service() -> EmailService:
    return EmailService()


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    try:
        payload = decode_access_token(token)
        return {"user_id": payload.get("sub"), "role": payload.get("role")}
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
