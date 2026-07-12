# Deployment

## Docker Compose

Run the full project with MongoDB, FastAPI, and the static frontend:

```bash
docker compose up --build
```

Open:

```text
http://127.0.0.1:8080
```

Backend health check:

```text
http://127.0.0.1:8001/health
```

## Services

- `mongodb`: MongoDB database with persistent Docker volume.
- `backend`: FastAPI app on port `8001`.
- `frontend`: Nginx static frontend on port `8080`.

On first start, the backend can seed data and train the prediction model:

```env
SEED_ON_START=true
TRAIN_MODEL_ON_START=true
```

Set them to `false` after initial setup if you do not want startup reseeding.

## Static Frontend Config

If you deploy the frontend separately, copy:

```text
frontend/js/config.example.js
```

to:

```text
frontend/js/config.js
```

and set:

```js
window.STUDENT_API_BASE = "https://your-backend-domain.example.com";
```

Then include `config.js` before `app.js` on pages you deploy.

## Manual Backend Run

```bash
python seed_data.py
python train_model.py
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
```
