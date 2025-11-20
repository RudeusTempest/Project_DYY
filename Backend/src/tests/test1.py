import asyncio
from src.controllers.devices import DeviceController
asyncio.run(DeviceController.refresh_by_ip("192.170.0.78", "snmp"))