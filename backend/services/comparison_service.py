from backend.services.student_service import get_student_by_roll_number


def subject_marks_map(student: dict) -> dict:
    return {
        subject["subject_name"]: float(subject["total_marks"])
        for subject in student.get("subjects", [])
    }


def compact_student(student: dict) -> dict:
    return {
        "roll_number": student["roll_number"],
        "name": student["name"],
        "class": student["class"],
        "department": student["department"],
        "semester": student["semester"],
        "attendance_percentage": student["attendance_percentage"],
        "overall_cgpa": student["overall_cgpa"],
        "overall_percentage": student["overall_percentage"],
        "grade": student["grade"],
    }


def compare_students(roll1: str, roll2: str) -> dict | None:
    student1 = get_student_by_roll_number(roll1)
    student2 = get_student_by_roll_number(roll2)

    if not student1 or not student2:
        return None

    marks1 = subject_marks_map(student1)
    marks2 = subject_marks_map(student2)
    subject_names = sorted(set(marks1) | set(marks2))

    subject_rows = [
        {
            "subject_name": subject_name,
            "student1_marks": marks1.get(subject_name),
            "student2_marks": marks2.get(subject_name),
        }
        for subject_name in subject_names
    ]

    return {
        "student1": compact_student(student1),
        "student2": compact_student(student2),
        "subjects": subject_rows,
        "summary": {
            "attendance": {
                "student1": student1["attendance_percentage"],
                "student2": student2["attendance_percentage"],
            },
            "cgpa": {
                "student1": student1["overall_cgpa"],
                "student2": student2["overall_cgpa"],
            },
            "overall_percentage": {
                "student1": student1["overall_percentage"],
                "student2": student2["overall_percentage"],
            },
        },
        "radar": {
            "labels": subject_names,
            "datasets": [
                {
                    "label": f"{student1['name']} ({student1['roll_number']})",
                    "data": [marks1.get(subject_name, 0) for subject_name in subject_names],
                },
                {
                    "label": f"{student2['name']} ({student2['roll_number']})",
                    "data": [marks2.get(subject_name, 0) for subject_name in subject_names],
                },
            ],
        },
    }
