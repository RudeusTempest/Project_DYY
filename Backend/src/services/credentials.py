from src.repositories.credentials_repo import CredentialsRepo
from src.models.device import device_cred


class CredentialsService:

    @staticmethod
    def add_device(device_cred : device_cred):
        CredentialsRepo.add_device(device_cred.model_dump())


    @staticmethod
    def get_all_cred():   
        CredentialsRepo.get_all_cred()  


    @staticmethod
    def get_one_cred(ip: str):
        CredentialsRepo.get_one_cred(ip)     