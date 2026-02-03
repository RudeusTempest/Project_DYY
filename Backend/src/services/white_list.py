from src.repositories.postgres.white_list import WhiteListRepo
from typing import Optional, Dict, List, Any
import asyncio


class WhiteListService:

    @staticmethod
    async def add_words(words: str) -> Dict[str, Any]:
        return await WhiteListRepo.add_words(words)

    @staticmethod
    async def get_white_list() -> List[Dict[str, Any]]:
        return await WhiteListRepo.get_white_list()

    @staticmethod
    async def delete_word(word: str) -> Dict[str, Any]:
        return await WhiteListRepo.delete_word(word)