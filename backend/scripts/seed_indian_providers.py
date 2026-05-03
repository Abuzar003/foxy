"""
Seed provider users with Indian names, addresses, bios, INR-style rates, and
portrait URLs. The total count is split randomly across service categories
(each provider is assigned one primary category; counts look like "5 here,
2 there, 10 there" over Transport, Home help, etc.).

From the backend folder (either works):
  python seed_indian_providers.py
  python scripts/seed_indian_providers.py

Examples:
  python seed_indian_providers.py --count 17 --seed 42
  python scripts/seed_indian_providers.py --count 50 --password "YourPass@1"

From inside backend/scripts (this folder):
  python seed_indian_providers.py
  python seed_indian_providers.py --count 5 --password "YourPass@1"
"""

from __future__ import annotations

import argparse
import asyncio
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
    "Aditya",
    "Riya",
    "Nikhil",
    "Anjali",
    "Harish",
    "Lakshmi",
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
    "Chopra",
    "Rao",
    "Pillai",
    "Agarwal",
    "Banerjee",
    "Kulkarni",
    "Menon",
    "Bhatt",
    "Saxena",
    "Tiwari",
]

# (city, locality, state, pincode fragment for realistic-looking pin)
LOCATIONS: list[tuple[str, str, str, str]] = [
    ("Mumbai", "Bandra West", "Maharashtra", "400050"),
    ("Mumbai", "Andheri East", "Maharashtra", "400069"),
    ("Delhi", "Greater Kailash II", "Delhi", "110048"),
    ("Delhi", "Dwarka Sector 12", "Delhi", "110078"),
    ("Bengaluru", "Koramangala 5th Block", "Karnataka", "560095"),
    ("Bengaluru", "HSR Layout Sector 2", "Karnataka", "560102"),
    ("Hyderabad", "Hitech City", "Telangana", "500081"),
    ("Hyderabad", "Banjara Hills", "Telangana", "500034"),
    ("Chennai", "T Nagar", "Tamil Nadu", "600017"),
    ("Chennai", "Velachery", "Tamil Nadu", "600042"),
    ("Kolkata", "Salt Lake Sector V", "West Bengal", "700091"),
    ("Pune", "Koregaon Park", "Maharashtra", "411001"),
    ("Ahmedabad", "Satellite", "Gujarat", "380015"),
    ("Jaipur", "C-Scheme", "Rajasthan", "302001"),
    ("Kochi", "Panampilly Nagar", "Kerala", "682036"),
    ("Indore", "Vijay Nagar", "Madhya Pradesh", "452010"),
    ("Lucknow", "Gomti Nagar", "Uttar Pradesh", "226010"),
    ("Noida", "Sector 62", "Uttar Pradesh", "201301"),
    ("Gurugram", "DLF Phase 3", "Haryana", "122002"),
    ("Surat", "Adajan", "Gujarat", "395009"),
    ("Nagpur", "Dharampeth", "Maharashtra", "440010"),
]


def _all_service_names() -> list[str]:
    return [s for services in SERVICE_TAXONOMY.values() for s in services]


def _random_counts_per_category(rng: random.Random, total: int) -> dict[str, int]:
    """Multinomial-style split: each provider is assigned a random category (sums to total)."""
    categories = list(SERVICE_TAXONOMY.keys())
    counts: dict[str, int] = {c: 0 for c in categories}
    for _ in range(total):
        counts[rng.choice(categories)] += 1
    return counts


def _category_assignment_order(rng: random.Random, counts: dict[str, int]) -> list[str]:
    """Flatten counts into one row per provider and shuffle so DB inserts are mixed."""
    row: list[str] = []
    for category, n in counts.items():
        row.extend([category] * n)
    rng.shuffle(row)
    return row


def _build_address(city: str, locality: str, state: str, pin: str, house_no: int) -> str:
    return (
        f"{house_no}, {locality}, {city}, {state} {pin}, India"
    )


def _build_bio(full_name: str, primary_service: str, city: str, years: int) -> str:
    return (
        f"I am {full_name}, a {primary_service} professional based in {city}. "
        f"I have been serving households and businesses across {city} for over {years} years, "
        "with a focus on punctuality, clear communication, and dependable work on every job. "
        f"I am proud to be part of the {PLATFORM_NAME} network and look forward to helping you."
    )


def _build_pan(rng: random.Random, index: int) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    prefix = "".join(letters[(index * 11 + rng.randint(0, 25) + i * 3) % 26] for i in range(5))
    digits = f"{1000 + (index * 17 + rng.randint(0, 999)) % 9000:04d}"
    suffix = letters[(index * 5 + rng.randint(0, 25)) % 26]
    return f"{prefix}{digits}{suffix}"


def _portrait_url(rng: random.Random) -> str:
    """Stable CDN portrait; gender bucket spreads variety."""
    gender = rng.choice(["men", "women"])
    idx = rng.randint(0, 99)
    return f"https://randomuser.me/api/portraits/{gender}/{idx}.jpg"


def _indian_mobile(rng: random.Random) -> str:
    first = rng.choice("6789")
    rest = "".join(str(rng.randint(0, 9)) for _ in range(9))
    return first + rest


def _aadhaar_like(rng: random.Random) -> str:
    return "".join(str(rng.randint(0, 9)) for _ in range(12))


MAX_PROVIDERS_PER_RUN = 200


async def seed_indian_providers(count: int, password: str, seed: int | None) -> None:
    if count < 1 or count > MAX_PROVIDERS_PER_RUN:
        raise ValueError(f"count must be between 1 and {MAX_PROVIDERS_PER_RUN} (inclusive)")

    await mongodb.connect()
    user_repo = UserRepository(mongodb.db)
    await user_repo.create_indexes()

    all_services = _all_service_names()
    rng = random.Random(seed if seed is not None else random.randrange(1 << 30))
    hashed_password = hash_password(password)
    run_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    planned = _random_counts_per_category(rng, count)
    assignments = _category_assignment_order(rng, planned)

    print("Random split by service category (this run):")
    for cat in SERVICE_TAXONOMY:
        print(f"  - {cat}: {planned[cat]}")
    print(f"  (total {count})\n")

    used_names: set[str] = set()
    used_phones: set[str] = set()
    created_count = 0
    skipped_count = 0
    category_counter: Counter[str] = Counter()
    service_counter: Counter[str] = Counter()

    try:
        for index, category in enumerate(assignments):
            cat_services = SERVICE_TAXONOMY[category]
            primary_service = rng.choice(cat_services)
            others = [s for s in all_services if s != primary_service]
            extra_n = rng.randint(0, min(2, len(others)))
            services = [primary_service]
            if extra_n:
                services.extend(rng.sample(others, extra_n))

            city, locality, state, pin = rng.choice(LOCATIONS)
            house_no = 12 + rng.randint(1, 180)

            for _ in range(50):
                full_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
                if full_name not in used_names:
                    used_names.add(full_name)
                    break
            else:
                full_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)} {index + 1}"
                used_names.add(full_name)

            email = f"provider.india+{run_tag}.{index + 1:04d}@haazir.local"

            phone = _indian_mobile(rng)
            for _ in range(100):
                if phone not in used_phones:
                    used_phones.add(phone)
                    break
                phone = _indian_mobile(rng)

            if await user_repo.find_by_email(email):
                skipped_count += 1
                continue

            years = 2 + rng.randint(0, 12)
            price_per_day = float(rng.randint(900, 2800))
            price_per_hour = float(rng.randint(150, 450))

            payload = {
                "email": email,
                "hashed_password": hashed_password,
                "full_name": full_name,
                "role": "provider",
                "phone": phone,
                "terms_accepted": True,
                "service_category": category,
                "services": services,
                "price_per_day": price_per_day,
                "price_per_hour": price_per_hour,
                "profile_photo": _portrait_url(rng),
                "about": _build_bio(full_name, primary_service, city, years),
                "address": _build_address(city, locality, state, pin, house_no),
                "age": 22 + rng.randint(0, 25),
                "aadhaar_number": _aadhaar_like(rng),
                "pan_card": _build_pan(rng, index + 1),
                "is_active": True,
            }

            await user_repo.create_user(payload)
            created_count += 1
            category_counter[category] += 1
            for service in services:
                service_counter[service] += 1

            print(
                f"Created: {full_name} | [{category}] {city} | "
                f"₹{price_per_hour:.0f}/hr, ₹{price_per_day:.0f}/day | {primary_service}"
            )
    finally:
        await mongodb.disconnect()

    print()
    print("Indian provider seed complete")
    print(f"- requested_total: {count}")
    print(f"- planned_split: {dict(planned)}")
    print(f"- created: {created_count}")
    print(f"- skipped_existing: {skipped_count}")
    print(f"- categories: {dict(category_counter)}")
    print(f"- services: {dict(service_counter)}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Seed Indian provider users; total count is split randomly across "
            f"service categories (multinomial, max {MAX_PROVIDERS_PER_RUN} per run)."
        ),
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        help=(
            f"Total providers to create (1–{MAX_PROVIDERS_PER_RUN}). "
            "If omitted, a random total between 12 and 40 is used so category counts vary "
            "(e.g. a few in one category, many in another)."
        ),
    )
    parser.add_argument(
        "--password",
        type=str,
        default=DEFAULT_PASSWORD,
        help=f"Common password for all generated providers (default: {DEFAULT_PASSWORD}).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional RNG seed for reproducible names, prices, and image picks.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    n = args.count if args.count is not None else random.randint(12, 40)
    asyncio.run(seed_indian_providers(count=n, password=args.password, seed=args.seed))
