SERVICE_TAXONOMY: dict[str, list[str]] = {
    "Home help": [
        "Maids / Helpers",
    ],
}

ALL_SERVICES = {service for services in SERVICE_TAXONOMY.values() for service in services}


def category_for_service(service: str) -> str | None:
    for category, services in SERVICE_TAXONOMY.items():
        if service in services:
            return category
    return None
