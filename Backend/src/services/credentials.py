from src.repositories.credentials_repo import CredentialsRepo
from src.models.device import device_cred


class CredentialsService:
    @staticmethod
    def service_add_device(device_cred : device_cred):
        CredentialsRepo.add_device(device_cred.model_dump())


    @staticmethod
    def service_get_all_cred():   
        CredentialsRepo.get_all_cred()  


    @staticmethod
    def service_get_one_cred(ip: str):
        CredentialsRepo.get_one_cred(ip)     