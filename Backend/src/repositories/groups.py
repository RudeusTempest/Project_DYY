from src.config.database import groups_collection
from typing import Optional, List, Dict, Any


class GroupsRepo:

    @staticmethod
    def add_group(group_name: dict) -> Dict[str, Any]:
        try:
            # check if group already exists (e.g. by name)
            existing = groups_collection.find_one({"group": group_name.get("group")})
            if existing:
                return {"success": False, "reason": "Group already exists"}

            groups_collection.insert_one(group_name)
            return {"success": True, "message": "Group added successfully"}

        except Exception as e:
            print(f"Error adding group: {e}")
            return {"success": False, "reason": f"Error adding group: {e}"}


    @staticmethod
    def assign_device_to_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        try:
            result = groups_collection.update_one(
                {"group": group_name},
                {"$addToSet": {"device_macs": device_mac}}
            )
            if result.matched_count == 0:
                return {"success": False, "reason": "Group not found"}
            return {"success": True, "message": "Device assigned to group successfully"}
        except Exception as e:
            print(f"Error assigning device to group: {e}")
            return {"success": False, "reason": f"Error assigning device to group: {e}"}
        

    # @staticmethod
    # def get_all_groups() -> List[Dict[str, Any]]:
    #     try:
    #         group_list = list(groups_collection.find({}, {"_id": 0, "device_macs": 0}))
    #         return group_list
    #     except Exception as e:
    #         print(f"Error getting all groups: {e}")
    #         return []    
    

    @staticmethod
    def get_one_group(group_name: str) -> Optional[Dict[str, Any]]:
        try:
            group = groups_collection.find_one({"group": group_name}, {"_id": 0})
            return group
        except Exception as e:
            print(f"Error getting group {group_name}: {e}")
            return None   


    @staticmethod
    def get_all_groups() -> List[Dict[str, Any]]:
        try:
            # Remove "device_macs": 0 to include MAC addresses in results
            group_list = list(groups_collection.find({}, {"_id": 0}))
            return group_list
        except Exception as e:
            print(f"Error getting all groups: {e}")
            return [] 
    


    @staticmethod
    def delete_device_from_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        try:
            result = groups_collection.update_one(
                {"group": group_name},
                {"$pull": {"device_macs": device_mac}}
            )
            if result.matched_count == 0:
                return {"success": False, "reason": "Group not found"}
            return {"success": True, "message": "Device removed from group successfully"}
        except Exception as e:
            print(f"Error deleting device from group: {e}")
            return {"success": False, "reason": f"Error deleting device from group: {e}"}
    

    @staticmethod
    def delete_group(group_name: str) -> Dict[str, Any]:
        try:
            result = groups_collection.delete_one({"group": group_name})
            if result.deleted_count == 0:
                return {"success": False, "reason": "Group not found"}
            return {"success": True, "message": "Group deleted successfully"}
        except Exception as e:
            print(f"Error deleting group: {e}")
            return {"success": False, "reason": f"Error deleting group: {e}"}









    # @staticmethod
    # def get_all_groups() -> List[Dict[str, Any]]:
    #     try:
    #         group_list = list(groups_collection.find({}, {"_id": 0}))
    #         return group_list
    #     except Exception as e:
    #         print(f"Error getting all groups: {e}")
    #         return []    