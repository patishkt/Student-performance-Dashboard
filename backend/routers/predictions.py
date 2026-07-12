from fastapi import APIRouter, HTTPException, Query

from backend.services.prediction_service import predict_cgpa
from backend.utils.responses import api_response

router = APIRouter()


@router.get("/predict")
def predict(
    attendance: float = Query(..., ge=0, le=100),
    internal_marks: float = Query(..., ge=0, le=30),
    assignment_marks: float = Query(..., ge=0, le=70),
):
    try:
        prediction = predict_cgpa(
            attendance=attendance,
            internal_marks=internal_marks,
            assignment_marks=assignment_marks,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return api_response(data=prediction, message="CGPA prediction generated successfully")
