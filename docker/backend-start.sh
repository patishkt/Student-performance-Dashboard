#!/bin/sh
set -e

python - <<'PY'
import os
import time
from pymongo import MongoClient

uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(uri, serverSelectionTimeoutMS=2000)

for attempt in range(30):
    try:
        client.admin.command("ping")
        print("MongoDB is ready.")
        break
    except Exception as exc:
        if attempt == 29:
            raise
        print(f"Waiting for MongoDB: {exc}")
        time.sleep(2)
PY

if [ "${SEED_ON_START:-false}" = "true" ]; then
  python seed_data.py
fi

if [ "${TRAIN_MODEL_ON_START:-false}" = "true" ]; then
  python train_model.py
fi

exec python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
