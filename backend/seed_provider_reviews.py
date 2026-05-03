"""
Run provider review seed from the backend folder:

  python seed_provider_reviews.py
  python seed_provider_reviews.py --seed 1 --good-ratio 0.5

Implementation: scripts/seed_provider_reviews.py
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path


def main() -> None:
    script = Path(__file__).resolve().parent / "scripts" / "seed_provider_reviews.py"
    if not script.is_file():
        print(f"Expected seed script at {script}", file=sys.stderr)
        raise SystemExit(1)
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
