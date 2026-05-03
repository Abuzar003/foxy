"""
Reset provider users, then seed many providers (default: random 50–100).

1. Deletes every user with role \"provider\" from MongoDB (unless --no-delete).
2. Inserts N providers; each has exactly one catalog service (from SERVICE_TAXONOMY).
3. Addresses spread across all cities in app/data/indian_cities.json (includes
   Bhopal, Indore, and the rest) via a shuffled round-robin.

From the backend folder:
  python scripts/seed_final_provider.py
  python scripts/seed_final_provider.py --count 75
  python scripts/seed_final_provider.py --password \"YourPass@1\" --seed 42
  python scripts/seed_final_provider.py --no-delete --count 10
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
from app.core.service_taxonomy import SERVICE_TAXONOMY
from app.db.mongodb import mongodb
from app.repositories.user_repository import UserRepository

DEFAULT_PASSWORD = "Password@123"
PLATFORM_NAME = "Haazir"
DEFAULT_COUNT_MIN = 50
DEFAULT_COUNT_MAX = 100
ABS_COUNT_MIN = 1
ABS_COUNT_MAX = 250

FIRST_NAMES = [
    "Arjun", "Priya", "Vikram", "Ananya", "Rohan", "Kavita", "Rajesh", "Meera",
    "Amit", "Sneha", "Karthik", "Divya", "Suresh", "Neha", "Rahul", "Pooja",
    "Manish", "Deepika", "Sanjay", "Isha", "Aditya", "Riya", "Nikhil", "Anjali",
    "Harish", "Lakshmi", "Vivek", "Swati", "Gaurav", "Shreya",
]
LAST_NAMES = [
    "Sharma", "Patel", "Kapoor", "Reddy", "Iyer", "Singh", "Khan", "Das",
    "Joshi", "Verma", "Nair", "Bose", "Mehta", "Gupta", "Malhotra", "Rao",
    "Kulkarni", "Menon", "Bhatt", "Saxena", "Tiwari", "Chopra", "Agarwal",
]


def _flatten_services() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for category, services in SERVICE_TAXONOMY.items():
        for service in services:
            pairs.append((category, service))
    return pairs


def _load_cities() -> list[tuple[str, str]]:
    path = PROJECT_ROOT / "app" / "data" / "indian_cities.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [(row["name"], row["state"]) for row in raw if "name" in row and "state" in row]


def _city_sequence(cities: list[tuple[str, str]], count: int, rng: random.Random) -> list[tuple[str, str]]:
    """
    Round-robin across all cities in the JSON. Bhopal and Indore are placed first
    (when present) so they always get at least one provider whenever count >= 1
    (Bhopal) and count >= 2 (Indore); remaining cities follow in random order.
    """
    by_name = {city: (city, state) for city, state in cities}
    bhopal = by_name.get("Bhopal")
    indore = by_name.get("Indore")
    others = [p for p in cities if p[0] not in ("Bhopal", "Indore")]
    rng.shuffle(others)
    ring: list[tuple[str, str]] = []
    if bhopal:
        ring.append(bhopal)
    if indore:
        ring.append(indore)
    ring.extend(others)
    if not ring:
        ring = cities[:]
        rng.shuffle(ring)
    return [ring[i % len(ring)] for i in range(count)]


def _indian_mobile(rng: random.Random) -> str:
    first = rng.choice("6789")
    rest = "".join(str(rng.randint(0, 9)) for _ in range(9))
    return first + rest


def _aadhaar_like(rng: random.Random) -> str:
    return "".join(str(rng.randint(0, 9)) for _ in range(12))


def _build_pan(rng: random.Random) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    prefix = "".join(rng.choice(letters) for _ in range(5))
    digits = f"{rng.randint(1000, 9999):04d}"
    suffix = rng.choice(letters)
    return f"{prefix}{digits}{suffix}"


def _portrait_url(rng: random.Random) -> str:
    gender = rng.choice(["men", "women"])
    idx = rng.randint(0, 99)
    return f"https://randomuser.me/api/portraits/{gender}/{idx}.jpg"


def _build_bio(full_name: str, primary_service: str, city: str, years: int) -> str:
    return (
        f"I am {full_name}, a {primary_service} professional based in {city}. "
        f"I have been serving households and businesses for over {years} years, "
        f"with a focus on punctuality and clear communication. Proud to be on {PLATFORM_NAME}."
    )


def _build_address(city: str, state: str, rng: random.Random) -> str:
    sector = rng.randint(1, 48)
    road = rng.choice(["Main Rd", "Cross Rd", "Sector", "Lane", "Nagar", "Colony"])
    return f"{rng.randint(1, 220)} {road} {sector}, {city}, {state}"


async def run(*, password: str, seed: int | None, no_delete: bool, count: int) -> None:
    service_pairs = _flatten_services()
    if not service_pairs:
        raise RuntimeError("SERVICE_TAXONOMY has no services; cannot seed providers.")

    rng = random.Random(seed if seed is not None else random.randrange(1 << 30))
    cities = _load_cities()
    if not cities:
        raise RuntimeError("No cities loaded from indian_cities.json")

    await mongodb.connect()
    users = mongodb.db["users"]
    user_repo = UserRepository(mongodb.db)
    await user_repo.create_indexes()
    run_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    hashed = hash_password(password)
    city_assign = _city_sequence(cities, count, rng)

    created_count = 0
    skipped_count = 0
    used_phones: set[str] = set()
    used_names: set[str] = set()
    city_hits: Counter[str] = Counter()

    try:
        if not no_delete:
            deleted = await users.delete_many({"role": "provider"})
            print(f"Removed {deleted.deleted_count} existing provider user(s).")
        else:
            print("Skipped delete (--no-delete).")

        for i in range(count):
            category, primary_service = service_pairs[i % len(service_pairs)]
            services = [primary_service]
            city, state = city_assign[i]
            city_hits[city] += 1

            for _ in range(80):
                full_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
                if full_name not in used_names:
                    used_names.add(full_name)
                    break
            else:
                full_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)} {i + 1}"
                used_names.add(full_name)

            email = f"provider.batch+{run_tag}.{i + 1:04d}@haazir.local"
            if await user_repo.find_by_email(email):
                skipped_count += 1
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
                "hashed_password": hashed,
                "full_name": full_name,
                "role": "provider",
                "phone": phone,
                "terms_accepted": True,
                "service_category": category,
                "services": services,
                "price_per_day": float(rng.randint(900, 2800)),
                "price_per_hour": float(rng.randint(150, 450)),
                "profile_photo": _portrait_url(rng),
                "about": _build_bio(full_name, primary_service, city, years),
                "address": _build_address(city, state, rng),
                "age": 22 + rng.randint(0, 25),
                "aadhaar_number": _aadhaar_like(rng),
                "pan_card": _build_pan(rng),
                "is_active": True,
            }

            await user_repo.create_user(payload)
            created_count += 1

        bhopal_n = city_hits.get("Bhopal", 0)
        indore_n = city_hits.get("Indore", 0)
        print()
        print("Provider batch seed complete")
        print(f"- requested: {count}")
        print(f"- created: {created_count}")
        print(f"- skipped_existing_email: {skipped_count}")
        print(f"- cities_in_data: {len(cities)}")
        print(f"- distinct_cities_used_this_run: {len(city_hits)}")
        print(f"- providers_in_Bhopal: {bhopal_n}")
        print(f"- providers_in_Indore: {indore_n}")
        print(f"- common_password: (your --password or default {DEFAULT_PASSWORD})")
        print(f"- email pattern: provider.batch+{run_tag}.NNNN@haazir.local")
        print(f"- run at (UTC): {datetime.now(timezone.utc).isoformat()}")
    finally:
        await mongodb.disconnect()


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=(
            "Delete all providers (optional), then insert many single-service providers "
            f"(default count: random {DEFAULT_COUNT_MIN}–{DEFAULT_COUNT_MAX})."
        ),
    )
    p.add_argument(
        "--count",
        type=int,
        default=None,
        help=(
            f"Number of providers to create ({ABS_COUNT_MIN}–{ABS_COUNT_MAX}). "
            f"If omitted, a random integer between {DEFAULT_COUNT_MIN} and {DEFAULT_COUNT_MAX} is used."
        ),
    )
    p.add_argument(
        "--password",
        type=str,
        default=DEFAULT_PASSWORD,
        help=f"Shared login password for all seeded providers (default: {DEFAULT_PASSWORD})",
    )
    p.add_argument("--seed", type=int, default=None, help="Optional RNG seed for reproducible data.")
    p.add_argument(
        "--no-delete",
        action="store_true",
        help="Do not delete existing providers before inserting (may mix with old data).",
    )
    return p.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    n = args.count if args.count is not None else random.randint(DEFAULT_COUNT_MIN, DEFAULT_COUNT_MAX)
    if n < ABS_COUNT_MIN or n > ABS_COUNT_MAX:
        raise SystemExit(f"--count must be between {ABS_COUNT_MIN} and {ABS_COUNT_MAX} (got {n})")
    asyncio.run(run(password=args.password, seed=args.seed, no_delete=args.no_delete, count=n))
