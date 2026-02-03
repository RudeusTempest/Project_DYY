from src.controllers.white_list import WhiteListController
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket
from src.utils.web_socket import connect, disconnect


router = APIRouter()


@router.post("/add_words")
async def add_words(words: str) -> Dict[str, Any]:
    try:
        return await WhiteListController.add_words(words)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add words: {str(e)}")


@router.get("/get_white_list")
async def get_white_list() -> List[Dict[str, Any]]:
    try:
        return await WhiteListController.get_white_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get white list: {str(e)}")


@router.delete("/delete_words/{word}")
async def delete_word(word: str) -> Dict[str, Any]:
    try:
        return await WhiteListController.delete_word(word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete words: {str(e)}")


@router.websocket("/ws/alerts")
async def alerts_socket(ws: WebSocket):
    await connect(ws)
    try:
        while True:
            await ws.receive_text()
    except:
        disconnect(ws)

