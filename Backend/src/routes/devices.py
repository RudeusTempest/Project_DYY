from fastapi import APIRouter
from src.controllers.devices import DeviceController


router = APIRouter()


@router.get("/get_all")
async def get_latest_records():
    return DeviceController.get_latest_records()


@router.post("/refresh_one")
async def refresh_by_ip(ip: str):
    DeviceController.refresh_by_ip(ip)