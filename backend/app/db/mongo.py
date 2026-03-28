# MongoDB database connection and initialization
from dotenv import load_dotenv
import os 
import asyncio
import pymongo
from pymongo import AsyncMongoClient
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_PATH)

# Get MongoDB connection URI from environment
uri = os.getenv("MONGO_URI")

# Initialize async MongoDB client with server API
client = AsyncMongoClient(uri, server_api=pymongo.server_api.ServerApi(
version="1", strict=True, deprecation_errors=True))

# Access the main database
db = client.doctor_practice_app_db

# Dependency function to get database instance
def get_db():
   return db



