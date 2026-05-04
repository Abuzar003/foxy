"""
Seed providers for selected services with 20-30 records per service by default.

Services seeded:
- Security Guards
- Delivery / Helper / Loader
- Event Helpers
- On-Demand Drivers

Cities are assigned across entries from app/data/indian_cities.json in shuffled
round-robin order so providers are spread across many cities.

Examples (run from backend/):
  python scripts/seed_listed_providers.py
  python scripts/seed_listed_providers.py --min-per-service 20 --max-per-service 30 --seed 42
  python scripts/seed_listed_providers.py --no-delete --password "YourPass@1"
"""

from __future__ import annotations

import argparse
import asyncio
import json
import random
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.security import hash_password
from app.db.mongodb import mongodb
from app.repositories.user_repository import UserRepository

DEFAULT_PASSWORD = "Password@123"
DEFAULT_MIN_PER_SERVICE = 20
DEFAULT_MAX_PER_SERVICE = 30

TARGET_SERVICES: dict[str, str] = {
    "Security Guards": "Security",
    "Delivery / Helper / Loader": "Delivery & loading",
    "Event Helpers": "Events",
    "On-Demand Drivers": "Transport",
}

SERVICE_PRICE_RANGES: dict[str, tuple[int, int]] = {
    "Security Guards": (800, 1500),
    "Delivery / Helper / Loader": (400, 1000),
    "Event Helpers": (400, 1000),
    "On-Demand Drivers": (500, 1200),
}

FIRST_NAMES = [
    "Arjun",
    "Priya",
    "Vikram",
    "Ananya",
    "Rohan",
    "Kavita",
    "Rajesh",
    "Meera",
    "Amit",
    "Sneha",
    "Karthik",
    "Divya",
    "Suresh",
    "Neha",
    "Rahul",
    "Pooja",
    "Manish",
    "Deepika",
    "Sanjay",
    "Isha",
]

LAST_NAMES = [
    "Sharma",
    "Patel",
    "Kapoor",
    "Reddy",
    "Iyer",
    "Singh",
    "Khan",
    "Das",
    "Joshi",
    "Verma",
    "Nair",
    "Bose",
    "Mehta",
    "Gupta",
    "Malhotra",
    "Rao",
]


def _load_cities() -> list[tuple[str, str]]:
    path = PROJECT_ROOT / "app" / "data" / "indian_cities.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [(row["name"], row["state"]) for row in raw if "name" in row and "state" in row]


def _city_sequence(cities: list[tuple[str, str]], total: int, rng: random.Random) -> list[tuple[str, str]]:
    ring = cities[:]
    rng.shuffle(ring)
    return [ring[i % len(ring)] for i in range(total)]


def _build_address(city: str, state: str, rng: random.Random) -> str:
    locality = rng.choice(["Sector", "Colony", "Main Rd", "Cross Rd", "Nagar", "Layout"])
    return f"{rng.randint(1, 240)} {locality} {rng.randint(1, 99)}, {city}, {state}, India"


def _portrait_url(rng: random.Random) -> str:
    gender = rng.choice(["men", "women"])
    idx = rng.randint(0, 99)
    return f"https://randomuser.me/api/portraits/{gender}/{idx}.jpg"


def _indian_mobile(rng: random.Random) -> str:
    return rng.choice("6789") + "".join(str(rng.randint(0, 9)) for _ in range(9))


def _aadhaar_like(rng: random.Random) -> str:
    return "".join(str(rng.randint(0, 9)) for _ in range(12))


def _build_pan(rng: random.Random, i: int) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    prefix = "".join(letters[(i * 7 + rng.randint(0, 25) + step) % 26] for step in range(5))
    digits = f"{1000 + (i * 13 + rng.randint(0, 8999)) % 9000:04d}"
    suffix = letters[(i * 3 + rng.randint(0, 25)) % 26]
    return f"{prefix}{digits}{suffix}"


def _build_bio(name: str, service: str, city: str, years: int) -> str:
    return (
        f"I am {name}, a {service} professional based in {city}. "
        f"I have {years} years of field experience and focus on punctuality, clear communication, "
        "and dependable service in every booking."
    )


async def run(*, password: str, min_per_service: int, max_per_service: int, seed: int | None, no_delete: bool) -> None:
    if min_per_service <= 0 or max_per_service <= 0 or min_per_service > max_per_service:
        raise ValueError("Invalid per-service range. Ensure 1 <= min-per-service <= max-per-service.")

    rng = random.Random(seed if seed is not None else random.randrange(1 << 30))
    run_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    per_service_counts: dict[str, int] = {
        service: rng.randint(min_per_service, max_per_service) for service in TARGET_SERVICES
    }
    total = sum(per_service_counts.values())
    cities = _load_cities()
    if not cities:
        raise RuntimeError("No cities available in app/data/indian_cities.json")
    city_assignments = _city_sequence(cities, total, rng)

    await mongodb.connect()
    users = mongodb.db["users"]
    user_repo = UserRepository(mongodb.db)
    await user_repo.create_indexes()

    hashed_password = hash_password(password)
    used_phones: set[str] = set()
    used_names: set[str] = set()
    service_counter: Counter[str] = Counter()
    city_counter: Counter[str] = Counter()
    created = 0
    skipped = 0
    assignment_idx = 0

    try:
        if not no_delete:
            deleted = await users.delete_many({"role": "provider"})
            print(f"Removed {deleted.deleted_count} existing provider user(s).")
        else:
            print("Skipped delete (--no-delete).")

        for service, count in per_service_counts.items():
            category = TARGET_SERVICES[service]
            min_day, max_day = SERVICE_PRICE_RANGES.get(service, (900, 2800))

            for n in range(count):
                city, state = city_assignments[assignment_idx]
                assignment_idx += 1

                for _ in range(60):
                    name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
                    if name not in used_names:
                        used_names.add(name)
                        break
                else:
                    name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)} {created + 1}"
                    used_names.add(name)

                email = f"provider.listed+{run_tag}.{created + 1:04d}@haazir.local"
                if await user_repo.find_by_email(email):
                    skipped += 1
                    continue

                phone = _indian_mobile(rng)
                for _ in range(120):
                    if phone not in used_phones:
                        used_phones.add(phone)
                        break
                    phone = _indian_mobile(rng)

                years = 2 + rng.randint(0, 12)
                payload = {
                    "email": email,
                    "hashed_password": hashed_password,
                    "full_name": name,
                    "role": "provider",
                    "phone": phone,
                    "terms_accepted": True,
                    "service_category": category,
                    "services": [service],
                    "price_per_day": float(rng.randint(min_day, max_day)),
                    "price_per_hour": float(rng.randint(150, 450)),
                    "profile_photo": _portrait_url(rng),
                    "about": _build_bio(name, service, city, years),
                    "address": _build_address(city, state, rng),
                    "age": 22 + rng.randint(0, 25),
                    "aadhaar_number": _aadhaar_like(rng),
                    "pan_card": _build_pan(rng, created + 1),
                    "is_active": True,
                }
                await user_repo.create_user(payload)
                created += 1
                service_counter[service] += 1
                city_counter[city] += 1

                print(f"Created: {name} | {service} | {city} | ₹{payload['price_per_day']:.0f}/day")
    finally:
        await mongodb.disconnect()

    print()
    print("Listed service provider seed complete")
    print(f"- total_created: {created}")
    print(f"- skipped_existing_email: {skipped}")
    print(f"- per_service_requested: {per_service_counts}")
    print(f"- per_service_created: {dict(service_counter)}")
    print(f"- distinct_cities_used: {len(city_counter)}")
    print(f"- common_password: (your --password or default {DEFAULT_PASSWORD})")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed 20-30 providers per listed service across many Indian cities.",
    )
    parser.add_argument("--password", type=str, default=DEFAULT_PASSWORD)
    parser.add_argument("--min-per-service", type=int, default=DEFAULT_MIN_PER_SERVICE)
    parser.add_argument("--max-per-service", type=int, default=DEFAULT_MAX_PER_SERVICE)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--no-delete", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    asyncio.run(
        run(
            password=args.password,
            min_per_service=args.min_per_service,
            max_per_service=args.max_per_service,
            seed=args.seed,
            no_delete=args.no_delete,
        )
    )
