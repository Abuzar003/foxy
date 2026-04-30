from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.offers import router as offers_router
from app.api.v1.endpoints.password_reset import router as password_reset_router
from app.api.v1.endpoints.providers import router as providers_router
from app.repositories.offer_repository import OfferRepository
from app.core.cache import cache
from app.core.config import get_settings
from app.db.mongodb import mongodb
from app.repositories.user_repository import UserRepository


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongodb.connect()
    await cache.connect()

    # Initialize required indexes once service starts.
    user_repo = UserRepository(mongodb.db)
    offer_repo = OfferRepository(mongodb.db)
    await user_repo.create_indexes()
    await offer_repo.create_indexes()

    yield

    await cache.disconnect()
    await mongodb.disconnect()


settings = get_settings()

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(offers_router, prefix=settings.api_v1_prefix)
app.include_router(password_reset_router, prefix=settings.api_v1_prefix)
app.include_router(providers_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
