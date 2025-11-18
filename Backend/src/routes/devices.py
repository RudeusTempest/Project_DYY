from fastapi import APIRouter, HTTPException
from src.controllers.devices import DeviceController
from typing import List, Dict, Any


router = APIRouter()


@router.get("/get_all")
async def get_latest_records() -> List[Dict[str, Any]]:
    try:
        return DeviceController.get_latest_records()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve records: {str(e)}")


@router.get("/get_one_record")
async def get_one_record(ip: str) -> List[Dict[str, Any]]:
    try:
        result = DeviceController.get_one_record(ip)
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
        if result is None:
            raise HTTPException(status_code=404, detail=f"Device not found or refresh failed for IP: {ip}")
        return {"success": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh device: {str(e)}")

