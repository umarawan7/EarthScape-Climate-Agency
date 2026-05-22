import argparse

from pyspark.sql import functions as F

from common import build_spark_session, read_input, standardize_columns


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    spark = build_spark_session("earthscape-aggregate-stats")
    df = standardize_columns(read_input(spark, args.input))

    working = df
    if "date" in working.columns:
        working = working.withColumn("year", F.year("date"))
    else:
        working = working.withColumn("year", F.lit(None).cast("int"))

    if "country" not in working.columns:
        working = working.withColumn("country", F.lit("unknown"))

    stats = (
        working.groupBy("country", "year")
        .agg(
            F.avg("temperature_c").alias("avg_temperature_c"),
            F.min("temperature_c").alias("min_temperature_c"),
            F.max("temperature_c").alias("max_temperature_c"),
            F.count("*").alias("record_count"),
        )
        .orderBy("country", "year")
    )

    stats.write.mode("overwrite").parquet(args.output)
    spark.stop()


if __name__ == "__main__":
    main()
