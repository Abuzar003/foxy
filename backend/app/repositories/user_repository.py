from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserDocument


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["users"]

    async def create_indexes(self) -> None:
        await self.collection.create_index("email", unique=True)

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self.collection.find_one({"email": email.lower()})

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

    @staticmethod
    def to_public_user(doc: dict) -> dict:
        return {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "full_name": doc["full_name"],
            "role": doc["role"],
            "phone": doc.get("phone"),
            "service_category": doc.get("service_category"),
            "is_active": doc["is_active"],
            "created_at": doc["created_at"],
        }
