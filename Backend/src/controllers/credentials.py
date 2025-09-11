from src.services.credentials import CredentialsService


class CredentialsController:
    
    @staticmethod
    def add_device(cred):
        CredentialsService.service_add_device(cred)
        
    @staticmethod
    def get_all_cred():
        return CredentialsService.service_get_all_cred()

    @staticmethod
    def get_one_cred(ip):
        return CredentialsService.service_get_one_cred(ip)