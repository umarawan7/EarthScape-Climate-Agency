import argparse

from pyspark.sql import functions as F
from pyspark.sql.window import Window

from common import build_spark_session, read_input, standardize_columns


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    spark = build_spark_session("earthscape-pattern-detection")
    df = standardize_columns(read_input(spark, args.input))

    if "country" not in df.columns:
        df = df.withColumn("country", F.lit("unknown"))
    if "date" not in df.columns:
        df = df.withColumn("date", F.current_timestamp())

    window = Window.partitionBy("country").orderBy("date").rowsBetween(-6, 0)
    output = (
        df.withColumn("rolling_avg_7", F.avg("temperature_c").over(window))
        .withColumn("deviation_from_roll", F.col("temperature_c") - F.col("rolling_avg_7"))
    )

    output.write.mode("overwrite").parquet(args.output)
    spark.stop()


if __name__ == "__main__":
    main()
