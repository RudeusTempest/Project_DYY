from pymongo import MongoClient


def create_database():
    # Connect to MongoDB running on localhost (default port 27017)
    client = MongoClient("mongodb://localhost:27017/")

    # Create database 
    db = client["projectDYY"]  

    # Create collection
    collection = db["devices_info"]
    collection2 = db["devices_cred"]
    return collection, collection2


def save_info(collection, mac_address, hostname, interface_data, last_updated):
    # appendig details to a dict
    devices_data = {"Mac": mac_address, "hostname": hostname, "interface": interface_data, "last updated at": last_updated}

    # Insert the data into the MongoDB collection
    collection.insert_one(devices_data)


# Creating database & collection
collection, collection2 = create_database()

