from datetime import datetime
from typing import Literal, NotRequired, TypedDict


UserRole = Literal["customer", "provider"]


class ProviderReview(TypedDict):
    customer_id: str
    customer_name: str
    rating: int
    comment: str
    created_at: datetime


class UserDocument(TypedDict):
    email: str
    hashed_password: str
    full_name: str
    role: UserRole
    phone: str
    terms_accepted: bool
    service_category: NotRequired[str]
    aadhaar_number: NotRequired[str]
    pan_card: NotRequired[str]
    address: NotRequired[str]
    services: NotRequired[list[str]]
    price_per_day: NotRequired[float]
    price_per_hour: NotRequired[float]
    profile_photo: NotRequired[str]
    about: NotRequired[str]
    age: NotRequired[int]
    home_age: NotRequired[int]
    family_size: NotRequired[int]
    grooming_cycle_days: NotRequired[int]
    reviews: NotRequired[list[ProviderReview]]
    rating_average: NotRequired[float]
    rating_count: NotRequired[int]
    is_active: bool
    created_at: NotRequired[datetime]
    updated_at: NotRequired[datetime]
