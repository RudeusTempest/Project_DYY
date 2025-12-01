from src.services.groups import GroupService
from src.repositories.devices import DevicesRepo
from typing import Optional, List, Dict, Any
import asyncio


class GroupController:

    @staticmethod
    async def add_group(group_name) -> Dict[str, Any]:
        return GroupService.add_group(group_name)
