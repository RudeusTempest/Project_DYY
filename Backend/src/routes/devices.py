from fastapi import APIRouter
from src.services.device import DeviceService

router = APIRouter()

@router.get("/get_all")
async def get_info():
    return DeviceService.get_latest_records()


@router.post("/refresh_one")
async def refresh_by_ip(ip: str):
    return DeviceService.refresh_by_ip(ip)