from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from pymongo import MongoClient
import os


# Read Mongo URL from env; default to localhost so devs running outside Docker don't need extra config
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")

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
 