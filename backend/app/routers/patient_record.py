from typing import List

from fastapi import APIRouter, Depends, status

from app.db.mongo import get_db
from app.models.patient_record import (
    PatientRecordCreate,
    PatientRecordResponse,
    PatientRecordUpdate,
)
from app.services.auth import get_current_active_doctor, get_current_active_patient
from app.services.patient_record import (
    create_patient_record,
    get_doctor_patient_record,
    get_patient_record,
    list_doctor_patient_records,
    list_patient_records,
    update_patient_record,
)

router = APIRouter(tags=["Patient Records"])


@router.post("/doctor/records", response_model=PatientRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor_patient_record(
    record_data: PatientRecordCreate,
    db=Depends(get_db),
    current_doctor=Depends(get_current_active_doctor),
):
    return await create_patient_record(db, record_data, current_doctor)


@router.put("/doctor/records/{record_id}", response_model=PatientRecordResponse)
async def update_doctor_patient_record(
    record_id: str,
    update_data: PatientRecordUpdate,
    db=Depends(get_db),
    current_doctor=Depends(get_current_active_doctor),
):
    return await update_patient_record(db, record_id, update_data, current_doctor)


@router.get("/doctor/records/{record_id}", response_model=PatientRecordResponse)
async def get_doctor_record(
    record_id: str,
    db=Depends(get_db),
    current_doctor=Depends(get_current_active_doctor),
):
    return await get_doctor_patient_record(db, record_id, current_doctor)


@router.get("/doctor/patients/{patient_id}/records", response_model=List[PatientRecordResponse])
async def get_doctor_patient_records(
    patient_id: str,
    db=Depends(get_db),
    current_doctor=Depends(get_current_active_doctor),
):
    return await list_doctor_patient_records(db, patient_id, current_doctor)


@router.get("/patient/records", response_model=List[PatientRecordResponse])
async def get_current_patient_records(
    db=Depends(get_db),
    current_patient=Depends(get_current_active_patient),
):
    return await list_patient_records(db, current_patient)


@router.get("/patient/records/{record_id}", response_model=PatientRecordResponse)
async def get_current_patient_record(
    record_id: str,
    db=Depends(get_db),
    current_patient=Depends(get_current_active_patient),
):
    return await get_patient_record(db, record_id, current_patient)
