from src.services.white_list import WhiteListService
from typing import Optional, List, Dict, Any
import asyncio


class WhiteListController:

    @staticmethod
    async def add_words(words) -> Dict[str, Any]:
        return await WhiteListService.add_words(words)

    @staticmethod
    async def get_white_list() -> List[Dict[str, Any]]:
        return await WhiteListService.get_white_list()

    @staticmethod
    async def delete_word(word: str) -> Dict[str, Any]:
        return await WhiteListService.delete_word(word)