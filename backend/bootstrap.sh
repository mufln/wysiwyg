#!/usr/bin/env bash

python3 migrate.py $POSTGRES_DSN latest && \
uvicorn app:app --host 0.0.0.0 --port 8000