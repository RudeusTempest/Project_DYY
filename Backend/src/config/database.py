from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Connect to MongoDB running on localhost (default port 27017)
try:
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    print("MongoDB connection successful")
except ConnectionFailure as e:
    print(f"MongoDB connection failed: {e}")
    raise
except Exception as e:
    print(f"Unexpected error connecting to MongoDB: {e}")
    raise

# Create database 
db = client["projectDYY"]