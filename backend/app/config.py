import os
from typing import Annotated

from pydantic import AmqpDsn, Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


def _ensure_alphabetic(value: str):
    return value.isalpha()


class Settings(BaseSettings):
    """Global settings"""
    # Postgres database to connect to
    postgres_dsn: PostgresDsn = Field()
    # Amount of connections single application can have to the database
    postgres_pool_size: int = 64
    # AMQP instance used to communicate to the workers running ML models (only used if `ai_worker_enabled` checked)
    amqp_dsn: AmqpDsn | None = Field()
    # AMQP queue to send parsing requests to
    ai_pdf_queue: str | None = Field()
    ai_latex_ocr_queue: str | None = Field()
    # Enables `/parse_pdf` endpoint for ML parsing of documents.
    ai_worker_enabled: bool = True

    model_config = SettingsConfigDict(env_file=(".env", ".env.prod"))

    jaeger_enable: bool = True
    jaeger_agent_host: str = Field()
    jaeger_agent_port: int = Field()

