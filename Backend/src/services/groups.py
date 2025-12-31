from src.repositories.mongo.groups import GroupsRepo
from src.models.api.groups import Group
from typing import Optional, Dict, List, Any
import asyncio


class GroupService:

    @staticmethod
    async def add_group(group_name: Group) -> Dict[str, Any]:
        return GroupsRepo.add_group(group_name.model_dump())
    

    @staticmethod
    async def assign_device_to_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        return GroupsRepo.assign_device_to_group(device_mac, group_name) 
    

    @staticmethod
    async def get_all_groups() -> List[Dict[str, Any]]:
        return GroupsRepo.get_all_groups() 
    
    
    @staticmethod
    async def get_one_group(group_name: str) -> Optional[Dict[str, Any]]:
        return GroupsRepo.get_one_group(group_name) 
    

    @staticmethod
    async def delete_device_from_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        return GroupsRepo.delete_device_from_group(device_mac, group_name)


    @staticmethod
    async def delete_group(group_name: str) -> Dict[str, Any]:
        return GroupsRepo.delete_group(group_name)