from backend.utils.mongo import serialize_document


def serialize_student(student: dict) -> dict:
    return serialize_document(student)
