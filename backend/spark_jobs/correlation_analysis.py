import argparse

from pyspark.sql import functions as F

from common import build_spark_session, read_input, standardize_columns


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    spark = build_spark_session("earthscape-correlation-analysis")
    df = standardize_columns(read_input(spark, args.input))

    working = df
    if "latitude_num" not in working.columns:
        working = working.withColumn("latitude_num", F.lit(0.0))

    corr_value = working.select(F.corr("temperature_c", "latitude_num").alias("correlation")).collect()[0]["correlation"]
    out = spark.createDataFrame(
        [(float(corr_value or 0.0),)],
        ["temperature_latitude_correlation"],
    )

    out.write.mode("overwrite").parquet(args.output)
    spark.stop()


if __name__ == "__main__":
    main()
