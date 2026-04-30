from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.service_taxonomy import ALL_SERVICES, SERVICE_TAXONOMY

PHONE_REGEX = r"^(?:\d{10}|\+[1-9]\d{9,14})$"
BCRYPT_MAX_PASSWORD_BYTES = 72
AADHAAR_REGEX = r"^\d{12}$"
PAN_REGEX = r"^[A-Z]{5}[0-9]{4}[A-Z]$"


class UserCreateBase(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=PHONE_REGEX)
    terms_accepted: bool = False

    @field_validator("password")
    @classmethod
    def validate_password_byte_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError("Password must be 72 bytes or fewer")
        return value


class CustomerCreate(UserCreateBase):
    role: Literal["customer"] = "customer"


class ProviderCreate(UserCreateBase):
    role: Literal["provider"] = "provider"
    service_category: str = Field(min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_byte_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError("Password must be 72 bytes or fewer")
        return value


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: Literal["customer", "provider"]
    phone: Optional[str] = None
    service_category: Optional[str] = None
    is_active: bool
    created_at: datetime


class ProviderAboutUpdate(BaseModel):
    aadhaar_number: str = Field(pattern=AADHAAR_REGEX)
    pan_card: Optional[str] = Field(default=None, pattern=PAN_REGEX)
    address: str = Field(min_length=10, max_length=300)
    services: list[str] = Field(min_length=1, max_length=20)
    price_per_day: float = Field(gt=0)
    price_per_hour: float = Field(gt=0)
    profile_photo: str = Field(min_length=3, max_length=500)
    about: str = Field(min_length=10, max_length=1000)
    age: int = Field(ge=18, le=100)

    @field_validator("services")
    @classmethod
    def validate_services(cls, value: list[str]) -> list[str]:
        invalid_services = [service for service in value if service not in ALL_SERVICES]
        if invalid_services:
            raise ValueError(f"Invalid services: {', '.join(invalid_services)}")
        return value


class ProviderAboutResponse(BaseModel):
    aadhaar_number: Optional[str] = None
    pan_card: Optional[str] = None
    address: Optional[str] = None
    services: list[str] = Field(default_factory=list)
    price_per_day: Optional[float] = None
    price_per_hour: Optional[float] = None
    profile_photo: Optional[str] = None
    about: Optional[str] = None
    age: Optional[int] = None


class ProviderSearchResult(BaseModel):
    id: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    services: list[str] = Field(default_factory=list)
    price_per_day: Optional[float] = None
    price_per_hour: Optional[float] = None
    profile_photo: Optional[str] = None
    about: Optional[str] = None
    age: Optional[int] = None


class ProviderSearchResponse(BaseModel):
    providers: list[ProviderSearchResult]


class ServiceTaxonomyResponse(BaseModel):
    categories: dict[str, list[str]] = Field(default_factory=lambda: dict(SERVICE_TAXONOMY))


class CustomerPreferenceUpdate(BaseModel):
    home_age: int = Field(ge=0, le=100)
    family_size: int = Field(ge=1, le=20)
    grooming_cycle_days: int = Field(ge=1, le=365)


class CustomerPreferenceResponse(BaseModel):
    home_age: Optional[int] = None
    family_size: Optional[int] = None
    grooming_cycle_days: Optional[int] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserResponse
    token: Token
