"""Root entrypoint for seeding fake student records.

The implementation lives in backend/seed_data.py so it can reuse the same
database configuration as the FastAPI app.
"""

from backend.seed_data import seed_students


if __name__ == "__main__":
    seed_students()
