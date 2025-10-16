from fastapi import APIRouter
from src.controllers.devices import DeviceController


router = APIRouter()


@router.get("/get_all")
async def get_latest_records():
    return DeviceController.get_latest_records()


@router.get("/get_one_record")
async def get_one_record(ip: str):
    return DeviceController.get_one_record(ip)


@router.post("/refresh_one")
async def refresh_by_ip(ip: str):
    return DeviceController.refresh_by_ip(ip)