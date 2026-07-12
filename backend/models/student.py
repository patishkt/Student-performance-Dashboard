from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Grade = Literal["A", "B", "C", "D", "F"]
Gender = Literal["Male", "Female"]


class SubjectMarks(BaseModel):
    subject_name: str
    internal_marks: float = Field(ge=0, le=30)
    external_marks: float = Field(ge=0, le=70)
    total_marks: float = Field(ge=0, le=100)


class AttendanceRecord(BaseModel):
    month: str
    percentage: float = Field(ge=0, le=100)


class SemesterCgpa(BaseModel):
    semester: int = Field(ge=1, le=8)
    cgpa: float = Field(ge=0, le=10)


class Student(BaseModel):
    roll_number: str
    name: str
    class_name: str = Field(alias="class")
    department: Literal["AI", "CSE", "IT", "ECE"]
    semester: int = Field(ge=1, le=8)
    gender: Gender
    subjects: list[SubjectMarks]
    attendance: list[AttendanceRecord]
    attendance_percentage: float = Field(ge=0, le=100)
    cgpa_by_semester: list[SemesterCgpa]
    overall_percentage: float = Field(ge=0, le=100)
    overall_cgpa: float = Field(ge=0, le=10)
    grade: Grade
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
