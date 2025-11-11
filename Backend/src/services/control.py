from src.services.device import DeviceService
from src.controllers.credentials import CredentialsController
from src.services.connection import ConnectionService
import asyncio


# DeviceService.update_device_info(CredentialsController.get_one_cred("192.170.0.74"))
# DeviceService.update_device_info(CredentialsController.get_one_cred("192.170.0.75"))
# DeviceService.update_device_info(CredentialsController.get_one_cred("192.170.0.78"))

# DeviceService.update_device_info_mbps(CredentialsController.get_one_cred("192.170.0.78"))


async def main():
    while True:
        await asyncio.gather(DeviceService.periodic_refresh(),DeviceService.periodic_refresh_mbps())

asyncio.run(main())

