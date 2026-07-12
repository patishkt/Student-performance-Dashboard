import numpy as np
import pandas as pd

from backend.config import get_settings
from backend.database import get_students_collection
from backend.services.student_service import build_student_filters
from backend.utils.mongo import serialize_document

PASS_MARK = get_settings().pass_mark


def get_filtered_students(
    department: str | None = None,
    semester: int | None = None,
) -> list[dict]:
    filters = build_student_filters(department=department, semester=semester)
    return list(get_students_collection().find(filters))


def empty_class_stats() -> dict:
    return {
        "count": 0,
        "marks": metric_summary([]),
        "cgpa": metric_summary([]),
        "marks_distribution": [],
        "cgpa_distribution": [],
    }


def metric_summary(values: list[float]) -> dict:
    if not values:
        return {
            "highest": 0,
            "lowest": 0,
            "average": 0,
            "median": 0,
            "standard_deviation": 0,
        }

    series = pd.Series(values, dtype="float64")
    return {
        "highest": round(float(series.max()), 2),
        "lowest": round(float(series.min()), 2),
        "average": round(float(series.mean()), 2),
        "median": round(float(series.median()), 2),
        "standard_deviation": round(float(np.std(series, ddof=0)), 2),
    }


def class_stats(department: str | None = None, semester: int | None = None) -> dict:
    students = get_filtered_students(department=department, semester=semester)
    if not students:
        return empty_class_stats()

    marks = [float(student.get("overall_percentage", 0)) for student in students]
    cgpa = [float(student.get("overall_cgpa", 0)) for student in students]

    return {
        "count": len(students),
        "marks": metric_summary(marks),
        "cgpa": metric_summary(cgpa),
        "marks_distribution": marks,
        "cgpa_distribution": cgpa,
    }


def subject_stats(department: str | None = None, semester: int | None = None) -> list[dict]:
    students = get_filtered_students(department=department, semester=semester)
    subject_rows = []

    for student in students:
        for subject in student.get("subjects", []):
            subject_rows.append(
                {
                    "subject_name": subject.get("subject_name"),
                    "total_marks": float(subject.get("total_marks", 0)),
                }
            )

    if not subject_rows:
        return []

    df = pd.DataFrame(subject_rows)
    grouped = df.groupby("subject_name")["total_marks"]
    stats = []

    for subject_name, marks in grouped:
        total_count = int(marks.count())
        pass_count = int((marks >= PASS_MARK).sum())
        stats.append(
            {
                "subject_name": subject_name,
                "average_marks": round(float(marks.mean()), 2),
                "highest_marks": round(float(marks.max()), 2),
                "lowest_marks": round(float(marks.min()), 2),
                "pass_percentage": round((pass_count / total_count) * 100, 2) if total_count else 0,
                "student_count": total_count,
                "pass_mark": PASS_MARK,
            }
        )

    return sorted(stats, key=lambda item: item["subject_name"])


def top_performers(
    limit: int = 5,
    department: str | None = None,
    semester: int | None = None,
) -> list[dict]:
    filters = build_student_filters(department=department, semester=semester)
    cursor = (
        get_students_collection()
        .find(filters)
        .sort([("overall_cgpa", -1), ("overall_percentage", -1), ("roll_number", 1)])
        .limit(limit)
    )
    return [serialize_document(student) for student in cursor]


def attendance_analytics(department: str | None = None, semester: int | None = None) -> dict:
    students = get_filtered_students(department=department, semester=semester)
    if not students:
        return {
            "count": 0,
            "overall_attendance_percentage": 0,
            "monthly_trend": [],
            "attendance_vs_marks": [],
        }

    attendance_values = [float(student.get("attendance_percentage", 0)) for student in students]
    monthly_rows = []
    scatter_pairs = []

    for student in students:
        scatter_pairs.append(
            {
                "roll_number": student.get("roll_number"),
                "name": student.get("name"),
                "attendance_percentage": float(student.get("attendance_percentage", 0)),
                "overall_percentage": float(student.get("overall_percentage", 0)),
                "overall_cgpa": float(student.get("overall_cgpa", 0)),
            }
        )
        for attendance in student.get("attendance", []):
            monthly_rows.append(
                {
                    "month": attendance.get("month"),
                    "percentage": float(attendance.get("percentage", 0)),
                }
            )

    monthly_trend = []
    if monthly_rows:
        df = pd.DataFrame(monthly_rows)
        month_order = list(dict.fromkeys(item["month"] for student in students for item in student.get("attendance", [])))
        grouped = df.groupby("month")["percentage"].mean()
        monthly_trend = [
            {
                "month": month,
                "average_attendance": round(float(grouped[month]), 2),
            }
            for month in month_order
            if month in grouped
        ]

    return {
        "count": len(students),
        "overall_attendance_percentage": round(float(np.mean(attendance_values)), 2),
        "monthly_trend": monthly_trend,
        "attendance_vs_marks": scatter_pairs,
    }


def gender_comparison(department: str | None = None, semester: int | None = None) -> list[dict]:
    students = get_filtered_students(department=department, semester=semester)
    if not students:
        return []

    df = pd.DataFrame(
        [
            {
                "gender": student.get("gender"),
                "overall_percentage": float(student.get("overall_percentage", 0)),
                "attendance_percentage": float(student.get("attendance_percentage", 0)),
            }
            for student in students
        ]
    )

    stats = []
    for gender, group in df.groupby("gender"):
        total_count = int(len(group))
        pass_count = int((group["overall_percentage"] >= PASS_MARK).sum())
        stats.append(
            {
                "gender": gender,
                "average_marks": round(float(group["overall_percentage"].mean()), 2),
                "average_attendance": round(float(group["attendance_percentage"].mean()), 2),
                "pass_percentage": round((pass_count / total_count) * 100, 2) if total_count else 0,
                "student_count": total_count,
                "pass_mark": PASS_MARK,
            }
        )

    return sorted(stats, key=lambda item: item["gender"])


def grade_distribution(department: str | None = None, semester: int | None = None) -> list[dict]:
    students = get_filtered_students(department=department, semester=semester)
    grades = ["A", "B", "C", "D", "F"]
    counts = {grade: 0 for grade in grades}

    for student in students:
        grade = student.get("grade")
        if grade in counts:
            counts[grade] += 1

    return [{"grade": grade, "count": counts[grade]} for grade in grades]


def department_comparison(department: str | None = None, semester: int | None = None) -> list[dict]:
    students = get_filtered_students(department=department, semester=semester)
    if not students:
        return []

    df = pd.DataFrame(
        [
            {
                "department": student.get("department"),
                "overall_cgpa": float(student.get("overall_cgpa", 0)),
            }
            for student in students
        ]
    )

    grouped = df.groupby("department")["overall_cgpa"]
    return [
        {
            "department": department_name,
            "average_cgpa": round(float(cgpa.mean()), 2),
            "student_count": int(cgpa.count()),
        }
        for department_name, cgpa in grouped
    ]


def pass_fail_distribution(department: str | None = None, semester: int | None = None) -> dict:
    students = get_filtered_students(department=department, semester=semester)
    total_count = len(students)
    if total_count == 0:
        return {
            "pass_percentage": 0,
            "fail_percentage": 0,
            "pass_count": 0,
            "fail_count": 0,
            "total_count": 0,
            "pass_mark": PASS_MARK,
        }

    pass_count = sum(1 for student in students if float(student.get("overall_percentage", 0)) >= PASS_MARK)
    fail_count = total_count - pass_count

    return {
        "pass_percentage": round((pass_count / total_count) * 100, 2),
        "fail_percentage": round((fail_count / total_count) * 100, 2),
        "pass_count": pass_count,
        "fail_count": fail_count,
        "total_count": total_count,
        "pass_mark": PASS_MARK,
    }
