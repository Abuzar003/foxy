"""
Run the provider batch seed from the backend folder:

  python seed_final_provider.py
  python seed_final_provider.py --count 75
  python seed_final_provider.py --seed 42 --password "YourPass@1"

Implementation: scripts/seed_final_provider.py
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path


def main() -> None:
    script = Path(__file__).resolve().parent / "scripts" / "seed_final_provider.py"
    if not script.is_file():
        print(f"Expected seed script at {script}", file=sys.stderr)
        raise SystemExit(1)
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
