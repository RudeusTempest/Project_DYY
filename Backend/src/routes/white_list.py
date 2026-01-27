from src.controllers.white_list import WhiteListController
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import asyncio


router = APIRouter()


@router.post("/add_words")
async def add_words(words: str) -> Dict[str, Any]:
    try:
        return await WhiteListController.add_words(words)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add words: {str(e)}")

