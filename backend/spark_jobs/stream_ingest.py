import argparse

from pyspark.sql import functions as F

from common import build_spark_session


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Streaming input folder")
    parser.add_argument("--output", required=True, help="Streaming output folder")
    parser.add_argument("--checkpoint", required=False, default="./streaming_checkpoint")
    args = parser.parse_args()

    spark = build_spark_session("earthscape-structured-stream")

    schema = "timestamp STRING, region STRING, latitude DOUBLE, longitude DOUBLE, temperature DOUBLE"
    stream_df = (
        spark.readStream.option("header", True)
        .schema(schema)
        .csv(args.input)
        .withColumn("event_time", F.to_timestamp("timestamp"))
    )

    aggregated = (
        stream_df.withWatermark("event_time", "1 minute")
        .groupBy(F.window("event_time", "30 seconds"), F.col("region"))
        .agg(F.avg("temperature").alias("avg_temperature"), F.max("temperature").alias("max_temperature"))
    )

    query = (
        aggregated.writeStream.outputMode("append")
        .format("parquet")
        .option("checkpointLocation", args.checkpoint)
        .option("path", args.output)
        .trigger(processingTime="20 seconds")
        .start()
    )

    query.awaitTermination()


if __name__ == "__main__":
    main()
