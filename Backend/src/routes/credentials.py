from fastapi import APIRouter
from src.models.device import device_cred
from src.services.credentials import CredentialsService

router = APIRouter()

@router.post("/add_device")    
async def add_device(cred : device_cred):
    CredentialsService.service_add_device(cred)
    

@router.get("/connection_details")
async def get_all_cred():
    return CredentialsService.service_get_all_cred()


@router.get("/get_one_cred")
async def get_one_cred(ip: str):
    return CredentialsService.service_get_one_cred(ip)