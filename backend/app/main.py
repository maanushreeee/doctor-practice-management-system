from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, doctor, slot, booking, patient, public

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://doctor-practice-management-system-ad30.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(doctor.router)
app.include_router(slot.router)
app.include_router(booking.router)
app.include_router(patient.router)
app.include_router(public.router)