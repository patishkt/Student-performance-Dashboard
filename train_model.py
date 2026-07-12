from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

from backend.database import get_students_collection

MODEL_PATH = Path(__file__).resolve().parent / "backend" / "models" / "cgpa_model.joblib"
FEATURE_NAMES = ["attendance_percentage", "average_internal_marks", "average_assignment_marks"]


def average_subject_field(subjects: list[dict], field_name: str) -> float:
    values = [float(subject.get(field_name, 0)) for subject in subjects]
    return float(np.mean(values)) if values else 0.0


def load_training_frame() -> pd.DataFrame:
    students = list(get_students_collection().find({}))
    rows = []

    for student in students:
        subjects = student.get("subjects", [])
        rows.append(
            {
                "attendance_percentage": float(student.get("attendance_percentage", 0)),
                "average_internal_marks": average_subject_field(subjects, "internal_marks"),
                "average_assignment_marks": average_subject_field(subjects, "external_marks"),
                "overall_cgpa": float(student.get("overall_cgpa", 0)),
            }
        )

    return pd.DataFrame(rows)


def train_model() -> dict:
    df = load_training_frame()
    if len(df) < 10:
        raise RuntimeError("At least 10 student records are required to train the CGPA model.")

    x = df[FEATURE_NAMES]
    y = df["overall_cgpa"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    r2 = float(r2_score(y_test, predictions))

    artifact = {
        "model": model,
        "r2_score": round(r2, 4),
        "feature_names": FEATURE_NAMES,
        "training_rows": int(len(df)),
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)
    return artifact


if __name__ == "__main__":
    saved_artifact = train_model()
    print(
        "Model trained and saved to "
        f"{MODEL_PATH} with R2={saved_artifact['r2_score']} "
        f"using {saved_artifact['training_rows']} records."
    )
