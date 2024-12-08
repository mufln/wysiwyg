#!/usr/bin/env bash

python3 migrate.py $CONNECTION_STRING latest && \
uvicorn app:app --host 0.0.0.0 --port 8000