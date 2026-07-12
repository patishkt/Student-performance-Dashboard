from fastapi import APIRouter, HTTPException, Query

from backend.services.student_service import (
    get_student_by_roll_number,
    list_students,
    search_students,
)
from backend.utils.responses import api_response


router = APIRouter()


@router.get("")
def get_students(
    limit: int = Query(default=150, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
    gender: str | None = Query(default=None),
    min_cgpa: float | None = Query(default=None, ge=0, le=10),
    max_cgpa: float | None = Query(default=None, ge=0, le=10),
    min_attendance: float | None = Query(default=None, ge=0, le=100),
    max_attendance: float | None = Query(default=None, ge=0, le=100),
    subject_name: str | None = Query(default=None),
):
    students = list_students(
        limit=limit,
        skip=skip,
        department=department,
        semester=semester,
        gender=gender,
        min_cgpa=min_cgpa,
        max_cgpa=max_cgpa,
        min_attendance=min_attendance,
        max_attendance=max_attendance,
        subject_name=subject_name,
    )
    return api_response(data=students, message="Students fetched successfully")


@router.get("/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(default=20, ge=1, le=100)):
    students = search_students(query=q, limit=limit)
    return api_response(data=students, message="Search results fetched successfully")


@router.get("/{roll_number}")
def get_student(roll_number: str):
    student = get_student_by_roll_number(roll_number)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return api_response(data=student, message="Student fetched successfully")
