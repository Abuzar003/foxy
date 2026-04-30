from datetime import datetime
from typing import Literal, NotRequired, TypedDict

OfferStatus = Literal["pending", "accepted", "rejected"]
ScheduleType = Literal["single", "multi"]


class OfferSlot(TypedDict):
    start_at_utc: datetime
    end_at_utc: datetime
    date_local: str
    start_time_local: str
    end_time_local: str


class OfferMessage(TypedDict):
    sender_id: str
    sender_role: Literal["customer", "provider"]
    text: str
    created_at: datetime


class OfferDocument(TypedDict):
    customer_id: str
    customer_name: str
    provider_id: str
    provider_name: str
    service: str
    base_price: float
    offered_price: float
    schedule_type: ScheduleType
    timezone: str
    slots: list[OfferSlot]
    total_hours: float
    total_days: int
    status: OfferStatus
    message: str
    provider_reply: NotRequired[str]
    messages: NotRequired[list[OfferMessage]]
    created_at: datetime
    updated_at: datetime
