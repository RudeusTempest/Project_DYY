from src.services.white_list import WhiteListService
from typing import Optional, List, Dict, Any
import asyncio


class WhiteListController:

    @staticmethod
    async def add_words(words) -> Dict[str, Any]:
        return await WhiteListService.add_words(words)