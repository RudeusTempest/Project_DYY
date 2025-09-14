from src.services.device import DeviceService
from src.controllers.credentials import CredentialsController

DeviceService.control_system(CredentialsController.get_one_cred("192.170.0.74"))

