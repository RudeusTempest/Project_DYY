from src.services.device import DeviceService
from src.repositories.devices import DevicesRepo


class DeviceController:

    @staticmethod
    def get_latest_records():
        return DeviceService.get_latest_records()
    

    @staticmethod
    def get_one_record(ip: str):
        return DevicesRepo.get_one_record(ip)


    @staticmethod
    async def refresh_by_ip(ip):
        await DeviceService.refresh_by_ip(ip)
    

    @staticmethod
    async def periodic_refresh(device_interval: float = 3600, mbps_interval: float = 1.0):
        await DeviceService.periodic_refresh(device_interval, mbps_interval)


    @staticmethod
    async def update_mbps_loop(mbps_interval=1.0):
        while True:
            await DeviceService.update_mbps(mbps_interval)
            
             