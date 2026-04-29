from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

PHONE_REGEX = r"^(?:\d{10}|\+[1-9]\d{9,14})$"


class UserCreateBase(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=PHONE_REGEX)
    terms_accepted: bool = False


class CustomerCreate(UserCreateBase):
    role: Literal["customer"] = "customer"


class ProviderCreate(UserCreateBase):
    role: Literal["provider"] = "provider"
    service_category: str = Field(min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserResponse
    token: Token
