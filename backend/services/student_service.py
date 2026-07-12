import re

from backend.database import get_students_collection
from backend.utils.mongo import serialize_document


def build_student_filters(
    department: str | None = None,
    semester: int | None = None,
    gender: str | None = None,
    min_cgpa: float | None = None,
    max_cgpa: float | None = None,
    min_attendance: float | None = None,
    max_attendance: float | None = None,
    subject_name: str | None = None,
) -> dict:
    filters = {}

    if department:
        filters["department"] = department
    if semester is not None:
        filters["semester"] = semester
    if gender:
        filters["gender"] = gender
    if min_cgpa is not None or max_cgpa is not None:
        filters["overall_cgpa"] = {}
        if min_cgpa is not None:
            filters["overall_cgpa"]["$gte"] = min_cgpa
        if max_cgpa is not None:
            filters["overall_cgpa"]["$lte"] = max_cgpa
    if min_attendance is not None or max_attendance is not None:
        filters["attendance_percentage"] = {}
        if min_attendance is not None:
            filters["attendance_percentage"]["$gte"] = min_attendance
        if max_attendance is not None:
            filters["attendance_percentage"]["$lte"] = max_attendance
    if subject_name:
        filters["subjects"] = {
            "$elemMatch": {
                "subject_name": {
                    "$regex": f"^{re.escape(subject_name)}$",
                    "$options": "i",
                }
            }
        }

    return filters


def list_students(
    limit: int = 150,
    skip: int = 0,
    department: str | None = None,
    semester: int | None = None,
    gender: str | None = None,
    min_cgpa: float | None = None,
    max_cgpa: float | None = None,
    min_attendance: float | None = None,
    max_attendance: float | None = None,
    subject_name: str | None = None,
) -> list[dict]:
    filters = build_student_filters(
        department=department,
        semester=semester,
        gender=gender,
        min_cgpa=min_cgpa,
        max_cgpa=max_cgpa,
        min_attendance=min_attendance,
        max_attendance=max_attendance,
        subject_name=subject_name,
    )
    cursor = (
        get_students_collection()
        .find(filters)
        .sort("roll_number", 1)
        .skip(skip)
        .limit(limit)
    )
    return [serialize_document(student) for student in cursor]


def get_student_by_roll_number(roll_number: str) -> dict | None:
    student = get_students_collection().find_one({"roll_number": roll_number})
    return serialize_document(student) if student else None


def search_students(query: str, limit: int = 20) -> list[dict]:
    normalized_query = query.strip()
    if not normalized_query:
        return []

    escaped_query = re.escape(normalized_query)
    filters = {
        "$or": [
            {"roll_number": normalized_query},
            {"name": {"$regex": escaped_query, "$options": "i"}},
        ]
    }
    cursor = get_students_collection().find(filters).sort("roll_number", 1).limit(limit)
    return [serialize_document(student) for student in cursor]
