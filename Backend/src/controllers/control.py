from src.controllers.devices import DeviceController
import asyncio
from src.services.device import DeviceService
from src.controllers.credentials import CredentialsController


device_interval: int = 3600  # seconds
mbps_interval: int = 0  # seconds


async def main_snmp() -> None:
    try:
        while True:
            await asyncio.gather(
                DeviceController.periodic_refresh_snmp(device_interval), 
                DeviceController.update_mbps_loop_snmp(mbps_interval)
            )
    except Exception as e:
        print(f"Error in main_snmp: {e}")
        raise


async def main_cli() -> None:
    try:
        while True:
            await asyncio.gather(
                DeviceController.periodic_refresh_cli(device_interval), 
                DeviceService.update_mbps_loop_cli(mbps_interval)
            )
    except Exception as e:
        print(f"Error in main_cli: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main_cli())

# asyncio.run(DeviceController.refresh_by_ip("192.170.0.78"))