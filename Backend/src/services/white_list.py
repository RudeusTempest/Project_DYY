from src.repositories.postgres.white_list import WhiteListRepo
from typing import Optional, Dict, List, Any
import asyncio


class WhiteListService:

    @staticmethod
    async def add_words(words: str) -> Dict[str, Any]:
        return await WhiteListRepo.add_words(words)