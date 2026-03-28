# Authentication service - JWT token and doctor authentication functions
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
import jwt
import os
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from app.db.mongo import get_db

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_PATH)

# to get a string like this run:
# openssl rand -hex 32

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Verify plain password against hashed password
def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

# Hash plain password using recommended algorithm
def get_password_hash(password):
    return password_hash.hash(password)

# Create JWT access token with expiration time
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    print(f"[AuthService] Creating access token for: {data.get('sub')}")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"[AuthService] Access token created successfully for: {data.get('sub')}")
    return encoded_jwt


# Verify JWT token and retrieve current doctor from database
async def get_current_doctor(token: Annotated[str, Depends(oauth2_scheme)], db = Depends(get_db)):
    print(f"[AuthService] Validating doctor token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            print(f"[AuthService] Token validation failed - no email in payload")
            raise credentials_exception
        # token_data = TokenData(username=email)
    except InvalidTokenError:
        print(f"[AuthService] Token validation failed - invalid token")
        raise credentials_exception
    doctors = db.doctors
    doctor = await doctors.find_one({"email": email})
    if doctor is None:
        print(f"[AuthService] Doctor not found for email: {email}")
        raise credentials_exception
    print(f"[AuthService] Doctor token validated successfully for: {email}")
    return doctor
    
# Check if current doctor is active and return doctor details
async def get_current_active_doctor(
    current_user: Annotated[dict, Depends(get_current_doctor)],
):
    return current_user

async def get_current_patient(token: Annotated[str, Depends(oauth2_scheme)], db=Depends(get_db)):
    print(f"[AuthService] Validating patient token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role != "patient":
            print(f"[AuthService] Token validation failed - invalid role or email missing")
            raise credentials_exception
    except InvalidTokenError:
        print(f"[AuthService] Token validation failed - invalid token")
        raise credentials_exception

    patient = await db.patients.find_one({"email": email})
    if patient is None:
        print(f"[AuthService] Patient not found for email: {email}")
        raise credentials_exception
    print(f"[AuthService] Patient token validated successfully for: {email}")
    return patient

async def get_current_active_patient(
    current_patient: Annotated[dict, Depends(get_current_patient)],
):
    return current_patient

