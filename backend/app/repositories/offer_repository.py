from datetime import datetime, timezone
from typing import Literal, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.offer import OfferDocument, OfferStatus


class OfferRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["offers"]

    async def create_indexes(self) -> None:
        await self.collection.create_index("customer_id")
        await self.collection.create_index("provider_id")
        await self.collection.create_index("status")
        await self.collection.create_index("created_at")
        await self.collection.create_index(
            [("customer_id", 1), ("provider_id", 1), ("service", 1), ("status", 1)]
        )

    async def create_offer(self, payload: OfferDocument) -> dict:
        now = datetime.now(timezone.utc)
        payload["created_at"] = now
        payload["updated_at"] = now
        result = await self.collection.insert_one(payload)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if created is None:
            raise RuntimeError("Failed to fetch created offer")
        return created

    async def find_active_pending_offer(
        self, customer_id: str, provider_id: str, service: str
    ) -> Optional[dict]:
        return await self.collection.find_one(
            {
                "customer_id": customer_id,
                "provider_id": provider_id,
                "service": service,
                "status": "pending",
            }
        )

    async def get_offer_by_id(self, offer_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(offer_id):
            return None
        return await self.collection.find_one({"_id": ObjectId(offer_id)})

    async def list_customer_offers(
        self,
        *,
        customer_id: str,
        status: OfferStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        query: dict = {"customer_id": customer_id}
        if status:
            query["status"] = status
        return (
            await self.collection.find(query)
            .sort("created_at", -1)
            .skip(offset)
            .limit(limit)
            .to_list(length=limit)
        )

    async def list_provider_offers(
        self,
        *,
        provider_id: str,
        status: OfferStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        query: dict = {"provider_id": provider_id}
        if status:
            query["status"] = status
        return (
            await self.collection.find(query)
            .sort("created_at", -1)
            .skip(offset)
            .limit(limit)
            .to_list(length=limit)
        )

    async def get_customer_counts(self, customer_id: str) -> dict[str, int]:
        pipeline = [
            {"$match": {"customer_id": customer_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        rows = await self.collection.aggregate(pipeline).to_list(length=10)
        counts = {"pending_count": 0, "accepted_count": 0, "rejected_count": 0, "total_count": 0}
        for row in rows:
            status = row["_id"]
            count = int(row["count"])
            if status == "pending":
                counts["pending_count"] = count
            elif status == "accepted":
                counts["accepted_count"] = count
            elif status == "rejected":
                counts["rejected_count"] = count
            counts["total_count"] += count
        return counts

    async def get_provider_counts(self, provider_id: str) -> dict[str, int]:
        pipeline = [
            {"$match": {"provider_id": provider_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        rows = await self.collection.aggregate(pipeline).to_list(length=10)
        counts = {"pending_count": 0, "accepted_count": 0, "rejected_count": 0, "total_count": 0}
        for row in rows:
            status = row["_id"]
            count = int(row["count"])
            if status == "pending":
                counts["pending_count"] = count
            elif status == "accepted":
                counts["accepted_count"] = count
            elif status == "rejected":
                counts["rejected_count"] = count
            counts["total_count"] += count
        return counts

    async def update_offer_status(
        self, *, offer_id: str, status: Literal["accepted", "rejected"], provider_reply: str | None
    ) -> Optional[dict]:
        if not ObjectId.is_valid(offer_id):
            return None
        update_doc: dict = {
            "status": status,
            "updated_at": datetime.now(timezone.utc),
        }
        if provider_reply is not None:
            update_doc["provider_reply"] = provider_reply
        await self.collection.update_one({"_id": ObjectId(offer_id)}, {"$set": update_doc})
        return await self.collection.find_one({"_id": ObjectId(offer_id)})
