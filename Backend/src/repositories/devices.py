from src.config.database import db


# Create collections
info_collection = db["devices_info"]
archive = db["archive"]


class DevicesRepo:

    @staticmethod
    def save_info(mac_address: str, hostname: str, interface_data: list, last_updated: str, raw_date, info_neighbors: list = None):
        """
        Save device information to database
        
        Args:
            mac_address: Device MAC address
            hostname: Device hostname
            interface_data: List of interface information (includes bandwidth data per interface)
            last_updated: Formatted timestamp string
            raw_date: Raw datetime object
            info_neighbors: Optional list of neighbor devices
        """
        # Bundle all details into a dict
        latest_device_data = {
            "mac": mac_address,
            "hostname": hostname, 
            "interface": interface_data,
            "info_neighbors": info_neighbors if info_neighbors else [], 
            "last updated at": last_updated, 
            "raw date": raw_date
        }

        # Search if device already exists in info_collection
        device_in_info_collection = info_collection.find_one({"mac": mac_address}, {"_id": 0})

        if device_in_info_collection:
            record = device_in_info_collection

            # Move old record to archive
            archive.insert_one(record)
            info_collection.delete_one({"mac": mac_address})

        # Insert the latest device data into MongoDB
        info_collection.insert_one(latest_device_data)


    @staticmethod
    def get_all_records():
        """
        Retrieve all device records from the database
        Returns a list of all devices with their latest information
        """
        return list(info_collection.find({}, {"_id": 0}))
    

    @staticmethod
    def get_one_record(ip: str):
        """
        Retrieve a single device record by IP address
        
        Args:
            ip: IP address to search for
            
        Returns:
            List containing device record(s) matching the IP
        """
        return list(info_collection.find({"ip": ip}, {"_id": 0}))
    
    @staticmethod
    def update_bandwidth_only(device_ip: str, bandwidth_data: dict):
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