from src.services.credentials import CredentialsService
from src.models.device import device_cred
from typing import Optional, List, Dict, Any


class CredentialsController:
    
    @staticmethod
    def add_device_cred(cred: device_cred) -> None:
        return CredentialsService.add_device_cred(cred)


    @staticmethod
    def get_all_cred() -> List[Dict[str, Any]]:
        return CredentialsService.get_all_cred()


    @staticmethod
    def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        return CredentialsService.get_one_cred(ip)

    