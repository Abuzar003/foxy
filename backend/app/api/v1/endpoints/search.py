from typing import Literal

from fastapi import APIRouter, Query

from app.core.service_recommendations import recommend_services
from app.data.indian_cities import search_cities
from app.schemas.search import CityItem, CitySearchResponse, ServiceRecommendResponse, ServiceSuggestion

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/services", response_model=ServiceRecommendResponse)
async def recommend_services_endpoint(
    q: str = Query(default="", max_length=200, description="Free-text service need; empty returns all five catalog services"),
    limit: int = Query(default=5, ge=1, le=5),
) -> ServiceRecommendResponse:
    ranked = recommend_services(q, limit=limit)
    suggestions = [ServiceSuggestion(service=s, category=c, score=round(score, 4)) for s, c, score in ranked]
    return ServiceRecommendResponse(suggestions=suggestions)


@router.get("/cities", response_model=CitySearchResponse)
async def search_cities_endpoint(
    q: str = Query(..., min_length=1, max_length=100, description="City prefix or substring (e.g. 'b' for Bengaluru, Bhopal, …)"),
    limit: int = Query(default=50, ge=1, le=200),
    mode: Literal["prefix", "contains"] = Query(
        default="prefix",
        description="'prefix' matches from the start of the city name; 'contains' matches anywhere in the name",
    ),
) -> CitySearchResponse:
    rows = search_cities(q, mode=mode, limit=limit)
    return CitySearchResponse(cities=[CityItem(**row) for row in rows])
