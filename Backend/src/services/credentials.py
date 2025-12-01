from src.repositories.credentials import CredentialsRepo
from src.models.device import device_cred
from typing import Optional, List, Dict, Any


class CredentialsService:

    @staticmethod
    def add_device_cred(device_cred: device_cred) -> None:
        return CredentialsRepo.add_device_cred(device_cred.model_dump())


    @staticmethod
    def get_all_cred() -> List[Dict[str, Any]]:   
        return CredentialsRepo.get_all_cred()  


    @staticmethod
    def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        return CredentialsRepo.get_one_cred(ip)  


    @staticmethod
    def get_all_ip_and_snmp() -> List[Dict[str, Any]]:   
        return CredentialsRepo.get_all_ip_and_snmp()
