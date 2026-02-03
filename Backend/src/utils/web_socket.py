from fastapi import WebSocket

active_connections: set[WebSocket] = set()

async def connect(ws: WebSocket):
    await ws.accept()
    active_connections.add(ws)

def disconnect(ws: WebSocket):
    active_connections.discard(ws)

async def broadcast_alert(message: dict):
    for ws in list(active_connections):
        await ws.send_json(message)
