from src.config.database import db


# Create collections
info_collection = db["devices_info"]
archive = db["archive"]


class DevicesRepo:

    @staticmethod
    def save_info(mac_address: str, hostname: str, interface_data: list, last_updated: str, raw_date, info_neighbors: list = None):
        # appendig details to a dict
        if info_neighbors:
            latest_device_data = {
                "mac": mac_address,
                "hostname": hostname, 
                "interface": interface_data,
                "info_neighbors": info_neighbors, 
                "last updated at": last_updated, 
                "raw date": raw_date
                }
        else:
            latest_device_data = {
                "mac": mac_address,
                "hostname": hostname, 
                "interface": interface_data,
                "last updated at": last_updated, 
                "raw date": raw_date
                }    

        # Search if device in info_collection
        device_in_info_collection = info_collection.find_one({"mac": mac_address}, {"_id": 0})

        if device_in_info_collection:
            record = device_in_info_collection

            # Move old record to archive
            archive.insert_one(record)
            info_collection.delete_one({"mac": mac_address})

        # Insert the latest device data into the MongoDB info collection
        info_collection.insert_one(latest_device_data)


    @staticmethod
    def get_all_records():
        return list(info_collection.find({}, {"_id": 0}))
    

    @staticmethod
    def get_one_record(ip: str):
        return list(info_collection.find({"ip": ip}, {"_id": 0}))

