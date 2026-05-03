"""
Add random customer reviews to every provider (mix of positive and negative).

Uses the same aggregation rules as the API (rating_average / rating_count).

From backend:
  python scripts/seed_provider_reviews.py
  python seed_provider_reviews.py

From backend/scripts:
  python seed_provider_reviews.py
"""

from __future__ import annotations

import argparse
import asyncio
import random
import sys
from pathlib import Path

from bson import ObjectId

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.db.mongodb import mongodb
from app.repositories.user_repository import UserRepository

GOOD_COMMENTS = [
    "Very professional, arrived on time and finished exactly what we discussed.",
    "Excellent experience. Would book again without hesitation.",
    "Polite, skilled, and careful with our things. Highly recommend.",
    "Great communication from start to finish. Work quality exceeded expectations.",
    "Dependable and honest. Fair pricing for the effort put in.",
    "Showed up prepared and left the space tidy. Five stars from our family.",
    "Handled a last-minute request calmly. Really appreciated the flexibility.",
    "Clear about scope and timing. No surprises on the day of the job.",
    "Respectful in our home and followed safety basics we asked for.",
    "Second time using this pro through the platform—consistent quality both times.",
]

BAD_COMMENTS = [
    "Arrived well after the agreed window with little notice.",
    "Work was rushed in places; had to redo part of it myself.",
    "Communication was weak—hard to reach and vague about timing.",
    "Expected more thoroughness for the rate charged.",
    "Promised a follow-up visit that never happened.",
    "Did not bring basic supplies we had agreed on in messages.",
    "Friendly enough, but attention to detail was missing on this job.",
    "Job acceptable but not worth recommending to neighbours.",
    "Several small issues noticed only after they had left.",
    "Mixed experience: started strong but the finish was disappointing.",
]

CUSTOMER_FIRST = [
    "Ravi", "Sunita", "Kiran", "Anil", "Fatima", "Vikash", "Geeta", "Imran",
    "Shalini", "Tarun", "Nandini", "Omar", "Leela", "Harsh", "Zara",
]

CUSTOMER_LAST = [
    "Menon", "Kapoor", "Reddy", "Ahmed", "Sen", "Patil", "Bose", "Malik",
    "Iyer", "Khan", "Sharma", "Das", "Nair", "Verma", "Ghosh",
]


def _pick_rating_and_comment(rng: random.Random, good_ratio: float) -> tuple[int, str]:
    good = rng.random() < good_ratio
    if good:
        rating = rng.choices([4, 5], weights=[0.25, 0.75], k=1)[0]
        return rating, rng.choice(GOOD_COMMENTS)
    rating = rng.choices([1, 2, 3], weights=[0.2, 0.35, 0.45], k=1)[0]
    return rating, rng.choice(BAD_COMMENTS)


async def seed_reviews(
    *,
    seed: int | None,
    min_reviews: int,
    max_reviews: int,
    good_ratio: float,
    max_providers: int | None,
) -> None:
    if min_reviews < 0 or max_reviews < min_reviews:
        raise ValueError("invalid review count range")
    if not 0.0 <= good_ratio <= 1.0:
        raise ValueError("good_ratio must be between 0 and 1")

    await mongodb.connect()
    user_repo = UserRepository(mongodb.db)
    rng = random.Random(seed if seed is not None else random.randrange(1 << 30))

    cursor = user_repo.collection.find({"role": "provider", "is_active": True}, {"_id": 1, "full_name": 1})
    providers = await cursor.to_list(length=10_000)
    rng.shuffle(providers)

    if max_providers is not None:
        providers = providers[: max(0, max_providers)]

    total_reviews = 0
    errors = 0

    try:
        for doc in providers:
            pid = str(doc["_id"])
            name = doc.get("full_name", "Provider")
            n = rng.randint(min_reviews, max_reviews)
            for _ in range(n):
                rating, comment = _pick_rating_and_comment(rng, good_ratio)
                customer_id = str(ObjectId())
                customer_name = f"{rng.choice(CUSTOMER_FIRST)} {rng.choice(CUSTOMER_LAST)}"

                created = await user_repo.add_provider_review(
                    provider_id=pid,
                    customer_id=customer_id,
                    customer_name=customer_name,
                    rating=rating,
                    comment=comment,
                )
                if created is None:
                    errors += 1
                    continue
                total_reviews += 1

            print(f"Reviews for {name} ({pid}): added {n}")
    finally:
        await mongodb.disconnect()

    print()
    print("Review seed complete")
    print(f"- providers_touched: {len(providers)}")
    print(f"- reviews_added: {total_reviews}")
    print(f"- failed_adds: {errors}")


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Append random good/bad customer reviews to each active provider."
    )
    p.add_argument("--seed", type=int, default=None, help="RNG seed for reproducibility.")
    p.add_argument(
        "--min-reviews",
        type=int,
        default=1,
        help="Minimum reviews per provider (default: 1).",
    )
    p.add_argument(
        "--max-reviews",
        type=int,
        default=5,
        help="Maximum reviews per provider (default: 5).",
    )
    p.add_argument(
        "--good-ratio",
        type=float,
        default=0.62,
        help="Probability each single review is 'good' (4–5 stars). Default: 0.62.",
    )
    p.add_argument(
        "--max-providers",
        type=int,
        default=None,
        help="Only process this many providers after shuffling (for testing).",
    )
    return p.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    if args.min_reviews < 1:
        raise SystemExit("--min-reviews must be at least 1")
    if args.max_reviews < args.min_reviews:
        raise SystemExit("--max-reviews must be greater than or equal to --min-reviews")
    asyncio.run(
        seed_reviews(
            seed=args.seed,
            min_reviews=args.min_reviews,
            max_reviews=args.max_reviews,
            good_ratio=args.good_ratio,
            max_providers=args.max_providers,
        )
    )
