import logging
import uuid
from contextlib import asynccontextmanager
import datetime

import pika
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from .config import Settings
from .models import Formula, FormulaInDb, JobStatus
from .utils import require
from prometheus_client import make_asgi_app
from opentelemetry import trace
from .logging_config import (
    init_logging_and_tracing,
    get_logger,
    logging_middleware,
    DBQueryTimer,
    log_rabbitmq_message,
)
from .compare_functions import percent, find_indexes

settings = Settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.ai_worker_enabled:
        assert settings.amqp_dsn is not None, "AI workers require amqp connection"
        assert (
                settings.ai_pdf_queue is not None
        ), "AI workers require queue to be specified"
    app.async_pool = AsyncConnectionPool(settings.postgres_dsn.unicode_string(), max_size=settings.postgres_pool_size)
    yield
    await app.async_pool.close()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.async_pool: AsyncConnectionPool

pool = AsyncConnectionPool(settings.postgres_dsn.unicode_string(), max_size=settings.postgres_pool_size)

app.middleware("http")(logging_middleware)

logging.basicConfig(level=logging.INFO)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

init_logging_and_tracing("backend", app)


@require(
    settings.amqp_dsn is not None and settings.ai_pdf_queue is not None,
    "This is only available when AMQP specified.",
)
def rabbit_connection():
    connection = pika.BlockingConnection(
        pika.URLParameters(settings.amqp_dsn.unicode_string())
    )
    channel = connection.channel()
    channel.queue_declare(queue=settings.ai_pdf_queue)
    return connection, channel


@app.get("/formulas")
async def get_formulas() -> list[FormulaInDb]:
    """
    Retrieve all formulas from the database.

    :return: A list of FormulaInDb objects representing all formulas in the database.
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("select_formulas"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute("SELECT id, name, latex, source FROM formulas")
                all = await cur.fetchall()
    logger.info(f"Retrieved {len(all)} formulas from the database")
    return list(map(FormulaInDb.model_validate, all))


@app.get("/formulas/{id}")
async def get_formula(id: int):
    """
    Get a formula by its id.
    :param id: The id of the formula to retrieve.
    :type id: int
    :return: A FormulaInDb object containing the details of the formula.
    :rtype: FormulaInDb
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("get_formula"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute("SELECT id, name, latex, source FROM formulas WHERE id = %s", (id,))
                result = await cur.fetchone()
    logger.info(f"Retrieved formula {id} from the database")
    return FormulaInDb.model_validate(result)


@app.post("/formulas")
async def create_formula(formula: Formula):
    """
    Create a new formula in the database.

    :param formula: A Formula object containing the formula details to be inserted.
    :type formula: Formula
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("insert_formula"):
        with DBQueryTimer("insert"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute(
                    "INSERT INTO formulas(name, latex, source) VALUES (%s, %s, %s)",
                    (formula.name, formula.latex, formula.source),
                )
                await conn.commit()
    logger.info(f"Created formula {formula.name} in the database")


@app.get("/jobs")
async def get_jobs() -> list[JobStatus]:
    """
    Retrieve all unarchived jobs from the database.

    :return: A list of JobStatus objects representing all jobs in the database.
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("select_jobs"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute("SELECT id, status, datetime FROM jobs WHERE status != 'arc'")
                jobs = await cur.fetchall()
    logger.info(f"Retrieved {len(jobs)} jobs from the database")
    return list(map(lambda x: JobStatus(**x), jobs))


@app.get("/jobs/status/{job_id}")
async def get_job_status(job_id: int):
    """
    Retrieve the status of a specific job from the database.

    :param job_id: The ID of the job to retrieve.
    :type job_id: int
    :return: A JobStatus object representing the status of the specified job.
    :raises HTTPException: If the job with the given ID is not found (404 status code).
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("select_job_by_id"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute("SELECT (id, status, datetime) FROM jobs WHERE id = %s", (job_id,))
                res = await cur.fetchone()
    if res is None:
        logger.info(f"Job {job_id} was not found in the database")
        raise HTTPException(status_code=404)
    logger.info(f"Job {job_id} retrieved from the database")
    return JobStatus(**res)


@app.post('/jobs/archive/{job_id}')
async def archive_job(job_id: int):
    """
    Archive a specific job in the database.

    :param job_id: The ID of the job to archive.
    :type job_id: int
    :raises HTTPException: If the job with the given ID is not found (404 status code).
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("update_job_by_id"):
        with DBQueryTimer("update"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute("UPDATE jobs SET status = 'arc' WHERE id = %s RETURNING id", (job_id,))
                job_id = await cur.fetchone()
                if job_id is None:
                    logger.info(f"Job {job_id} was not found in the database")
                    raise HTTPException(status_code=404)


@app.post("/parse_pdf")
@require(settings.ai_worker_enabled, "This endpoint requires AI workers to be enabled.")
async def parse_pdf(file: UploadFile) -> JobStatus:
    """
    Parse a PDF file and create a new job for processing.

    :param file: The PDF file to be parsed.
    :type file: UploadFile
    :return: A JobStatus object representing the newly created job.
    :raises HTTPException: If AI workers are not enabled.
    """
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    job_timing = datetime.datetime.now(datetime.UTC)
    with tracer.start_as_current_span("insert_job"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                await cur.execute("INSERT INTO jobs(status, datetime) VALUES ('pnd', %s) RETURNING id", (job_timing,))
                job_id = (await cur.fetchone())["id"]
                await conn.commit()
    with tracer.start_as_current_span("send_rabbitmq_message"):
        connection, channel = rabbit_connection()
        channel.basic_publish(
            exchange="",
            routing_key=settings.ai_pdf_queue,
            properties=pika.BasicProperties(
                correlation_id=str(job_id),
            ),
            body=await file.read(),
        )

    connection.close()
    return JobStatus(id=job_id, status="pnd", datetime=job_timing)


@app.post("/compare")
async def compare(formula: Formula):
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("select_formulas"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                cur.execute("SELECT latex FROM formulas")
                all = [row["latex"] for row in cur.fetchall()]
    result = [
        {"formula": db_formula, "percent": percent(formula.latex, db_formula)}
        for db_formula in all
    ]
    return result


@app.post("/compare_indexes")
async def compare_indexes(formula: Formula):
    logger = get_logger(__name__)
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("select_formulas"):
        with DBQueryTimer("select"):
            async with app.async_pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                cur.execute("SELECT latex FROM formulas")
                all = [row["latex"] for row in cur.fetchall()]
    result = [
        {"formula": db_formula, "indexes": find_indexes(db_formula, formula.latex)}
        for db_formula in all
    ]
    return result
