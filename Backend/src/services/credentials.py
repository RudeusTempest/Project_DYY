from Backend.src.repositories.credentials import CredentialsRepo
from src.models.device import device_cred


class CredentialsService:

    @staticmethod
    def add_device_cred(device_cred : device_cred):
        CredentialsRepo.add_device_cred(device_cred.model_dump())


    @staticmethod
    def get_all_cred():   
        return CredentialsRepo.get_all_cred()  


    @staticmethod
    def get_one_cred(ip: str):
        return CredentialsRepo.get_one_cred(ip)     