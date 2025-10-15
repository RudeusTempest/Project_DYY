from src.repositories.devices import DevicesRepo
from src.services.connection import connect, get_cisco_outputs, get_juniper_outputs
from src.services.extraction import extract_cisco, extract_juniper
from src.services.credentials import CredentialsService


class DeviceService:
 
    @staticmethod
    def update_device_info(cred):

        # Connects to device via netmiko
        connection = connect(cred)

        if "cisco" in cred["device_type"]:
            # Sends commands & recieve outputs
            hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date = get_cisco_outputs(connection, cred["device_type"])

            # Extracting details via regex
            mac_address, hostname, interface_data, info_neighbors = extract_cisco(cred["device_type"], hostname_output, ip_output, mac_output, info_neighbors_output)

            # Saves details in database
            DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date, info_neighbors)
            

        elif "juniper" in cred["device_type"]:
            # Sends commands & recieve outputs
            hostname_output, ip_output, mac_output, last_updated, raw_date = get_juniper_outputs(connection, cred["device_type"])

            # Extracting details via regex
            mac_address, hostname, interface_data = extract_juniper(cred["device_type"], hostname_output, ip_output, mac_output)

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
            return None

        DeviceService.update_device_info(cred)


    @staticmethod
    def periodic_refresh(interval: int = 3600):
        # Run control_system for all devices periodically (blocking).
        import time
        while True:
            creds = CredentialsService.get_all_cred()
            for device in creds:
                DeviceService.update_device_info(device)
            time.sleep(interval)