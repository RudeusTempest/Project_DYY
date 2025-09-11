from src.services.device import DeviceService


class DeviceController:

    @staticmethod
    def get_latest_records():
        return DeviceService.get_latest_records()


    @staticmethod
    def refresh_by_ip(ip):
        return DeviceService.refresh_by_ip(ip)