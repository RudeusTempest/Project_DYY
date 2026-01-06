from src.config.mongo import info_collection, archive
from typing import Optional, List, Dict, Any


class DevicesRepo:

    @staticmethod
    async def save_interfaces(device_id: int, interface_data: list, last_updated: str, raw_date: Any) -> None:
        """Save interface-level data in Mongo and link it to the Postgres device id.
        This avoids duplicating mac/hostname/device_type/status in Mongo.
        """
        try:
            latest_device_data = {
                "device_id": device_id,
                "interface": interface_data,
                "last updated at": last_updated,
                "raw date": raw_date
            }

            # Upsert by device_id so we keep interfaces current and archive the old doc
            existing = info_collection.find_one({"device_id": device_id}, {"_id": 0})
            if existing:
                archive.insert_one(existing)
                info_collection.delete_one({"device_id": device_id})

            info_collection.insert_one(latest_device_data)
        except Exception as e:
            print(f"Error saving interfaces for device_id {device_id}: {e}")
            raise



    @staticmethod
    async def get_all_records() -> List[Dict[str, Any]]:
        try:
            return list(info_collection.find({}, {"_id": 0}))
        except Exception as e:
            print(f"Error getting all records: {e}")
            return []
    

    @staticmethod
    async def get_interfaces_by_device_id(device_id: int) -> Optional[Dict[str, Any]]:
        try:
            return info_collection.find_one({"device_id": device_id}, {"_id": 0})
        except Exception as e:
            print(f"Error getting interfaces for device_id {device_id}: {e}")
            return None


    @staticmethod
    async def find_by_interface_ip(ip: str) -> List[Dict[str, Any]]:
        try:
            return list(info_collection.find({"interface.ip_address": ip}, {"_id": 0}))
        except Exception as e:
            print(f"Error finding device by interface IP {ip}: {e}")
            return []


    @staticmethod
    async def get_interface_data() -> List[Dict[str, Any]]:
        try:
            # Return list of objects with device_id and interface list
            docs = list(info_collection.find({}, {"device_id": 1, "interface": 1, "_id": 0}))
            return docs
        except Exception as e:
            print(f"Error getting interface data: {e}")
            return []
    

    @staticmethod
    async def update_mbps(ip: str, mbps_received: float, mbps_sent: float) -> None:
        try:
            # Update Mbps values for the matching interface in Mongo
            info_collection.update_one(
                {"interface.ip_address": ip},
                {"$set": {
                    "interface.$.mbps_received": mbps_received,
                    "interface.$.mbps_sent": mbps_sent
                }}
            )
        except Exception as e:
            print(f"Error updating Mbps for IP {ip}: {e}")


    @staticmethod
    async def flag_device_inactive(mac_address: str) -> None:
        # Intentionally a no-op: status/active flags are authoritative in Postgres
        return


#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

    @staticmethod
    async def update_bandwidth_cli(device_ip: str, bandwidth_data: dict) -> Optional[Dict[str, Any]]:
        """
        Update bandwidth information for all interfaces of a specific device (stored in Mongo).
        Returns updated doc containing device_id and interface list.
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

            # Iterate through all interfaces in the device and update bandwidth if present
            for interface in device.get("interface", []):
                interface_name = interface.get("interface")
                if interface_name and interface_name in bandwidth_data:
                    interface["bandwidth"] = bandwidth_data[interface_name]

            # Save the updated document using device_id
            device_id = device.get("device_id")
            if device_id is None:
                print(f"Device doc for IP {device_ip} missing device_id")
                return None

            info_collection.update_one({"device_id": device_id}, {"$set": device})

            print(f"Successfully updated bandwidth data for device {device_ip}")
            # Return a minimal doc (no mac/hostname) but include device_id and interface list
            return {"device_id": device_id, "interface": device.get("interface", [])}

        except Exception as error:
            print(f"Error updating bandwidth for {device_ip}: {error}")
            return None