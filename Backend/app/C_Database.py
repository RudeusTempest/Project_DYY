from pymongo import MongoClient


# Create DataBase & Collections

# Connect to MongoDB running on localhost (default port 27017)
client = MongoClient("mongodb://localhost:27017/")

# Create database 
db = client["projectDYY"]  

# Create collections
info_collection = db["devices_info"]
cred_collection = db["devices_cred"]
archive = db["archive"]



def save_info(mac_address, hostname, interface_data, last_updated, raw_date):
    # appendig details to a dict
    latest_device_data = {"mac": mac_address, "hostname": hostname, "interface": interface_data, "last updated at": last_updated, "raw date": raw_date}

    # Search if device in info_collection
    device_in_info_collection = info_collection.find_one({"mac": mac_address}, {"_id": 0})

    if device_in_info_collection:
        device = device_in_info_collection

        # Delete device info from info_collection
        info_collection.delete_one(device)

    # insert device info to archive
    archive.insert_one(device)

    # Insert the latest device data into the MongoDB info collection
    info_collection.insert_one(latest_device_data)


# Reusing database & collection
def get_database():
    return info_collection, cred_collection, archive
