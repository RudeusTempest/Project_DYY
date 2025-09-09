from pymongo import MongoClient

# Connect to MongoDB running on localhost (default port 27017)
client = MongoClient("mongodb://localhost:27017/")

# Create database 
db = client["projectDYY"]  