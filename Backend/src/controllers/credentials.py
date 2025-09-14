from src.services.credentials import CredentialsService


class CredentialsController:
    
    @staticmethod
    def add_device(cred):
        CredentialsService.add_device(cred)
        
    @staticmethod
    def get_all_cred():
        return CredentialsService.get_all_cred()

    @staticmethod
    def get_one_cred(ip):
        return CredentialsService.get_one_cred(ip)