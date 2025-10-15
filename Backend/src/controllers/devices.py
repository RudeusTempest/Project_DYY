from src.services.device import DeviceService


class DeviceController:

    @staticmethod
    def get_latest_records():
        return DeviceService.get_latest_records()


    @staticmethod
    def refresh_by_ip(ip):
        DeviceService.refresh_by_ip(ip)