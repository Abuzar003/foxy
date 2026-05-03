import re
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

OfferStatus = Literal["pending", "accepted", "rejected"]
ScheduleType = Literal["single", "multi"]

# e.g. `202605-05-05` (YYYYMM-DD-DD) from some date pickers / IME quirks.
_GLUED_YMD = re.compile(r"^(\d{4})(\d{2})-(\d{2})-(\d{2})$")


def _normalize_offer_date_str(value: str) -> str:
    s = value.strip()
    m = _GLUED_YMD.fullmatch(s)
    if m:
        s = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    datetime.strptime(s, "%Y-%m-%d")
    return s


class OfferSlotInput(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    start_time: str = Field(min_length=5, max_length=5)
    end_time: str = Field(min_length=5, max_length=5)

    @field_validator("date", mode="before")
    @classmethod
    def coerce_date(cls, v: object) -> object:
        if not isinstance(v, str):
            return v
        try:
            return _normalize_offer_date_str(v)
        except ValueError as exc:
            raise ValueError("Invalid date; expected YYYY-MM-DD") from exc


class CreateOfferRequest(BaseModel):
    provider_id: str = Field(min_length=1)
    service: str = Field(min_length=2, max_length=120)
    base_price: float = Field(gt=0)
    offered_price: float = Field(gt=0)
    message: str = Field(default="", max_length=1000)
    schedule_type: ScheduleType = "single"
    date: Optional[str] = Field(default=None, min_length=10, max_length=10)
    start_time: Optional[str] = Field(default=None, min_length=5, max_length=5)
    end_time: Optional[str] = Field(default=None, min_length=5, max_length=5)
    slots: list[OfferSlotInput] = Field(default_factory=list)
    timezone: str = Field(default="Asia/Kolkata", min_length=2, max_length=64)

    @field_validator("date", mode="before")
    @classmethod
    def coerce_single_date(cls, v: object) -> object:
        if v is None or not isinstance(v, str):
            return v
        try:
            return _normalize_offer_date_str(v)
        except ValueError as exc:
            raise ValueError("Invalid date; expected YYYY-MM-DD") from exc

    @model_validator(mode="after")
    def validate_schedule_shape(self) -> "CreateOfferRequest":
        if self.schedule_type == "single":
            if self.slots:
                raise ValueError("slots must be empty when schedule_type is single")
        if self.schedule_type == "multi":
            if not self.slots:
                raise ValueError("For multi schedule_type, slots must contain at least one slot")
            if self.date or self.start_time or self.end_time:
                raise ValueError("date/start_time/end_time are only allowed for single schedule_type")
        return self


class UpdateOfferStatusRequest(BaseModel):
    status: Literal["accepted", "rejected"]
    provider_reply: Optional[str] = Field(default=None, max_length=1000)


class OfferSlotResponse(BaseModel):
    start_at_utc: datetime
    end_at_utc: datetime
    date_local: str
    start_time_local: str
    end_time_local: str


class OfferResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    provider_id: str
    provider_name: str
    service: str
    base_price: float
    offered_price: float
    schedule_type: ScheduleType
    timezone: str
    slots: list["OfferSlotResponse"]
    total_hours: float
    total_days: int
    status: OfferStatus
    message: str
    provider_reply: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OfferInboxCounts(BaseModel):
    pending_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0
    total_count: int = 0


class OfferInboxResponse(BaseModel):
    offers: list[OfferResponse]
    counts: OfferInboxCounts


class OfferMessageCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class OfferMessageResponse(BaseModel):
    sender_id: str
    sender_role: Literal["customer", "provider"]
    text: str
    created_at: datetime


class OfferMessagesResponse(BaseModel):
    offer_id: str
    messages: list[OfferMessageResponse]
