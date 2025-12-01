from fastapi import APIRouter, HTTPException
from src.controllers.groups import GroupController
from typing import List, Dict, Any
import asyncio
from src.models.groupes import Group


router = APIRouter()


@router.post("/add_group")
async def add_group(group_name: Group) -> Dict[str, Any]:
    try:
        result = await GroupController.add_group(group_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add group: {str(e)}")

