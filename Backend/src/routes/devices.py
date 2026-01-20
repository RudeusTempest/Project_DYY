from fastapi import APIRouter, HTTPException
from src.controllers.devices import DeviceController
from src.repositories.postgres.config import ConfigRepo
from typing import List, Dict, Any
import asyncio


router = APIRouter()


@router.get("/get_all")
async def get_latest_records() -> List[Dict[str, Any]]:
    try:
        return await DeviceController.get_latest_records()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve records: {str(e)}")


@router.get("/get_one_record")
async def get_one_record(ip: str) -> List[Dict[str, Any]]:
    try:
        result = await DeviceController.get_one_record(ip)
        if not result:
            raise HTTPException(status_code=404, detail=f"Record not found for IP: {ip}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve record: {str(e)}")


@router.post("/refresh_one")
async def refresh_by_ip(ip: str, method: str = "snmp") -> Dict[str, Any]:
    try:
        result = await DeviceController.refresh_by_ip(ip, method=method)
        # if result.get("success") is False:
            # raise HTTPException(status_code=404, detail=f"Device not found or refresh failed for IP: {ip}")
        return result
    except HTTPException as e:
        return {"success": False, "reason": e.detail}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh device: {str(e)}")


@router.put("/start_program")
async def start_program(device_interval: int, mbps_interval: int, method: str = "snmp" ) -> None:
    if method == "snmp":
        await (DeviceController.main_snmp(device_interval, mbps_interval))

    elif method == "cli":
        await (DeviceController.main_cli(device_interval, mbps_interval))


@router.get("/config/current")
async def get_current_config(mac_address: str) -> Dict[str, Any]:
    """
    Retrieve the latest configuration for a device by MAC address.
    """
    try:
        config = await ConfigRepo.get_latest_config(mac_address)
        if not config:
            raise HTTPException(status_code=404, detail=f"No configuration found for device MAC: {mac_address}")
        return config
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve configuration: {str(e)}")


@router.get("/config/history")
async def get_config_history(mac_address: str) -> List[Dict[str, Any]]:
    """
    Retrieve the configuration history (archived configurations) for a device by MAC address.
    """
    try:
        history = await ConfigRepo.get_config_history(mac_address)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve configuration history: {str(e)}")
