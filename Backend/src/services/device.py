from src.repositories.devices import DevicesRepo
from src.services.connection import connect, get_outputs
from src.services.extraction import extract
from src.services.credentials import CredentialsService


class DeviceService:
 
    @staticmethod
    def update_device_info(cred):
        # Connects to device via netmiko
        connection = connect(cred)
        if not connection:
            return "Error: Unable to connect to the device with the provided credentials."

        # Sends commands & recieve outputs
        hostname_output, ip_output, mac_output, last_updated, raw_date = get_outputs(connection, cred["device_type"])

        # Extracting details via regex
        mac_address, hostname, interface_data = extract(cred["device_type"], hostname_output, ip_output, mac_output)

        # Saves details in database
        DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date)


    @staticmethod
    def get_latest_records():
        all_records = DevicesRepo.get_all_records()
        latest_records = {}
        for record in all_records:
            mac = record.get("mac")
            raw_date = record.get("raw date")

            # Keep the latest record by raw_date
            if mac not in latest_records or raw_date > latest_records[mac]["raw date"]:
                latest_records[mac] = record
        return list(latest_records.values())


    @staticmethod
    def refresh_by_ip(ip: str):
        from src.services.credentials import CredentialsService
        cred = CredentialsService.get_one_cred(ip)
        if not cred:
            return "Eror: No credentials found for the given IP."
        return DeviceService.update_device_info(cred)


    @staticmethod
    def periodic_refresh(interval: int = 3600):
        # Run control_system for all devices periodically (blocking).
        import time
        while True:
            creds = CredentialsService.get_all_cred()
            for device in creds:
                DeviceService.update_device_info(device)
            time.sleep(interval)