from src.repositories.devices import DevicesRepo
from src.services.connection import ConnectionService
from src.services.extraction import ExtractionService
from src.services.credentials import CredentialsService
import asyncio


class DeviceService:
 
    @staticmethod
    async def update_device_info(cred):
        """
        Main function to update device information
        Connects to device, retrieves data, extracts info, and saves to database
        """

        # Connect to device via netmiko
        connection = ConnectionService.connect(cred)

        if not connection:
            return None

        if "cisco" in cred["device_type"]:
            # Send commands and receive outputs
            hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date = ConnectionService.get_cisco_outputs(connection, cred["device_type"])
            # Extract details via regex (including bandwidth per interface)
            mac_address, hostname, interface_data, info_neighbors = ExtractionService.extract_cisco(
                cred["device_type"], 
                hostname_output, 
                ip_output, 
                mac_output, 
                info_neighbors_output,
                all_interfaces_output
            )
            
            # Save details to database
            DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date, info_neighbors)
            

        elif "juniper" in cred["device_type"]:
            # Send commands and receive outputs
            hostname_output, ip_output, mac_output, last_updated, raw_date = ConnectionService.get_juniper_outputs(connection, cred["device_type"])
           
            # Extract details via regex (including bandwidth per interface)
            mac_address, hostname, interface_data = ExtractionService.extract_juniper(cred["device_type"], hostname_output, ip_output, mac_output)
            
            # Save details to database
            DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date)

        # Close connection
        if connection:
            connection.disconnect()


    @staticmethod
    async def update_device_info_mbps(cred):
        connection = ConnectionService.connect(cred)
        if not connection:
            return None
        all_interfaces_output = ConnectionService.get_cisco_outputs_mbps(connection, cred["device_type"])
        all_interfaces_nea = ExtractionService.extract_bandwidth(all_interfaces_output)
        DevicesRepo.update_bandwidth_only(cred['ip'], all_interfaces_nea)



    @staticmethod
    def get_latest_records():
        """
        Retrieve the latest records for all devices
        Returns a list of most recent device snapshots
        """
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
        """
        Refresh device information by IP address
        Fetches credentials and updates device info
        """
        from src.services.credentials import CredentialsService
        cred = CredentialsService.get_one_cred(ip)
        if not cred:
            return None

        DeviceService.update_device_info(cred)
        return DevicesRepo.get_one_record(ip)


    @staticmethod
    async def periodic_refresh(interval: int = 3600):
        """
        Run periodic refresh for all devices
        Updates all device information every interval seconds (default: 1 hour)
        """
        
        while True:
            creds = CredentialsService.get_all_cred()
            for cred in creds:
                await DeviceService.update_device_info(cred)
            await asyncio.sleep(interval)


    @staticmethod
    async def periodic_refresh_mbps(interval: int = 300):
        """
        Run periodic refresh for all devices
        Updates all device information every interval seconds (default: 1 hour)
        """
        
        while True:
            creds = CredentialsService.get_all_cred()
            for cred in creds :
                await DeviceService.update_device_info_mbps(cred)
            await asyncio.sleep(interval)



    # @staticmethod
    # async def periodic_refresh_single(cred, interval: int = 3600):
    #     """
    #     Periodically refresh a single device's full info
    #     """
    #     while True:
    #         await DeviceService.update_device_info(cred)
    #         await asyncio.sleep(interval)


    # @staticmethod
    # async def periodic_refresh_mbps_single(cred, interval: int = 300):
    #     """
    #     Periodically refresh a single device's bandwidth info
    #     """
    #     while True:
    #         await DeviceService.update_device_info_mbps(cred)
    #         await asyncio.sleep(interval)
