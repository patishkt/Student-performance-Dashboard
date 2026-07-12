from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import create_indexes, ping_database
from backend.routers import analytics, comparisons, predictions, reports, students
from backend.utils.responses import api_response


app = FastAPI(
    title="Student Academic Performance Visualization & Analytics System",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and {"success", "data", "message"} <= set(exc.detail):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=api_response(success=False, data=None, message=str(exc.detail)),
    )


@app.on_event("startup")
def startup_event() -> None:
    create_indexes()


@app.get("/")
def root():
    return api_response(
        data={"service": "Student Academic Performance Visualization & Analytics API"},
        message="API is running",
    )


@app.get("/health")
def health_check():
    ping_database()
    return api_response(data={"database": "connected"}, message="Server is healthy")


app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(comparisons.router, prefix="/api/comparisons", tags=["comparisons"])
app.include_router(predictions.router, prefix="/api", tags=["predictions"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
