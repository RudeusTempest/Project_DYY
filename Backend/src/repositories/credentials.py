from src.config.database import cred_collection
from typing import Optional, List, Dict, Any





class CredentialsRepo:  

    @staticmethod
    def add_device_cred(cred: dict) -> Dict[str, Any]:
        try:
            cred_collection.insert_one(cred)
            return {"success": True}
        except Exception as e:
            print(f"Error adding device credentials: {e}")
            return {"success": False, "reason": f"Error adding device credentials: {e}"}


    @staticmethod
    def get_all_cred() -> List[Dict[str, Any]]:
        try:
            cred_list = list(cred_collection.find({}, {"_id": 0}))
            return cred_list
        except Exception as e:
            print(f"Error getting all credentials: {e}")
            return []
    

    @staticmethod
    def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        try:
            device_cred = cred_collection.find_one({"ip": ip}, {"_id": 0})
            return device_cred
        except Exception as e:
            print(f"Error getting credential for IP {ip}: {e}")
            return None
    

    @staticmethod
    def get_all_ip_and_snmp() -> List[Dict[str, Any]]:
        try:
            ip_and_snmp_list = list(cred_collection.find({}, {"ip": 1, "snmp_password": 1, "_id": 0}))
            return ip_and_snmp_list
        except Exception as e:
            print(f"Error getting IP and SNMP list: {e}")
            return []
    
