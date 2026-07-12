from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "cgpa_model.joblib"


def load_model_artifact() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Prediction model not found. Run train_model.py first.")
    return joblib.load(MODEL_PATH)


def predict_cgpa(
    attendance: float,
    internal_marks: float,
    assignment_marks: float,
) -> dict:
    artifact = load_model_artifact()
    model = artifact["model"]
    feature_names = artifact["feature_names"]
    features = pd.DataFrame(
        [
            {
                "attendance_percentage": attendance,
                "average_internal_marks": internal_marks,
                "average_assignment_marks": assignment_marks,
            }
        ],
        columns=feature_names,
    )

    raw_prediction = float(model.predict(features)[0])
    predicted_cgpa = round(max(0.0, min(10.0, raw_prediction)), 2)

    return {
        "predicted_cgpa": predicted_cgpa,
        "raw_predicted_cgpa": round(raw_prediction, 4),
        "r2_score": artifact["r2_score"],
        "training_rows": artifact.get("training_rows"),
        "inputs": {
            "attendance": attendance,
            "internal_marks": internal_marks,
            "assignment_marks": assignment_marks,
        },
    }
