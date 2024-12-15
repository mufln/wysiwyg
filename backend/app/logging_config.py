import time
from typing import Any

import structlog
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.psycopg import PsycopgInstrumentor
from opentelemetry.instrumentation.pika import PikaInstrumentor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from prometheus_client import Counter, Histogram

from .config import Settings

settings = Settings()

# Set up structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)


def get_logger(name: str):
    return structlog.get_logger(name)


# Set up OpenTelemetry tracing
def setup_tracing(service_name: str, app):
    resource = Resource.create({SERVICE_NAME: service_name})
    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)
    if settings.jaeger_enable:
        exporter = OTLPSpanExporter(endpoint=f"http://{settings.jaeger_agent_host}:{settings.jaeger_agent_port}/v1/traces")
        tracer_provider.add_span_processor(SimpleSpanProcessor(exporter))
    FastAPIInstrumentor.instrument_app(app)
    FastAPIInstrumentor().instrument()
    PsycopgInstrumentor().instrument()
    PikaInstrumentor().instrument()


REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"]
)

DB_QUERY_LATENCY = Histogram(
    "db_query_duration_seconds",
    "Database query latency in seconds",
    ["query_type"]
)

RABBITMQ_MESSAGE_COUNT = Counter(
    "rabbitmq_messages_total",
    "Total number of RabbitMQ messages",
    ["queue", "status"]
)


# Middleware for logging requests and responses
async def logging_middleware(request: Any, call_next: Any) -> Any:
    logger = get_logger(__name__)

    with REQUEST_LATENCY.labels(request.method, request.url.path).time():
        response = await call_next(request)
    REQUEST_COUNT.labels(request.method, request.url.path, response.status_code).inc()

    logger.info(
        "Request processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        client_ip=request.client.host,
    )

    return response


# Context manager for database query timing
class DBQueryTimer:
    def __init__(self, query_type: str):
        self.query_type = query_type
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is not None:
            duration = time.time() - self.start_time
            DB_QUERY_LATENCY.labels(self.query_type).observe(duration)


# Function to log RabbitMQ message activity
def log_rabbitmq_message(queue: str, status: str):
    RABBITMQ_MESSAGE_COUNT.labels(queue, status).inc()
    logger = get_logger(__name__)
    logger.info(f"RabbitMQ message {status}", queue=queue)


# Initialize logging and tracing
def init_logging_and_tracing(service_name: str, app):
    setup_tracing(service_name, app)
    logger = get_logger(__name__)
    logger.info(f"Logging and tracing initialized for {service_name}")
