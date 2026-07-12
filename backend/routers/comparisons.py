from fastapi import APIRouter, HTTPException, Query

from backend.services.comparison_service import compare_students
from backend.utils.responses import api_response


router = APIRouter()


@router.get("")
def compare_students_endpoint(
    roll1: str = Query(..., min_length=1),
    roll2: str = Query(..., min_length=1),
):
    comparison = compare_students(roll1=roll1, roll2=roll2)
    if not comparison:
        raise HTTPException(status_code=404, detail="One or both students were not found")
    return api_response(data=comparison, message="Student comparison fetched successfully")
