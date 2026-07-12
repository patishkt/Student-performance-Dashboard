from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.services.report_service import generate_student_excel, generate_student_pdf, get_student_or_none
from backend.utils.responses import api_response


router = APIRouter()


@router.get("")
def reports_placeholder():
    return api_response(data={}, message="Report endpoints coming soon")


@router.get("/{roll_number}/pdf")
def download_student_pdf(roll_number: str):
    student = get_student_or_none(roll_number)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    pdf_buffer = generate_student_pdf(student)
    filename = f"{roll_number}_report.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{roll_number}/excel")
def download_student_excel(roll_number: str):
    student = get_student_or_none(roll_number)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    excel_buffer = generate_student_excel(student)
    filename = f"{roll_number}_report.xlsx"
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
