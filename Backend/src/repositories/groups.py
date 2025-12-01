from src.config.database import groups_collection
from typing import Optional, List, Dict, Any


class GroupsRepo:

    @staticmethod
    def add_group(group_name: dict) -> Dict[str, Any]:
        try:
            groups_collection.insert_one({"group": group_name})
        except Exception as e:
            print(f"Error adding group: {e}")
            return {"success": False, "reason": f"Error adding group: {e}"}


    @staticmethod
    def get_all_groups() -> List[Dict[str, Any]]:
        try:
            group_list = list(groups_collection.find({}, {"_id": 0}))
            return group_list
        except Exception as e:
            print(f"Error getting all groups: {e}")
            return []