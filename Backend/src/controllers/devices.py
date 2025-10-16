from src.services.device import DeviceService
from src.repositories.devices import DevicesRepo


class DeviceController:

    @staticmethod
    def get_latest_records():
        return DeviceService.get_latest_records()
    

    @staticmethod
    def get_one_record():
        return DevicesRepo.get_one_record()


    @staticmethod
    def refresh_by_ip(ip):
        return DeviceService.refresh_by_ip(ip)