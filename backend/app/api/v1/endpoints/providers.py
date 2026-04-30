from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_current_user, get_user_repository
from app.core.service_taxonomy import ALL_SERVICES, SERVICE_TAXONOMY
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    ProviderReviewCreate,
    ProviderReviewResponse,
    ProviderReviewsResponse,
    ProviderSearchResponse,
    ProviderSearchResult,
    ServiceTaxonomyResponse,
)

router = APIRouter(prefix="/providers", tags=["Providers"])


@router.get("/taxonomy", response_model=ServiceTaxonomyResponse)
async def get_service_taxonomy() -> ServiceTaxonomyResponse:
    return ServiceTaxonomyResponse()


@router.get("/search", response_model=ProviderSearchResponse)
async def search_providers(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    service: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    max_price_per_hour: Optional[float] = Query(default=None, gt=0),
    max_price_per_day: Optional[float] = Query(default=None, gt=0),
    address: Optional[str] = Query(default=None, min_length=2),
    limit: int = Query(default=20, ge=1, le=100),
) -> ProviderSearchResponse:
    normalized_service = service.strip() if service else None
    normalized_category = category.strip() if category else None

    if normalized_service and normalized_service not in ALL_SERVICES:
        return ProviderSearchResponse(providers=[])

    allowed_services = None
    if normalized_category:
        allowed_services = SERVICE_TAXONOMY.get(normalized_category)
        if not allowed_services:
            return ProviderSearchResponse(providers=[])

    docs = await user_repo.search_providers(
        service=normalized_service,
        allowed_services=allowed_services,
        max_price_per_hour=max_price_per_hour,
        max_price_per_day=max_price_per_day,
        address_text=address,
        limit=limit,
    )

    providers = [
        ProviderSearchResult(
            id=str(doc["_id"]),
            full_name=doc.get("full_name", ""),
            phone=doc.get("phone"),
            address=doc.get("address"),
            services=doc.get("services", []),
            price_per_day=doc.get("price_per_day"),
            price_per_hour=doc.get("price_per_hour"),
            profile_photo=doc.get("profile_photo"),
            about=doc.get("about"),
            age=doc.get("age"),
            rating_average=doc.get("rating_average"),
            rating_count=doc.get("rating_count", 0),
        )
        for doc in docs
    ]
    return ProviderSearchResponse(providers=providers)


@router.post("/{provider_id}/reviews", response_model=ProviderReviewResponse, status_code=status.HTTP_201_CREATED)
async def add_provider_review(
    provider_id: str,
    payload: ProviderReviewCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> ProviderReviewResponse:
    if current_user.get("role") != "customer":
        raise UnauthorizedException("Only customers can submit reviews")

    customer = await user_repo.find_by_id(current_user["user_id"])
    if not customer:
        raise NotFoundException("Customer not found")

    created = await user_repo.add_provider_review(
        provider_id=provider_id,
        customer_id=current_user["user_id"],
        customer_name=customer.get("full_name", "Customer"),
        rating=payload.rating,
        comment=payload.comment,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )
    return ProviderReviewResponse(**created)


@router.get("/{provider_id}/reviews", response_model=ProviderReviewsResponse)
async def get_provider_reviews(
    provider_id: str,
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> ProviderReviewsResponse:
    provider = await user_repo.get_provider_reviews(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )

    reviews = [
        ProviderReviewResponse(**review)
        for review in sorted(
            provider.get("reviews", []),
            key=lambda item: item.get("created_at"),
            reverse=True,
        )
    ]
    return ProviderReviewsResponse(
        provider_id=str(provider["_id"]),
        rating_average=provider.get("rating_average"),
        rating_count=provider.get("rating_count", 0),
        reviews=reviews,
    )
