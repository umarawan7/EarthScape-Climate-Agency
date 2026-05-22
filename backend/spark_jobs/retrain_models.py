import argparse
import json
from pathlib import Path

import joblib
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
from pyspark.sql import functions as F
from sklearn.ensemble import IsolationForest

from common import build_spark_session, read_input, standardize_columns


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    spark = build_spark_session("earthscape-retrain-models")
    df = standardize_columns(read_input(spark, args.input))

    required = ["temperature_c", "latitude_num", "longitude_num"]
    prepared = df
    for column in required:
        if column not in prepared.columns:
            prepared = prepared.withColumn(column, F.lit(0.0))

    if "date" in prepared.columns:
        prepared = prepared.withColumn("year", F.year("date")).withColumn("month", F.month("date"))
    else:
        prepared = prepared.withColumn("year", F.lit(1900)).withColumn("month", F.lit(1))

    if "temperature_uncertainty" in prepared.columns:
        yearly_stats = prepared.groupBy("year").agg(
            F.avg("temperature_uncertainty").alias("avg_uncertainty"),
            (
                F.sum(F.when(F.col("temperature_c").isNull(), F.lit(1)).otherwise(F.lit(0))) / F.count(F.lit(1)) * F.lit(100.0)
            ).alias("missing_pct"),
        )
        best_year_row = (
            yearly_stats.filter((F.col("avg_uncertainty") < 0.75) & (F.col("missing_pct") < 2.0))
            .agg(F.min("year").alias("best_start_year"))
            .collect()[0]
        )
        best_start_year = int(best_year_row["best_start_year"]) if best_year_row["best_start_year"] is not None else 1900
    else:
        best_start_year = 1900

    prepared = prepared.filter(F.col("year") >= F.lit(best_start_year))
    prepared = prepared.dropna(subset=["temperature_c", "latitude_num", "longitude_num"])
    features_pd = prepared.select("temperature_c", "latitude_num", "longitude_num").toPandas()

    iso_model = IsolationForest(random_state=42, contamination=0.02)
    iso_model.fit(features_pd.values)

    repo_root = Path(__file__).resolve().parents[2]
    model_dir = repo_root / "backend" / "ml" / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    isolation_path = model_dir / "isolation_forest.pkl"
    joblib.dump(iso_model, isolation_path)

    prepared = prepared.withColumn("time_idx", F.col("year").cast("double") + (F.col("month").cast("double") - F.lit(1.0)) / F.lit(12.0))

    spark_train = prepared.select("time_idx", "latitude_num", "longitude_num", "temperature_c").dropna()
    assembler = VectorAssembler(inputCols=["time_idx", "latitude_num", "longitude_num"], outputCol="features")
    train_features = assembler.transform(spark_train)
    lr = LinearRegression(featuresCol="features", labelCol="temperature_c")
    lr_model = lr.fit(train_features)

    spark_model_path = str(model_dir / "spark_linear_regression")
    lr_model.write().overwrite().save(spark_model_path)

    summary = {
        "isolation_forest": str(isolation_path),
        "linear_regression": spark_model_path,
        "records_used": int(spark_train.count()),
    }

    Path(args.output).mkdir(parents=True, exist_ok=True)
    with open(Path(args.output) / "training_summary.json", "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=2)

    spark.stop()


if __name__ == "__main__":
    main()
