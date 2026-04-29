from datetime import datetime
from typing import Literal, NotRequired, TypedDict


UserRole = Literal["customer", "provider"]


class UserDocument(TypedDict):
    email: str
    hashed_password: str
    full_name: str
    role: UserRole
    phone: str
    terms_accepted: bool
    service_category: NotRequired[str]
    is_active: bool
    created_at: NotRequired[datetime]
    updated_at: NotRequired[datetime]
