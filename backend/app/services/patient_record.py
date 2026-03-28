from datetime import date, datetime, time

from bson import ObjectId
from fastapi import HTTPException

from app.models.patient_record import (
    PatientRecordCreate,
    PatientRecordResponse,
    PatientRecordUpdate,
)


def _parse_object_id(value: str, field_name: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return ObjectId(value)


def _to_patient_record_response(record: dict) -> PatientRecordResponse:
    return PatientRecordResponse(
        id=str(record["_id"]),
        booking_id=record["booking_id"],
        patient_id=record["patient_id"],
        patient_name=record["patient_name"],
        doctor_id=record["doctor_id"],
        doctor_name=record["doctor_name"],
        visit_date=record["visit_date"],
        chief_complaint=record["chief_complaint"],
        symptoms=record.get("symptoms"),
        diagnosis=record["diagnosis"],
        prescription=record.get("prescription"),
        notes=record.get("notes"),
        follow_up_date=record.get("follow_up_date"),
        created_at=record["created_at"],
        updated_at=record["updated_at"],
    )


def _normalize_follow_up_date(value):
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, time.min)
    return value


async def create_patient_record(db, record_data: PatientRecordCreate, current_doctor: dict):
    doctor_id = str(current_doctor["_id"])
    booking = await db.bookings.find_one({"_id": _parse_object_id(record_data.booking_id, "booking_id")})

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["doctor_id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized to create a record for this booking")
    if booking["status"] != "approved":
        raise HTTPException(status_code=400, detail="Records can only be created for approved bookings")

    existing_record = await db.patient_records.find_one({"booking_id": str(booking["_id"])})
    if existing_record:
        raise HTTPException(status_code=400, detail="A patient record already exists for this booking")

    slot = await db.slots.find_one({"_id": _parse_object_id(booking["slot_id"], "slot_id")})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    now = datetime.utcnow()
    record_doc = {
        "booking_id": str(booking["_id"]),
        "patient_id": booking["patient_id"],
        "patient_name": booking["patient_name"],
        "doctor_id": doctor_id,
        "doctor_name": current_doctor["name"],
        "visit_date": slot["start_time"],
        "chief_complaint": record_data.chief_complaint,
        "symptoms": record_data.symptoms,
        "diagnosis": record_data.diagnosis,
        "prescription": record_data.prescription,
        "notes": record_data.notes,
        "follow_up_date": _normalize_follow_up_date(record_data.follow_up_date),
        "created_at": now,
        "updated_at": now,
    }

    result = await db.patient_records.insert_one(record_doc)
    record_doc["_id"] = result.inserted_id
    return _to_patient_record_response(record_doc)


async def update_patient_record(db, record_id: str, update_data: PatientRecordUpdate, current_doctor: dict):
    doctor_id = str(current_doctor["_id"])
    record = await db.patient_records.find_one({"_id": _parse_object_id(record_id, "record_id")})

    if not record:
        raise HTTPException(status_code=404, detail="Patient record not found")
    if record["doctor_id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this patient record")

    updates = {}
    for field in ("chief_complaint", "symptoms", "diagnosis", "prescription", "notes", "follow_up_date"):
        value = getattr(update_data, field)
        if value is not None:
            updates[field] = _normalize_follow_up_date(value) if field == "follow_up_date" else value

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.utcnow()

    await db.patient_records.update_one(
        {"_id": record["_id"]},
        {"$set": updates},
    )

    updated_record = await db.patient_records.find_one({"_id": record["_id"]})
    return _to_patient_record_response(updated_record)


async def get_doctor_patient_record(db, record_id: str, current_doctor: dict):
    doctor_id = str(current_doctor["_id"])
    record = await db.patient_records.find_one({"_id": _parse_object_id(record_id, "record_id")})

    if not record:
        raise HTTPException(status_code=404, detail="Patient record not found")
    if record["doctor_id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient record")

    return _to_patient_record_response(record)


async def list_doctor_patient_records(db, patient_id: str, current_doctor: dict):
    doctor_id = str(current_doctor["_id"])
    cursor = db.patient_records.find(
        {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
        }
    ).sort("visit_date", -1)

    records = []
    async for record in cursor:
        records.append(_to_patient_record_response(record))
    return records


async def get_patient_record(db, record_id: str, current_patient: dict):
    patient_id = str(current_patient["_id"])
    record = await db.patient_records.find_one({"_id": _parse_object_id(record_id, "record_id")})

    if not record:
        raise HTTPException(status_code=404, detail="Patient record not found")
    if record["patient_id"] != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient record")

    return _to_patient_record_response(record)


async def list_patient_records(db, current_patient: dict):
    patient_id = str(current_patient["_id"])
    cursor = db.patient_records.find({"patient_id": patient_id}).sort("visit_date", -1)

    records = []
    async for record in cursor:
        records.append(_to_patient_record_response(record))
    return records
