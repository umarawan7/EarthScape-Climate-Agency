import re
from pathlib import Path

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F


def build_spark_session(app_name: str) -> SparkSession:
    return (
        SparkSession.builder.appName(app_name)
        .master("local[*]")
        .config("spark.sql.shuffle.partitions", "8")
        .getOrCreate()
    )


def read_input(spark: SparkSession, input_path: str) -> DataFrame:
    path = Path(input_path)
    if path.is_dir():
        csv_files = list(path.rglob("*.csv"))
        if not csv_files:
            raise FileNotFoundError(f"No CSV files found under {input_path}")
        return spark.read.option("header", True).option("inferSchema", True).csv([str(item) for item in csv_files])

    if path.suffix.lower() == ".parquet":
        return spark.read.parquet(str(path))
    return spark.read.option("header", True).option("inferSchema", True).csv(str(path))


def parse_latlon_column(column_name: str):
    direction = F.upper(F.regexp_extract(F.col(column_name).cast("string"), r"([NSEW])", 1))
    numeric = F.regexp_extract(F.col(column_name).cast("string"), r"([-+]?[0-9]*\.?[0-9]+)", 1).cast("double")

    signed = (
        F.when(direction.isin("S", "W"), -numeric)
        .when(direction.isin("N", "E"), numeric)
        .otherwise(F.col(column_name).cast("double"))
    )
    return signed


def standardize_columns(df: DataFrame) -> DataFrame:
    renamed = df
    mapping = {
        "AverageTemperature": "temperature_c",
        "AverageTemperatureUncertainty": "temperature_uncertainty",
        "dt": "date",
        "Latitude": "latitude",
        "Longitude": "longitude",
        "Country": "country",
        "City": "city",
    }
    for source, target in mapping.items():
        if source in renamed.columns:
            renamed = renamed.withColumnRenamed(source, target)

    if "date" in renamed.columns:
        renamed = renamed.withColumn("date", F.to_timestamp("date"))

    if "latitude" in renamed.columns:
        renamed = renamed.withColumn("latitude_num", parse_latlon_column("latitude"))

    if "longitude" in renamed.columns:
        renamed = renamed.withColumn("longitude_num", parse_latlon_column("longitude"))

    if "temperature_c" in renamed.columns:
        renamed = renamed.withColumn("temperature_c", F.col("temperature_c").cast("double"))
        renamed = renamed.withColumn("temperature_f", F.col("temperature_c") * F.lit(9.0 / 5.0) + F.lit(32.0))

    if "country" in renamed.columns:
        renamed = renamed.withColumn("country", F.trim(F.col("country")))
    if "city" in renamed.columns:
        renamed = renamed.withColumn("city", F.trim(F.col("city")))

    return renamed
