from src.repositories.postgres.credentials import CredentialsRepo
from src.models.api.credentials import device_cred
from typing import Optional, List, Dict, Any


class CredentialsService:

    @staticmethod
    async def add_device_cred(device_cred: device_cred) -> Dict[str, Any]:
        return await CredentialsRepo.add_device_cred(device_cred.model_dump())


    @staticmethod
    async def get_all_cred() -> List[Dict[str, Any]]:   
        return await CredentialsRepo.get_all_cred()  


    @staticmethod
    async def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        return await CredentialsRepo.get_one_cred(ip)


    @staticmethod
    async def get_all_ip_and_snmp() -> List[Dict[str, Any]]:   
        return await CredentialsRepo.get_all_ip_and_snmp()
