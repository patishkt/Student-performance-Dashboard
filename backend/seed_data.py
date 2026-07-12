from datetime import datetime, timezone
from pathlib import Path
import random
import sys

import numpy as np

sys.path.append(str(Path(__file__).resolve().parents[1]))

from backend.database import create_indexes, get_students_collection  # noqa: E402


DEPARTMENTS = {
    "AI": ["Machine Learning", "Python", "Statistics", "Data Mining", "AI Ethics"],
    "CSE": ["Data Structures", "Operating Systems", "DBMS", "Computer Networks", "Java"],
    "IT": ["Web Technology", "Cloud Computing", "Cyber Security", "Software Engineering", "Linux"],
    "ECE": ["Digital Electronics", "Signals", "VLSI", "Microprocessors", "Communication Systems"],
}

FIRST_NAMES = {
    "Male": ["Aarav", "Vivaan", "Aditya", "Ishaan", "Arjun", "Sai", "Rohan", "Kiran", "Rahul", "Sanjay", "Varun", "Manav"],
    "Female": ["Ananya", "Diya", "Isha", "Meera", "Nisha", "Priya", "Riya", "Sneha", "Kavya", "Neha", "Pooja", "Aditi"],
}
LAST_NAMES = [
    "Sharma", "Patel", "Kumar", "Reddy", "Nair", "Gupta", "Mehta", "Joshi",
    "Verma", "Iyer", "Das", "Rao", "Singh", "Chopra", "Mishra", "Bose",
]
MONTHS = ["January", "February", "March", "April", "May", "June"]


def clamp(value: float, minimum: float, maximum: float) -> float:
    return round(max(minimum, min(maximum, value)), 2)


def grade_from_percentage(percentage: float) -> str:
    if percentage >= 85:
        return "A"
    if percentage >= 70:
        return "B"
    if percentage >= 55:
        return "C"
    if percentage >= 40:
        return "D"
    return "F"


def generate_subjects(department: str, ability: float) -> list[dict]:
    subjects = []
    for subject_name in DEPARTMENTS[department]:
        internal = clamp(np.random.normal(ability * 0.3, 3), 5, 30)
        external = clamp(np.random.normal(ability * 0.7, 8), 15, 70)
        total = clamp(internal + external, 0, 100)
        subjects.append(
            {
                "subject_name": subject_name,
                "internal_marks": internal,
                "external_marks": external,
                "total_marks": total,
            }
        )
    return subjects


def generate_student(index: int, department: str, semester: int) -> dict:
    gender = "Female" if index % 2 == 0 else "Male"
    class_name = f"{department}-{semester}"
    ability = clamp(np.random.normal(72, 13), 35, 96)

    subjects = generate_subjects(department, ability)
    overall_percentage = round(sum(item["total_marks"] for item in subjects) / len(subjects), 2)
    overall_cgpa = clamp(overall_percentage / 10, 0, 10)

    attendance = [
        {"month": month, "percentage": clamp(np.random.normal(78 + (ability - 70) * 0.2, 9), 45, 100)}
        for month in MONTHS
    ]
    attendance_percentage = round(sum(item["percentage"] for item in attendance) / len(attendance), 2)

    cgpa_by_semester = [
        {
            "semester": sem,
            "cgpa": clamp(overall_cgpa + np.random.normal(0, 0.45), 3.5, 10),
        }
        for sem in range(1, semester + 1)
    ]

    now = datetime.now(timezone.utc)
    roll_number = f"{department}{semester}2026{index:03d}"
    name = f"{random.choice(FIRST_NAMES[gender])} {random.choice(LAST_NAMES)}"

    return {
        "roll_number": roll_number,
        "name": name,
        "class": class_name,
        "department": department,
        "semester": semester,
        "gender": gender,
        "subjects": subjects,
        "attendance": attendance,
        "attendance_percentage": attendance_percentage,
        "cgpa_by_semester": cgpa_by_semester,
        "overall_percentage": overall_percentage,
        "overall_cgpa": overall_cgpa,
        "grade": grade_from_percentage(overall_percentage),
        "created_at": now,
        "updated_at": now,
    }


def seed_students(total: int = 150) -> None:
    random.seed(42)
    np.random.seed(42)

    collection = get_students_collection()
    create_indexes()

    combinations = [
        (department, semester)
        for department in DEPARTMENTS
        for semester in range(1, 5)
    ]
    records = [
        generate_student(
            index=index,
            department=combinations[(index - 1) % len(combinations)][0],
            semester=combinations[(index - 1) % len(combinations)][1],
        )
        for index in range(1, total + 1)
    ]
    collection.delete_many({})
    collection.insert_many(records)
    print(f"Seeded {total} students into MongoDB.")


if __name__ == "__main__":
    seed_students()
