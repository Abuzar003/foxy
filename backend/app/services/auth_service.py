from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.service_taxonomy import category_for_service
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import UserDocument
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    AuthResponse,
    CustomerCreate,
    LoginRequest,
    ProviderCreate,
    Token,
    UserResponse,
)


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def register_customer(self, payload: CustomerCreate) -> AuthResponse:
        return await self._register_user(payload, role="customer")

    async def register_provider(self, payload: ProviderCreate) -> AuthResponse:
        return await self._register_user(payload, role="provider")

    async def _register_user(
        self, payload: CustomerCreate | ProviderCreate, role: str
    ) -> AuthResponse:
        existing = await self.user_repo.find_by_email(payload.email)
        if existing:
            raise ConflictException("Email already registered")

        user_doc: UserDocument = {
            "email": payload.email.lower(),
            "hashed_password": hash_password(payload.password),
            "full_name": payload.full_name,
            "role": role,
            "phone": payload.phone,
            "terms_accepted": payload.terms_accepted,
            "is_active": True,
        }

        if role == "provider":
            assert isinstance(payload, ProviderCreate)
            user_doc["services"] = payload.services
            primary_category = category_for_service(payload.services[0])
            user_doc["service_category"] = primary_category or ""

        created = await self.user_repo.create_user(user_doc)
        public_user = self.user_repo.to_public_user(created)

        token = create_access_token(subject=public_user["id"], role=public_user["role"])
        return AuthResponse(
            user=UserResponse(**public_user),
            token=Token(access_token=token),
        )

    async def login(self, payload: LoginRequest) -> AuthResponse:
        user = await self.user_repo.find_by_email(payload.email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(payload.password, user["hashed_password"]):
            raise UnauthorizedException("Invalid email or password")

        public_user = self.user_repo.to_public_user(user)
        token = create_access_token(subject=public_user["id"], role=public_user["role"])

        return AuthResponse(
            user=UserResponse(**public_user),
            token=Token(access_token=token),
        )
