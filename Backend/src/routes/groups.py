from src.controllers.groups import GroupController
from src.models.api.groups import Group
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import asyncio


router = APIRouter()


@router.post("/add_group")
async def add_group(group_name: Group) -> Dict[str, Any]:
    try:
        return await GroupController.add_group(group_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add group: {str(e)}")


@router.post("/assign_device_to_group")
async def assign_device_to_group(device_mac: str, group_name: str) -> Dict[str, Any]:
    try:
        return await GroupController.assign_device_to_group(device_mac, group_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign device to group: {str(e)}")


@router.get("/get_all_groups")
async def get_all_groups() -> List[Dict[str, Any]]:
    try:
        return await GroupController.get_all_groups()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve groups: {str(e)}")
    

@router.get("/one_group")
async def get_one_group(group_name: str) -> Dict[str, Any]:
    try:
        result = await GroupController.get_one_group(group_name)
        if not result:
            raise HTTPException(status_code=404, detail=f"Group not found: {group_name}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve group: {str(e)}")    
    

@router.delete("/delete_device_from_group")
async def delete_device_from_group(device_mac: str, group_name: str) -> Dict[str, Any]:
    try:
        return await GroupController.delete_device_from_group(device_mac, group_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete device from group: {str(e)}")    
    

@router.delete("/delete_group")    
async def delete_group(group_name: str) -> Dict[str, Any]:
    try:
        return await GroupController.delete_group(group_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete group: {str(e)}")