"""Standalone model training helper for the saved Isolation Forest model."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest


def parse_latlon(value: str | float | int) -> float:
    if isinstance(value, (float, int)):
        return float(value)
    text = str(value).strip().upper()
    number = ""
    for ch in text:
        if ch.isdigit() or ch in {".", "-", "+"}:
            number += ch
    if not number:
        return 0.0
    numeric = float(number)
    if text.endswith("S") or text.endswith("W"):
        return -numeric
    return numeric


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    raw_dir = repo_root / "data" / "raw"
    model_dir = repo_root / "backend" / "ml" / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    csv_files = sorted(raw_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError("No CSV files found in data/raw. Download dataset first.")

    frame = pd.read_csv(csv_files[0])

    if "dt" in frame.columns:
        frame["dt"] = pd.to_datetime(frame["dt"], errors="coerce")
        frame["year"] = frame["dt"].dt.year
        frame["month"] = frame["dt"].dt.month
    else:
        frame["year"] = 1900
        frame["month"] = 1

    if "AverageTemperatureUncertainty" in frame.columns and "year" in frame.columns:
        yearly_stats = (
            frame.groupby("year")
            .agg(
                avg_uncertainty=("AverageTemperatureUncertainty", "mean"),
                missing_pct=("AverageTemperature", lambda x: x.isna().mean() * 100),
            )
            .reset_index()
        )
        quality_condition = (yearly_stats["avg_uncertainty"] < 0.75) & (yearly_stats["missing_pct"] < 2.0)
        valid_years = yearly_stats[quality_condition]
        best_start_year = int(valid_years["year"].min()) if not valid_years.empty else 1900
    else:
        best_start_year = 1900

    frame = frame[frame["year"] >= best_start_year].copy()

    frame = frame.rename(
        columns={
            "AverageTemperature": "temperature_c",
            "Latitude": "latitude",
            "Longitude": "longitude",
        }
    )
    frame["temperature_c"] = pd.to_numeric(frame["temperature_c"], errors="coerce")
    frame["latitude_num"] = frame["latitude"].map(parse_latlon)
    frame["longitude_num"] = frame["longitude"].map(parse_latlon)
    train = frame[["year", "month", "temperature_c", "latitude_num", "longitude_num"]].dropna()

    model = IsolationForest(random_state=42, contamination=0.02)
    model.fit(train[["temperature_c", "latitude_num", "longitude_num"]].values)

    out = model_dir / "isolation_forest.pkl"
    joblib.dump(model, out)
    print(f"Saved model to {out}")


if __name__ == "__main__":
    main()
