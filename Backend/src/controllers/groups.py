from src.services.groups import GroupService
from typing import Optional, List, Dict, Any
import asyncio


class GroupController:

    @staticmethod
    async def add_group(group_name) -> Dict[str, Any]:
        return await GroupService.add_group(group_name)


    @staticmethod
    async def assign_device_to_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        return await GroupService.assign_device_to_group(device_mac, group_name)
    

    @staticmethod
    async def get_all_groups() -> List[Dict[str, Any]]:
        return await GroupService.get_all_groups() 
    

    @staticmethod
    async def get_one_group(group_name: str) -> Optional[Dict[str, Any]]:
        return await GroupService.get_one_group(group_name) 
    

    @staticmethod
    async def delete_device_from_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        return await GroupService.delete_device_from_group(device_mac, group_name) 
    

    @staticmethod
    async def delete_group(group_name: str) -> Dict[str, Any]:
        # Before deleting the group, remove all devices from the group
        return await GroupService.delete_group(group_name)
        