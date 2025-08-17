from pymongo import MongoClient

def create():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["pro_dyy"]
    
    collection = db["devices"]
    collection_2 = db["cred"]
    
    return collection, collection_2

def insert_device_data(collection, devices_data):
    
    if isinstance(devices_data, list):
        collection.insert_many(devices_data)  
    elif isinstance(devices_data, dict):
        collection.insert_one(devices_data)  
    else:
        raise TypeError("devices_data must be a dict or a list of dicts")
    
my_collection, my_collection_2 = create()
    


 