"""Download Berkeley Earth dataset using kagglehub."""

from pathlib import Path
import shutil

import kagglehub


TARGET_RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"


def main() -> None:
    path = Path(kagglehub.dataset_download("berkeleyearth/climate-change-earth-surface-temperature-data"))
    print(f"Path to dataset files: {path}")

    TARGET_RAW_DIR.mkdir(parents=True, exist_ok=True)

    copied = 0
    for csv_file in path.rglob("*.csv"):
        destination = TARGET_RAW_DIR / csv_file.name
        shutil.copy2(csv_file, destination)
        copied += 1

    print(f"Copied {copied} CSV files to {TARGET_RAW_DIR}")


if __name__ == "__main__":
    main()
