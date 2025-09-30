from src.services.device import DeviceService
from src.controllers.credentials import CredentialsController

DeviceService.update_device_info(CredentialsController.get_one_cred("192.170.0.77"))

