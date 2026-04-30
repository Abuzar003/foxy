from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_user_repository
from app.core.service_taxonomy import ALL_SERVICES, SERVICE_TAXONOMY
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
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
        )
        for doc in docs
    ]
    return ProviderSearchResponse(providers=providers)
