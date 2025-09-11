from fastapi import APIRouter
from src.models.device import device_cred
from src.controllers.credentials import CredentialsController


router = APIRouter()


@router.post("/add_device")    
async def add_device(cred: device_cred):
    CredentialsController.add_device(cred)
    

@router.get("/connection_details")
async def get_all_cred():
    return CredentialsController.get_all_cred()


@router.get("/get_one_cred")
async def get_one_cred(ip: str):
    return CredentialsController.get_one_cred(ip)