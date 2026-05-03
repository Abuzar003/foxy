from pydantic import BaseModel, Field


class ServiceSuggestion(BaseModel):
    service: str
    category: str
    score: float = Field(ge=0.0, le=1.0, description="Relative match strength within the catalog")


class ServiceRecommendResponse(BaseModel):
    suggestions: list[ServiceSuggestion]


class CityItem(BaseModel):
    name: str
    state: str


class CitySearchResponse(BaseModel):
    cities: list[CityItem]
