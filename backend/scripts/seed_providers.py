import argparse
import asyncio
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.security import hash_password
from app.core.service_taxonomy import SERVICE_TAXONOMY
from app.db.mongodb import mongodb
from app.repositories.user_repository import UserRepository

DEFAULT_PASSWORD = "Password@123"
DEFAULT_PROVIDER_COUNT = 1
PLATFORM_NAME = "Haazir"


def _build_bio(full_name: str, primary_service: str, category: str) -> str:
    return (
        f"I am {full_name}, a dedicated {primary_service} professional from {PLATFORM_NAME}'s "
        f"{category} network. I focus on punctual service, transparent communication, and "
        "workmanship that creates visible impact for families and businesses in every visit."
    )


def _build_pan(index: int) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    prefix = "".join(letters[(index + step * 7) % len(letters)] for step in range(5))
    suffix = letters[(index * 3) % len(letters)]
    return f"{prefix}{1000 + index:04d}{suffix}"


def _build_profile_photo_url(full_name: str, primary_service: str) -> str:
    seed = f"{full_name}-{primary_service}".replace(" ", "-").lower()
    return f"https://api.dicebear.com/9.x/initials/svg?seed={seed}"


def _flatten_services() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for category, services in SERVICE_TAXONOMY.items():
        for service in services:
            pairs.append((category, service))
    return pairs


async def seed_providers(count: int, password: str) -> None:
    if count <= 0:
        raise ValueError("count must be greater than 0")

    await mongodb.connect()
    user_repo = UserRepository(mongodb.db)
    await user_repo.create_indexes()

    service_pairs = _flatten_services()
    hashed_password = hash_password(password)
    run_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    created_count = 0
    skipped_count = 0
    category_counter: Counter[str] = Counter()
    service_counter: Counter[str] = Counter()

    try:
        for index in range(count):
            category, primary_service = service_pairs[index % len(service_pairs)]
            services = [primary_service]

            provider_number = index + 1
            full_name = f"Provider {provider_number:03d}"
            email = f"provider.seed+{run_tag}.{provider_number:03d}@haazir.local"
            phone = f"9{(provider_number + 100000000):09d}"
            aadhaar = f"{provider_number + 100000000000:012d}"

            if await user_repo.find_by_email(email):
                skipped_count += 1
                continue

            payload = {
                "email": email,
                "hashed_password": hashed_password,
                "full_name": full_name,
                "role": "provider",
                "phone": phone,
                "terms_accepted": True,
                "service_category": category,
                "services": services,
                "price_per_day": float(1200 + provider_number * 20),
                "price_per_hour": float(200 + (provider_number % 10) * 25),
                "profile_photo": _build_profile_photo_url(full_name, primary_service),
                "about": _build_bio(full_name, primary_service, category),
                "address": f"{provider_number} Impact Street, Sector {provider_number % 20 + 1}, Bengaluru",
                "age": 22 + (provider_number % 18),
                "aadhaar_number": aadhaar,
                "pan_card": _build_pan(provider_number),
                "is_active": True,
            }

            await user_repo.create_user(payload)
            created_count += 1
            category_counter[category] += 1
            for service in services:
                service_counter[service] += 1
    finally:
        await mongodb.disconnect()

    print("Provider seed complete")
    print(f"- requested: {count}")
    print(f"- created: {created_count}")
    print(f"- skipped_existing: {skipped_count}")
    print(f"- unique_categories_used: {len(category_counter)} / {len(SERVICE_TAXONOMY)}")
    print(f"- unique_services_used: {len(service_counter)} / {len(service_pairs)}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed provider users into MongoDB.")
    parser.add_argument(
        "--count",
        type=int,
        default=DEFAULT_PROVIDER_COUNT,
        help=f"Number of providers to create (default: {DEFAULT_PROVIDER_COUNT}).",
    )
    parser.add_argument(
        "--password",
        type=str,
        default=DEFAULT_PASSWORD,
        help=f"Common password for all generated providers (default: {DEFAULT_PASSWORD}).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    asyncio.run(seed_providers(count=args.count, password=args.password))
