from fastapi import APIRouter, HTTPException
from src.models.credential import device_cred
from src.controllers.credentials import CredentialsController
from src.controllers.devices import DeviceController
from typing import List, Dict, Any


router = APIRouter()


@router.post("/add_device")    
async def add_device(cred: device_cred, method: str = "snmp") -> Dict[str, Any]:
    try:
        device_added = CredentialsController.add_device_cred(cred)
        refreshed = await DeviceController.refresh_by_ip(cred.ip, method)
        return {"device added": device_added, "refreshed": refreshed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add device: {str(e)}")


@router.get("/connection_details")
async def get_all_cred() -> List[Dict[str, Any]]:
    try:
        return CredentialsController.get_all_cred()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve credentials: {str(e)}")


@router.get("/get_one_cred")
async def get_one_cred(ip: str) -> Dict[str, Any]:
    try:
        result = CredentialsController.get_one_cred(ip)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Credentials not found for IP: {ip}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve credential: {str(e)}")