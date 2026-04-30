from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserDocument


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["users"]

    async def create_indexes(self) -> None:
        await self.collection.create_index("email", unique=True)

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self.collection.find_one({"email": email.lower()})

    async def find_by_phone(self, phone: str) -> Optional[dict]:
        return await self.collection.find_one({"phone": phone})

    async def create_user(self, payload: UserDocument) -> dict:
        now = datetime.now(timezone.utc)
        payload["created_at"] = now
        payload["updated_at"] = now
        result = await self.collection.insert_one(payload)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if created is None:
            raise RuntimeError("Failed to fetch created user")
        return created

    async def update_password(self, email: str, hashed_password: str) -> bool:
        result = await self.collection.update_one(
            {"email": email.lower()},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.modified_count > 0

    async def find_by_id(self, user_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(user_id):
            return None
        return await self.collection.find_one({"_id": ObjectId(user_id)})

    async def update_provider_profile(self, user_id: str, payload: dict) -> Optional[dict]:
        if not ObjectId.is_valid(user_id):
            return None
        await self.collection.update_one(
            {"_id": ObjectId(user_id), "role": "provider"},
            {
                "$set": {
                    **payload,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return await self.collection.find_one({"_id": ObjectId(user_id), "role": "provider"})

    async def update_customer_preferences(self, user_id: str, payload: dict) -> Optional[dict]:
        if not ObjectId.is_valid(user_id):
            return None
        await self.collection.update_one(
            {"_id": ObjectId(user_id), "role": "customer"},
            {
                "$set": {
                    **payload,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return await self.collection.find_one({"_id": ObjectId(user_id), "role": "customer"})

    async def update_customer_mobile(self, user_id: str, phone: str) -> Optional[dict]:
        if not ObjectId.is_valid(user_id):
            return None
        await self.collection.update_one(
            {"_id": ObjectId(user_id), "role": "customer"},
            {
                "$set": {
                    "phone": phone,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return await self.collection.find_one({"_id": ObjectId(user_id), "role": "customer"})

    async def search_providers(
        self,
        *,
        service: str | None = None,
        allowed_services: list[str] | None = None,
        max_price_per_hour: float | None = None,
        max_price_per_day: float | None = None,
        address_text: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        query: dict = {"role": "provider", "is_active": True}
        if service:
            query["services"] = service
        elif allowed_services:
            query["services"] = {"$in": allowed_services}
        if max_price_per_hour is not None:
            query["price_per_hour"] = {"$lte": max_price_per_hour}
        if max_price_per_day is not None:
            query["price_per_day"] = {"$lte": max_price_per_day}
        if address_text:
            query["address"] = {"$regex": address_text, "$options": "i"}

        projection = {
            "_id": 1,
            "full_name": 1,
            "phone": 1,
            "address": 1,
            "services": 1,
            "price_per_day": 1,
            "price_per_hour": 1,
            "profile_photo": 1,
            "about": 1,
            "age": 1,
            "rating_average": 1,
            "rating_count": 1,
        }
        providers = await self.collection.find(query, projection).limit(limit).to_list(length=limit)
        return providers

    async def add_provider_review(
        self,
        *,
        provider_id: str,
        customer_id: str,
        customer_name: str,
        rating: int,
        comment: str,
    ) -> Optional[dict]:
        if not ObjectId.is_valid(provider_id):
            return None

        provider = await self.collection.find_one({"_id": ObjectId(provider_id), "role": "provider"})
        if not provider:
            return None

        review_doc = {
            "customer_id": customer_id,
            "customer_name": customer_name,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.now(timezone.utc),
        }
        existing_count = int(provider.get("rating_count", 0))
        existing_avg = float(provider.get("rating_average", 0.0))
        new_count = existing_count + 1
        new_avg = ((existing_avg * existing_count) + rating) / new_count

        await self.collection.update_one(
            {"_id": ObjectId(provider_id), "role": "provider"},
            {
                "$push": {"reviews": review_doc},
                "$set": {
                    "rating_count": new_count,
                    "rating_average": round(new_avg, 2),
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
        return review_doc

    async def get_provider_reviews(self, provider_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(provider_id):
            return None
        provider = await self.collection.find_one(
            {"_id": ObjectId(provider_id), "role": "provider"},
            {
                "_id": 1,
                "reviews": 1,
                "rating_average": 1,
                "rating_count": 1,
            },
        )
        if not provider:
            return None
        return provider

    @staticmethod
    def to_public_user(doc: dict) -> dict:
        return {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "full_name": doc["full_name"],
            "role": doc["role"],
            "phone": doc.get("phone"),
            "service_category": doc.get("service_category"),
            "aadhaar_number": doc.get("aadhaar_number"),
            "pan_card": doc.get("pan_card"),
            "address": doc.get("address"),
            "services": doc.get("services", []),
            "price_per_day": doc.get("price_per_day"),
            "price_per_hour": doc.get("price_per_hour"),
            "profile_photo": doc.get("profile_photo"),
            "about": doc.get("about"),
            "age": doc.get("age"),
            "is_active": doc["is_active"],
            "created_at": doc["created_at"],
        }
