from src.services.credentials import CredentialsService
from src.models.api.credentials import device_cred
from typing import List, Dict, Any, Optional


class CredentialsController:

    @staticmethod
    async def add_device_cred(cred: device_cred, method: str = "snmp") -> Dict[str, Any]:
        return await CredentialsService.add_device_cred(cred, method)


    @staticmethod
    async def get_all_cred() -> List[Dict[str, Any]]:
        return await CredentialsService.get_all_cred()


    @staticmethod
    async def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        return await CredentialsService.get_one_cred(ip)


