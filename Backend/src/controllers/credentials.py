from src.services.credentials import CredentialsService


class CredentialsController:
    
    @staticmethod
<<<<<<< Updated upstream
    def add_device_cred(cred):
        CredentialsService.add_device_cred(cred)
=======
    def add_device(cred):
        CredentialsService.add_device(cred)
>>>>>>> Stashed changes
        

    @staticmethod
    def get_all_cred():
        return CredentialsService.get_all_cred()
<<<<<<< Updated upstream

    @staticmethod
    def get_one_cred(ip):
        return CredentialsService.get_one_cred(ip)
=======


    @staticmethod
    def get_one_cred(ip):
        return CredentialsService.get_one_cred(ip)
    
    
  

    
>>>>>>> Stashed changes
