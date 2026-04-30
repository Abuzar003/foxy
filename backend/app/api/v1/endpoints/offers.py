from datetime import date, datetime, time, timedelta
from typing import Annotated, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_current_user, get_offer_repository, get_user_repository
from app.core.exceptions import UnauthorizedException
from app.core.service_taxonomy import ALL_SERVICES
from app.repositories.offer_repository import OfferRepository
from app.repositories.user_repository import UserRepository
from app.schemas.offer import (
    CreateOfferRequest,
    OfferInboxCounts,
    OfferInboxResponse,
    OfferMessageCreateRequest,
    OfferMessageResponse,
    OfferMessagesResponse,
    OfferResponse,
    OfferSlotResponse,
    OfferStatus,
    UpdateOfferStatusRequest,
)

router = APIRouter(prefix="/offers", tags=["Offers"])


def _parse_date(date_str: str) -> date:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {date_str}. Expected YYYY-MM-DD",
        ) from exc


def _parse_time(time_str: str) -> time:
    try:
        return datetime.strptime(time_str, "%H:%M").time()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid time format: {time_str}. Expected HH:MM",
        ) from exc


def _normalize_slots(payload: CreateOfferRequest) -> tuple[list[dict], float, int]:
    try:
        zone = ZoneInfo(payload.timezone)
    except ZoneInfoNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timezone",
        ) from exc

    raw_slots: list[tuple[str, str, str]] = []
    if payload.schedule_type == "single":
        if payload.date and payload.start_time and payload.end_time:
            raw_slots.append((payload.date, payload.start_time, payload.end_time))
        else:
            now_local = datetime.now(zone)
            # Backward compatibility: when old clients omit schedule fields,
            # create a default 1-hour slot at the next rounded hour.
            next_hour = (now_local.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1))
            end_hour = next_hour + timedelta(hours=1)
            raw_slots.append(
                (
                    next_hour.date().isoformat(),
                    next_hour.strftime("%H:%M"),
                    end_hour.strftime("%H:%M"),
                )
            )
    else:
        raw_slots.extend((slot.date, slot.start_time, slot.end_time) for slot in payload.slots)

    today_local = datetime.now(zone).date()
    normalized: list[dict] = []
    total_hours = 0.0
    day_keys: set[str] = set()
    occupied_intervals: dict[str, list[tuple[datetime, datetime]]] = {}

    for idx, (date_str, start_str, end_str) in enumerate(raw_slots, start=1):
        slot_date = _parse_date(date_str)
        start_local_time = _parse_time(start_str)
        end_local_time = _parse_time(end_str)
        if slot_date < today_local:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slot {idx}: date cannot be in the past",
            )

        start_local = datetime.combine(slot_date, start_local_time, tzinfo=zone)
        end_local = datetime.combine(slot_date, end_local_time, tzinfo=zone)
        if end_local <= start_local:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slot {idx}: end_time must be greater than start_time",
            )

        duration_hours = (end_local - start_local).total_seconds() / 3600
        if duration_hours < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slot {idx}: minimum duration is 1 hour",
            )
        if duration_hours > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slot {idx}: maximum duration is 12 hours",
            )

        local_day_key = slot_date.isoformat()
        intervals_for_day = occupied_intervals.setdefault(local_day_key, [])
        for existing_start, existing_end in intervals_for_day:
            if start_local < existing_end and existing_start < end_local:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Slot {idx}: overlaps with another slot on {local_day_key}",
                )
        intervals_for_day.append((start_local, end_local))

        start_utc = start_local.astimezone(ZoneInfo("UTC"))
        end_utc = end_local.astimezone(ZoneInfo("UTC"))
        normalized.append(
            {
                "start_at_utc": start_utc,
                "end_at_utc": end_utc,
                "date_local": local_day_key,
                "start_time_local": start_local.strftime("%H:%M"),
                "end_time_local": end_local.strftime("%H:%M"),
            }
        )
        total_hours += duration_hours
        day_keys.add(local_day_key)

    return normalized, round(total_hours, 2), len(day_keys)


def _to_offer_response(doc: dict) -> OfferResponse:
    return OfferResponse(
        id=str(doc["_id"]),
        customer_id=doc["customer_id"],
        customer_name=doc["customer_name"],
        provider_id=doc["provider_id"],
        provider_name=doc["provider_name"],
        service=doc["service"],
        base_price=doc["base_price"],
        offered_price=doc["offered_price"],
        schedule_type=doc["schedule_type"],
        timezone=doc["timezone"],
        slots=[OfferSlotResponse(**slot) for slot in doc.get("slots", [])],
        total_hours=doc.get("total_hours", 0),
        total_days=doc.get("total_days", 0),
        status=doc["status"],
        message=doc["message"],
        provider_reply=doc.get("provider_reply"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: CreateOfferRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> OfferResponse:
    if current_user.get("role") != "customer":
        raise UnauthorizedException("Only customers can create offers")

    if payload.offered_price < payload.base_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="offered_price must be greater than or equal to base_price",
        )

    if payload.service not in ALL_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service",
        )

    customer = await user_repo.find_by_id(current_user["user_id"])
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    provider = await user_repo.find_by_id(payload.provider_id)
    if not provider or provider.get("role") != "provider" or not provider.get("is_active"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")

    duplicate = await offer_repo.find_active_pending_offer(
        customer_id=current_user["user_id"],
        provider_id=payload.provider_id,
        service=payload.service,
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending offer already exists for this provider and service",
        )

    normalized_slots, total_hours, total_days = _normalize_slots(payload)

    created = await offer_repo.create_offer(
        {
            "customer_id": current_user["user_id"],
            "customer_name": customer.get("full_name", "Customer"),
            "provider_id": payload.provider_id,
            "provider_name": provider.get("full_name", "Provider"),
            "service": payload.service,
            "base_price": payload.base_price,
            "offered_price": payload.offered_price,
            "schedule_type": payload.schedule_type,
            "timezone": payload.timezone,
            "slots": normalized_slots,
            "total_hours": total_hours,
            "total_days": total_days,
            "status": "pending",
            "message": payload.message,
        }
    )
    return _to_offer_response(created)


@router.get("/customer", response_model=OfferInboxResponse)
async def get_customer_inbox(
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
    status_filter: Optional[OfferStatus] = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> OfferInboxResponse:
    if current_user.get("role") != "customer":
        raise UnauthorizedException("Only customers can view this inbox")

    offers = await offer_repo.list_customer_offers(
        customer_id=current_user["user_id"],
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    counts = await offer_repo.get_customer_counts(current_user["user_id"])
    return OfferInboxResponse(
        offers=[_to_offer_response(offer) for offer in offers],
        counts=OfferInboxCounts(**counts),
    )


@router.get("/provider", response_model=OfferInboxResponse)
async def get_provider_inbox(
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
    status_filter: Optional[OfferStatus] = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> OfferInboxResponse:
    if current_user.get("role") != "provider":
        raise UnauthorizedException("Only providers can view this inbox")

    offers = await offer_repo.list_provider_offers(
        provider_id=current_user["user_id"],
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    counts = await offer_repo.get_provider_counts(current_user["user_id"])
    return OfferInboxResponse(
        offers=[_to_offer_response(offer) for offer in offers],
        counts=OfferInboxCounts(**counts),
    )


@router.patch("/{offer_id}/status", response_model=OfferResponse)
async def update_offer_status(
    offer_id: str,
    payload: UpdateOfferStatusRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
) -> OfferResponse:
    if current_user.get("role") != "provider":
        raise UnauthorizedException("Only providers can update offer status")

    offer = await offer_repo.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    if offer["provider_id"] != current_user["user_id"]:
        raise UnauthorizedException("You are not authorized to update this offer")
    if offer["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending offers can be updated",
        )

    updated = await offer_repo.update_offer_status(
        offer_id=offer_id,
        status=payload.status,
        provider_reply=payload.provider_reply,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return _to_offer_response(updated)


@router.get("/{offer_id}", response_model=OfferResponse)
async def get_offer_detail(
    offer_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
) -> OfferResponse:
    offer = await offer_repo.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    user_id = current_user["user_id"]
    if user_id not in {offer["customer_id"], offer["provider_id"]}:
        raise UnauthorizedException("You are not authorized to view this offer")
    return _to_offer_response(offer)


@router.post("/{offer_id}/messages", response_model=OfferMessageResponse, status_code=status.HTTP_201_CREATED)
async def add_offer_message(
    offer_id: str,
    payload: OfferMessageCreateRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
) -> OfferMessageResponse:
    offer = await offer_repo.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    user_id = current_user["user_id"]
    user_role = current_user.get("role")
    if user_id not in {offer["customer_id"], offer["provider_id"]}:
        raise UnauthorizedException("You are not authorized to message in this offer")
    if user_role not in {"customer", "provider"}:
        raise UnauthorizedException("Invalid user role for messaging")

    created = await offer_repo.add_offer_message(
        offer_id=offer_id,
        sender_id=user_id,
        sender_role=user_role,
        text=payload.text,
    )
    if not created:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return OfferMessageResponse(**created)


@router.get("/{offer_id}/messages", response_model=OfferMessagesResponse)
async def get_offer_messages(
    offer_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    offer_repo: Annotated[OfferRepository, Depends(get_offer_repository)],
    before: Optional[datetime] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> OfferMessagesResponse:
    offer = await offer_repo.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    user_id = current_user["user_id"]
    if user_id not in {offer["customer_id"], offer["provider_id"]}:
        raise UnauthorizedException("You are not authorized to view these messages")

    messages = await offer_repo.list_offer_messages(
        offer_id=offer_id,
        before=before,
        limit=limit,
    )
    return OfferMessagesResponse(
        offer_id=offer_id,
        messages=[OfferMessageResponse(**message) for message in messages],
    )
