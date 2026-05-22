import argparse

from pyspark.sql import functions as F

from common import build_spark_session, read_input, standardize_columns


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    spark = build_spark_session("earthscape-anomaly-batch")
    df = standardize_columns(read_input(spark, args.input))

    stats = df.agg(
        F.avg("temperature_c").alias("mean_temp"),
        F.stddev_pop("temperature_c").alias("std_temp"),
    ).collect()[0]

    mean_temp = float(stats["mean_temp"] or 0.0)
    std_temp = float(stats["std_temp"] or 1.0)

    output = (
        df.withColumn("z_score", (F.col("temperature_c") - F.lit(mean_temp)) / F.lit(std_temp if std_temp else 1.0))
        .withColumn("is_anomaly", F.abs(F.col("z_score")) > F.lit(3.0))
    )

    output.write.mode("overwrite").parquet(args.output)
    spark.stop()


if __name__ == "__main__":
    main()
