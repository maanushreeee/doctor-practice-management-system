from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class PatientRecordCreate(BaseModel):
    booking_id: str
    chief_complaint: str
    symptoms: Optional[str] = None
    diagnosis: str
    prescription: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None


class PatientRecordUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None


class PatientRecordResponse(BaseModel):
    id: str
    booking_id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    visit_date: datetime
    chief_complaint: str
    symptoms: Optional[str] = None
    diagnosis: str
    prescription: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
