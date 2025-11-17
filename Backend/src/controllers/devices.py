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
    async def refresh_by_ip(ip, method):
        await DeviceService.refresh_by_ip(ip, method)
    

    @staticmethod
    async def periodic_refresh_snmp(mbps_interval: float):
        await DeviceService.periodic_refresh_snmp(mbps_interval)


    @staticmethod
    async def update_mbps_loop_snmp(mbps_interval: float):
        while True:
            await DeviceService.update_mbps_snmp(mbps_interval)
    
             


#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""

    @staticmethod
    async def periodic_refresh_cli(device_interval: float):
        await DeviceService.periodic_refresh_cli(device_interval)