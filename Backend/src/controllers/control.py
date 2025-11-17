from src.controllers.devices import DeviceController
import asyncio
from src.services.device import DeviceService
from src.controllers.credentials import CredentialsController


device_interval = 3600  # seconds
mbps_interval = 0 # seconds


async def main_snmp():
    while True:
        await asyncio.gather(DeviceController.periodic_refresh_snmp(device_interval), DeviceController.update_mbps_loop_snmp(mbps_interval))


async def main_cli():
    while True:
        await asyncio.gather(DeviceController.periodic_refresh_cli(device_interval), DeviceService.update_mbps_loop_cli(mbps_interval))


asyncio.run(main_cli())

# asyncio.run(DeviceController.refresh_by_ip("192.170.0.78"))