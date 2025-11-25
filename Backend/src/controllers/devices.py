from src.services.device import DeviceService
from src.repositories.devices import DevicesRepo
from typing import Optional, List, Dict, Any
import asyncio

class DeviceController:

    @staticmethod
    def get_latest_records() -> List[Dict[str, Any]]:
        return DeviceService.get_latest_records()
    

    @staticmethod
    def get_one_record(ip: str) -> List[Dict[str, Any]]:
        return DeviceService.get_one_record(ip)


    @staticmethod
    async def refresh_by_ip(ip: str, method: str) -> Optional[bool]:
        return await DeviceService.refresh_by_ip(ip, method)
    

    @staticmethod
    async def periodic_refresh_snmp(mbps_interval: float) -> None:
        return await DeviceService.periodic_refresh_snmp(mbps_interval)


    @staticmethod
    async def update_mbps_loop_snmp(mbps_interval: float) -> None:
        while True:
            await DeviceService.update_mbps_snmp()
            await asyncio.sleep(mbps_interval)
    

    @staticmethod
    async def main_snmp(device_interval, mbps_interval) -> None:
        try:
            while True:
                await asyncio.gather(
                    DeviceController.periodic_refresh_snmp(device_interval), 
                    DeviceController.update_mbps_loop_snmp(mbps_interval)
                )
        except Exception as e:
            print(f"Error in main_snmp: {e}")
            raise




#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""

    @staticmethod
    async def periodic_refresh_cli(device_interval: float) -> None:
        await DeviceService.periodic_refresh_cli(device_interval)


    @staticmethod
    async def update_mbps_loop_cli(mbps_interval: float) -> None:
        await DeviceService.update_mbps_loop_cli(mbps_interval)

    @staticmethod
    async def main_cli(device_interval, mbps_interval) -> None:
        try:
            while True:
                await asyncio.gather(
                    DeviceController.periodic_refresh_cli(device_interval), 
                    DeviceController.update_mbps_loop_cli(mbps_interval)
                )
        except Exception as e:
            print(f"Error in main_cli: {e}")
            raise    
