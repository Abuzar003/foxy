from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

OfferStatus = Literal["pending", "accepted", "rejected"]
ScheduleType = Literal["single", "multi"]


class OfferSlotInput(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    start_time: str = Field(min_length=5, max_length=5)
    end_time: str = Field(min_length=5, max_length=5)


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
