from src.controllers.devices import DeviceController
import asyncio


device_interval = 3600  # seconds
mbps_interval = 60 # seconds


async def main():
    while True:
        await asyncio.gather(DeviceController.periodic_refresh(device_interval, mbps_interval), DeviceController.update_mbps_loop(mbps_interval))


asyncio.run(main())

