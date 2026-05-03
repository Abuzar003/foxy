SERVICE_TAXONOMY: dict[str, list[str]] = {
    "Transport": [
        "On-Demand Drivers",
    ],
    "Home help": [
        "Maids / Helpers",
    ],
    "Delivery & loading": [
        "Delivery / Helper / Loader",
    ],
    "Events": [
        "Event Helpers",
    ],
    "Security": [
        "Security Guards",
    ],
}

ALL_SERVICES = {service for services in SERVICE_TAXONOMY.values() for service in services}


def category_for_service(service: str) -> str | None:
    for category, services in SERVICE_TAXONOMY.items():
        if service in services:
            return category
    return None
