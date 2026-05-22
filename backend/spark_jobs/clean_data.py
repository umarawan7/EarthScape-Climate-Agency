import argparse

from pyspark.sql import functions as F

from common import build_spark_session, read_input, standardize_columns


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    spark = build_spark_session("earthscape-clean-data")
    df = standardize_columns(read_input(spark, args.input))

    if "temperature_c" in df.columns:
        mean_temp = df.select(F.avg("temperature_c").alias("avg")).collect()[0]["avg"]
        df = df.withColumn(
            "temperature_c",
            F.when(F.col("temperature_c").isNull(), F.lit(mean_temp)).otherwise(F.col("temperature_c")),
        )

    cleaned = df.dropDuplicates()
    cleaned.write.mode("overwrite").parquet(args.output)
    spark.stop()


if __name__ == "__main__":
    main()
