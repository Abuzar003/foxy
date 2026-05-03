"""
Run the Indian provider seed from the backend folder:

  python seed_indian_providers.py --count 17 --seed 42
  python seed_indian_providers.py --count 50 --password "YourPass@1"

Implementation lives in scripts/seed_indian_providers.py.
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path


def main() -> None:
    script = Path(__file__).resolve().parent / "scripts" / "seed_indian_providers.py"
    if not script.is_file():
        print(f"Expected seed script at {script}", file=sys.stderr)
        raise SystemExit(1)
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
