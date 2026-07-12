# Student Academic Performance Visualization & Analytics System

Foundation for a full-stack academic analytics project.

## Stack

- Frontend: plain HTML, CSS, JavaScript
- Backend: Python, FastAPI
- Database: MongoDB with PyMongo
- Charts: Chart.js and Plotly.js via CDN
- Future calculations/reports: Pandas, NumPy, Scikit-learn, ReportLab, OpenPyXL

## Database Approach

This project uses one primary MongoDB collection: `students`.

A separate `departments` collection is intentionally not created. Department-level analytics can be computed directly from indexed `department` fields in the `students` collection using MongoDB aggregation pipelines. This avoids duplicated department membership data, prevents roll-number synchronization issues, and keeps the schema simpler while still supporting fast department-level statistics.

## Setup

1. Create and activate a virtual environment.

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

2. Install dependencies.

   ```bash
   pip install -r requirements.txt
   ```

3. Copy the environment template.

   ```bash
   copy backend\.env.example backend\.env
   ```

4. Update `backend/.env` if needed.

   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=student_performance
   ```

5. Start MongoDB locally or point `MONGODB_URI` to MongoDB Atlas.

6. Seed fake data.

   ```bash
   python backend/seed_data.py
   ```

7. Start the backend.

   ```bash
   uvicorn backend.main:app --reload
   ```

8. Open the frontend.

   Open `frontend/index.html` in a browser. The API health check is available at:

   ```text
   http://127.0.0.1:8000/health
   ```

## API Response Shape

All API endpoints return:

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable status"
}
```

## Current Endpoints

- `GET /health`
- `GET /api/students`
- `GET /api/students/{roll_number}`
- Scaffolded routers:
  - `/api/analytics`
  - `/api/comparisons`
  - `/api/reports`

## Deployment

Docker deployment files are included. See `DEPLOYMENT.md`.

```bash
docker compose up --build
```

Frontend:

```text
http://127.0.0.1:8080
```
