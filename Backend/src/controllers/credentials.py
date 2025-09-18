from src.services.credentials import CredentialsService


class CredentialsController:
    
    @staticmethod
    def add_device_cred(cred):
        CredentialsService.add_device_cred(cred)
        
    @staticmethod
    def get_all_cred():
        return CredentialsService.get_all_cred()

    @staticmethod
    def get_one_cred(ip):
        return CredentialsService.get_one_cred(ip)