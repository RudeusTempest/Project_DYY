import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# קרא את ה־URI מהסביבה, עם ברירת מחדל ל־mongo:27017
mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017/")

try:
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("MongoDB connection successful")
except ConnectionFailure as e:
    print(f"MongoDB connection failed: {e}")
    raise
except Exception as e:
    print(f"Unexpected error connecting to MongoDB: {e}")
    raise

db = client["projectDYY"]

cred_collection = db["devices_cred"]
info_collection = db["devices_info"]
archive = db["archive"]
groups_collection = db["groups"]