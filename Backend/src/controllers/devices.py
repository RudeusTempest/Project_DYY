from src.services.device import DeviceService
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
import asyncio


class DeviceController:

    @staticmethod
    async def get_latest_records() -> List[Dict[str, Any]]:
        return await DeviceService.get_latest_records()
    

    @staticmethod
    async def get_one_record(ip: str) -> List[Dict[str, Any]]:
        return await DeviceService.get_one_record(ip)


    @staticmethod
    async def get_current_config(ip: str) -> Optional[Dict[str, Any]]:
        return await DeviceService.get_current_config(ip)


    @staticmethod
    async def get_config_history(ip: str) -> List[Dict[str, Any]]:
        return await DeviceService.get_config_history(ip)


    @staticmethod
    async def get_config_differences(ip: str) -> Optional[Dict[str, Any]]:
        return await DeviceService.get_config_differences(ip)


    @staticmethod
    async def refresh_by_ip(ip: str, method: str) -> Optional[bool]:
        return await DeviceService.refresh_by_ip(ip, method)
    

    @staticmethod
    async def periodic_refresh_snmp(mbps_interval: float) -> None:
        await DeviceService.periodic_refresh_snmp(mbps_interval)


    @staticmethod
    async def update_mbps_loop_snmp(mbps_interval: float) -> None:
        await DeviceService.update_mbps_loop_snmp(mbps_interval)
    

    @staticmethod
    async def main_snmp(device_interval, mbps_interval) -> None:
        try:
            await asyncio.gather(
                DeviceController.periodic_refresh_snmp(device_interval), 
                DeviceController.update_mbps_loop_snmp(mbps_interval)
            )
        except Exception as e:
            print(f"Error in main_snmp: {e}")
            raise HTTPException(status_code=500, detail=f"Error in main_snmp: {str(e)}")


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
            await asyncio.gather(
                DeviceController.periodic_refresh_cli(device_interval), 
                DeviceController.update_mbps_loop_cli(mbps_interval)
            )
        except Exception as e:
            print(f"Error in main_cli: {e}")
            raise HTTPException(status_code=500, detail=f"Error in main_cli: {str(e)}")
