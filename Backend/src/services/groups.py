from src.repositories.groups import GroupsRepo
import asyncio
from typing import Optional, Dict, List, Any


class GroupService:

    @staticmethod
    async def add_group(group_name: str) -> Dict[str, Any]:
        return GroupsRepo.add_group(group_name)