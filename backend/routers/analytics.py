from fastapi import APIRouter
from fastapi import Query

from backend.services.analytics_service import (
    attendance_analytics,
    class_stats,
    department_comparison,
    gender_comparison,
    grade_distribution,
    pass_fail_distribution,
    subject_stats,
    top_performers,
)
from backend.utils.responses import api_response


router = APIRouter()


@router.get("")
def analytics_placeholder():
    return api_response(data={}, message="Analytics endpoints coming soon")


@router.get("/class-stats")
def get_class_stats(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=class_stats(department=department, semester=semester),
        message="Class statistics fetched successfully",
    )


@router.get("/subject-stats")
def get_subject_stats(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=subject_stats(department=department, semester=semester),
        message="Subject statistics fetched successfully",
    )


@router.get("/top-performers")
def get_top_performers(
    limit: int = Query(default=5, ge=1, le=50),
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=top_performers(limit=limit, department=department, semester=semester),
        message="Top performers fetched successfully",
    )


@router.get("/attendance")
def get_attendance_analytics(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=attendance_analytics(department=department, semester=semester),
        message="Attendance analytics fetched successfully",
    )


@router.get("/gender-comparison")
def get_gender_comparison(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=gender_comparison(department=department, semester=semester),
        message="Gender comparison fetched successfully",
    )


@router.get("/grade-distribution")
def get_grade_distribution(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=grade_distribution(department=department, semester=semester),
        message="Grade distribution fetched successfully",
    )


@router.get("/department-comparison")
def get_department_comparison(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=department_comparison(department=department, semester=semester),
        message="Department comparison fetched successfully",
    )


@router.get("/pass-fail")
def get_pass_fail_distribution(
    department: str | None = Query(default=None),
    semester: int | None = Query(default=None, ge=1, le=8),
):
    return api_response(
        data=pass_fail_distribution(department=department, semester=semester),
        message="Pass/fail distribution fetched successfully",
    )
