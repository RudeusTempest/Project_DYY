from src.config.database import db
from src.repositories.credentials import CredentialsRepo


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
    

    @staticmethod
    def get_interface_data():
        return list(info_collection.find({}, {"interface": 1, "_id": 0}))
    

    @staticmethod
    def update_mbps(ip : str, mbps_received: float, mbps_sent: float):
        # Save this back to MongoDB:
        info_collection.update_one(
            {"interface.ip_address": ip},
            {"$set": {
                "interface.$.mbps_received": mbps_received,
                "interface.$.mbps_sent": mbps_sent
            }}
        )




#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

    @staticmethod
    def update_bandwidth_cli(device_ip: str, bandwidth_data: dict):
        """
        Update bandwidth information for all interfaces of a specific device.
        Only updates the bandwidth field, does not modify IP, hostname, MAC, etc.
        
        Args:
            device_ip: The IP address of the device to update
            bandwidth_data: Dictionary with interface names as keys and bandwidth metrics as values
            
        Returns:
            The updated device document, or None if device not found or error occurs
        """
        try:
            # Find the device by searching for a matching interface IP address
            device = info_collection.find_one(
                {"interface": {"$elemMatch": {"ip_address": device_ip}}}
            )
            
            # If device doesn't exist, log and return None
            if not device:
                print(f"Device with IP {device_ip} not found in database")
                return None
            
            # Iterate through all interfaces in the device
            for interface in device["interface"]:
                # Extract the interface name (e.g., "Ethernet0/0")
                interface_name = interface["interface"]
                
                # Check if we have bandwidth data for this specific interface
                if interface_name in bandwidth_data:
                    # Update the bandwidth field with new metrics
                    interface["bandwidth"] = bandwidth_data[interface_name]
            
            # Save the updated device document back to the database
            # Use the MAC address as the unique identifier
            info_collection.update_one(
                {"mac": device["mac"]},
                {"$set": device}
            )
            
            print(f"Successfully updated bandwidth data for device {device_ip}")
            return device
        
        except Exception as error:
            print(f"Error updating bandwidth for {device_ip}: {error}")
            return None