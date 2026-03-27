"""
Seed script — populates MongoDB with dummy doctors, patients, slots and bookings.
Run from the backend root:
    python seed.py
Make sure your .env file has MONGO_URI set.
"""

import asyncio
from datetime import datetime, timedelta, time
from bson import ObjectId
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pwdlib import PasswordHash

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "doctor_practice_app_db"

password_hash = PasswordHash.recommended()

def hash_password(plain: str) -> str:
    return password_hash.hash(plain)


# ─── Doctor Data ──────────────────────────────────────────────────────────────

DOCTORS = [
    {
        "name": "Dr. Priya Sharma",
        "email": "priya.sharma@clinic.com",
        "password_hash": hash_password("doctor123"),
        "consultation_fee": 500,
        "work_start_time": "09:00:00",
        "work_end_time": "17:00:00",
        "slot_duration_mins": 30,
        "working_days": [0, 1, 2, 3, 4],  # Mon-Fri
        "years_of_exp": 8,
        "specialization": "general_physician",
        "qualifications": ["MBBS", "MD"],
        "services": ["general_consultation", "follow_up", "blood_pressure_checkup", "diabetes_consultation"],
        "bio": "Dr. Priya Sharma is a highly experienced general physician with over 8 years of practice. She specializes in preventive care and chronic disease management.",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Rahul Mehta",
        "email": "rahul.mehta@clinic.com",
        "password_hash": hash_password("doctor123"),
        "consultation_fee": 800,
        "work_start_time": "10:00:00",
        "work_end_time": "18:00:00",
        "slot_duration_mins": 45,
        "working_days": [0, 1, 3, 4, 5],  # Mon, Tue, Thu, Fri, Sat
        "years_of_exp": 12,
        "specialization": "cardiologist",
        "qualifications": ["MBBS", "MD", "DM"],
        "services": ["general_consultation", "ecg", "blood_pressure_checkup", "follow_up"],
        "bio": "Dr. Rahul Mehta is a renowned cardiologist with 12 years of experience. He has treated over 5000 patients with heart conditions and is known for his patient-first approach.",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Ananya Iyer",
        "email": "ananya.iyer@clinic.com",
        "password_hash": hash_password("doctor123"),
        "consultation_fee": 600,
        "work_start_time": "09:30:00",
        "work_end_time": "16:30:00",
        "slot_duration_mins": 30,
        "working_days": [1, 2, 3, 4, 5],  # Tue-Sat
        "years_of_exp": 6,
        "specialization": "dermatologist",
        "qualifications": ["MBBS", "MD"],
        "services": ["skin_consultation", "general_consultation", "follow_up"],
        "bio": "Dr. Ananya Iyer is a skilled dermatologist with expertise in both medical and cosmetic dermatology. She believes in evidence-based treatments tailored to each patient.",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Vikram Nair",
        "email": "vikram.nair@clinic.com",
        "password_hash": hash_password("doctor123"),
        "consultation_fee": 700,
        "work_start_time": "08:00:00",
        "work_end_time": "14:00:00",
        "slot_duration_mins": 30,
        "working_days": [0, 1, 2, 3, 4],  # Mon-Fri
        "years_of_exp": 15,
        "specialization": "orthopedic",
        "qualifications": ["MBBS", "MS", "DNB"],
        "services": ["general_consultation", "follow_up", "x_ray_consultation", "physiotherapy"],
        "bio": "Dr. Vikram Nair is an orthopedic surgeon with 15 years of experience in joint replacement and sports injuries. He has successfully performed over 2000 surgeries.",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Sneha Kulkarni",
        "email": "sneha.kulkarni@clinic.com",
        "password_hash": hash_password("doctor123"),
        "consultation_fee": 450,
        "work_start_time": "10:00:00",
        "work_end_time": "17:00:00",
        "slot_duration_mins": 20,
        "working_days": [0, 2, 4],  # Mon, Wed, Fri
        "years_of_exp": 4,
        "specialization": "pediatrician",
        "qualifications": ["MBBS", "MD"],
        "services": ["general_consultation", "vaccination", "follow_up"],
        "bio": "Dr. Sneha Kulkarni is a compassionate pediatrician dedicated to the health and wellbeing of children. She has a special interest in child nutrition and developmental health.",
        "created_at": datetime.utcnow(),
    },
]

# ─── Patient Data ─────────────────────────────────────────────────────────────

PATIENTS = [
    {
        "name": "Amit Joshi",
        "email": "amit.joshi@gmail.com",
        "password_hash": hash_password("patient123"),
        "phone": "+91 9876543210",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Neha Gupta",
        "email": "neha.gupta@gmail.com",
        "password_hash": hash_password("patient123"),
        "phone": "+91 9823456789",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Rohan Desai",
        "email": "rohan.desai@gmail.com",
        "password_hash": hash_password("patient123"),
        "phone": "+91 9765432100",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Prachi Patil",
        "email": "prachi.patil@gmail.com",
        "password_hash": hash_password("patient123"),
        "phone": "+91 9988776655",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Siddharth Rao",
        "email": "siddharth.rao@gmail.com",
        "password_hash": hash_password("patient123"),
        "phone": "+91 9112233445",
        "created_at": datetime.utcnow(),
    },
]


# ─── Slot Generator ───────────────────────────────────────────────────────────

def generate_slots_for_doctor(doctor_id: str, doctor: dict, days_ahead: int = 7):
    from datetime import date

    work_start = time.fromisoformat(doctor["work_start_time"])
    work_end = time.fromisoformat(doctor["work_end_time"])
    slot_duration = doctor["slot_duration_mins"]
    working_days = doctor["working_days"]

    today = datetime.utcnow().date()
    slots = []

    for i in range(days_ahead):
        current_date = today + timedelta(days=i)
        if current_date.weekday() not in working_days:
            continue

        slot_start = datetime.combine(current_date, work_start)
        slot_end_of_day = datetime.combine(current_date, work_end)

        while slot_start + timedelta(minutes=slot_duration) <= slot_end_of_day:
            slot_end = slot_start + timedelta(minutes=slot_duration)
            slots.append({
                "doctor_id": doctor_id,
                "start_time": slot_start,
                "end_time": slot_end,
                "is_booked": False,
                "is_locked": False,
                "locked_by": None,
                "locked_until": None,
                "created_at": datetime.utcnow(),
            })
            slot_start = slot_end

    return slots


# ─── Main Seed Function ───────────────────────────────────────────────────────

async def seed():
    print("🌱 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # ── Clear existing data ──
    print("🗑️  Clearing existing data...")
    await db.doctors.delete_many({})
    await db.patients.delete_many({})
    await db.slots.delete_many({})
    await db.bookings.delete_many({})

    # ── Insert doctors ──
    print("👨‍⚕️  Inserting doctors...")
    doctor_result = await db.doctors.insert_many(DOCTORS)
    doctor_ids = [str(oid) for oid in doctor_result.inserted_ids]
    print(f"   ✓ {len(doctor_ids)} doctors inserted")

    # ── Insert patients ──
    print("👤  Inserting patients...")
    patient_result = await db.patients.insert_many(PATIENTS)
    patient_ids = [str(oid) for oid in patient_result.inserted_ids]
    print(f"   ✓ {len(patient_ids)} patients inserted")

    # ── Generate and insert slots ──
    print("🗓️  Generating slots...")
    all_slots = []
    for i, doctor in enumerate(DOCTORS):
        doctor_id = doctor_ids[i]
        slots = generate_slots_for_doctor(doctor_id, doctor, days_ahead=7)
        all_slots.extend(slots)

    slot_result = await db.slots.insert_many(all_slots)
    slot_ids = list(slot_result.inserted_ids)
    print(f"   ✓ {len(slot_ids)} slots generated")

    # ── Group slots by doctor for booking creation ──
    slots_by_doctor = {}
    idx = 0
    for i, doctor in enumerate(DOCTORS):
        doctor_id = doctor_ids[i]
        doctor_slots = generate_slots_for_doctor(doctor_id, doctor, days_ahead=7)
        count = len(doctor_slots)
        slots_by_doctor[doctor_id] = slot_ids[idx:idx + count]
        idx += count

    # ── Create bookings ──
    print("📋  Creating bookings...")
    bookings = []

    # Booking 1 — Amit books Dr. Priya — approved
    d0_slots = slots_by_doctor[doctor_ids[0]]
    if len(d0_slots) >= 2:
        slot_id = d0_slots[0]
        patient = PATIENTS[0]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[0],
            "patient_id": patient_ids[0],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "approved",
            "booked_at": datetime.utcnow() - timedelta(days=2),
        })
        await db.slots.update_one({"_id": slot_id}, {"$set": {"is_booked": True}})

    # Booking 2 — Neha books Dr. Rahul — pending
    d1_slots = slots_by_doctor[doctor_ids[1]]
    if len(d1_slots) >= 2:
        slot_id = d1_slots[0]
        patient = PATIENTS[1]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[1],
            "patient_id": patient_ids[1],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "pending",
            "booked_at": datetime.utcnow() - timedelta(hours=3),
        })
        await db.slots.update_one({"_id": slot_id}, {"$set": {"is_booked": True}})

    # Booking 3 — Rohan books Dr. Ananya — approved
    d2_slots = slots_by_doctor[doctor_ids[2]]
    if len(d2_slots) >= 2:
        slot_id = d2_slots[0]
        patient = PATIENTS[2]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[2],
            "patient_id": patient_ids[2],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "approved",
            "booked_at": datetime.utcnow() - timedelta(days=1),
        })
        await db.slots.update_one({"_id": slot_id}, {"$set": {"is_booked": True}})

    # Booking 4 — Prachi books Dr. Vikram — rejected
    d3_slots = slots_by_doctor[doctor_ids[3]]
    if len(d3_slots) >= 2:
        slot_id = d3_slots[0]
        patient = PATIENTS[3]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[3],
            "patient_id": patient_ids[3],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "rejected",
            "booked_at": datetime.utcnow() - timedelta(days=3),
        })
        # slot stays unbooked since rejected

    # Booking 5 — Siddharth books Dr. Sneha — pending
    d4_slots = slots_by_doctor[doctor_ids[4]]
    if len(d4_slots) >= 2:
        slot_id = d4_slots[0]
        patient = PATIENTS[4]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[4],
            "patient_id": patient_ids[4],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "pending",
            "booked_at": datetime.utcnow() - timedelta(hours=1),
        })
        await db.slots.update_one({"_id": slot_id}, {"$set": {"is_booked": True}})

    # Booking 6 — Amit books Dr. Rahul too — pending
    if len(d1_slots) >= 3:
        slot_id = d1_slots[1]
        patient = PATIENTS[0]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[1],
            "patient_id": patient_ids[0],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "pending",
            "booked_at": datetime.utcnow() - timedelta(minutes=30),
        })
        await db.slots.update_one({"_id": slot_id}, {"$set": {"is_booked": True}})

    # Booking 7 — Neha books Dr. Priya — cancelled
    if len(d0_slots) >= 3:
        slot_id = d0_slots[1]
        patient = PATIENTS[1]
        bookings.append({
            "slot_id": str(slot_id),
            "doctor_id": doctor_ids[0],
            "patient_id": patient_ids[1],
            "patient_name": patient["name"],
            "patient_contact": patient["phone"],
            "status": "cancelled",
            "booked_at": datetime.utcnow() - timedelta(days=4),
        })
        # slot stays unbooked since cancelled

    await db.bookings.insert_many(bookings)
    print(f"   ✓ {len(bookings)} bookings created")

    print("\n✅ Seed complete!")
    print("\n📋 Login credentials:")
    print("\nDoctors (password: doctor123)")
    for d in DOCTORS:
        print(f"   {d['name']:25} — {d['email']}")
    print("\nPatients (password: patient123)")
    for p in PATIENTS:
        print(f"   {p['name']:25} — {p['email']}")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())