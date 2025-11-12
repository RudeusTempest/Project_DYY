from src.repositories.devices import DevicesRepo
from src.services.connection import ConnectionService
from src.services.extraction import ExtractionService
from src.services.credentials import CredentialsService
import asyncio

class DeviceService:
 
    @staticmethod
    async def update_device_info(cred, mbps_interval: float = 1.0):

        # Pop SNMP password to avoid passing it to netmiko
        snmp_password = cred.pop("snmp_password", None)

        # Connects to device via netmiko
        connection = ConnectionService.connect(cred)
        
        if "cisco" in cred["device_type"]:
            print("Updating Cisco device:", cred["ip"])

            # Sends commands & recieve outputs
            hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date = ConnectionService.get_cisco_outputs(connection, cred["device_type"])
            print("Received outputs")

            # Extracting details via regex
            mac_address, hostname, interface_data, info_neighbors = ExtractionService.extract_cisco(cred["device_type"], mac_output, hostname_output, ip_output, info_neighbors_output)
            print("Extracted data")

            # Getting interface indexes via SNMP (interface_indexes = {interface_name: index})
            interface_indexes = await ConnectionService.get_interfaces_indexes(cred["ip"], snmp_password)

            # Getting max speed & Mbps sent/received for each 
            for interface_dict in interface_data: 
                # Gets max speed for each interface
                max_speed = await ConnectionService.get_max_speed(cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                interface_dict["max_speed"] = max_speed
                
                # Gets Mbps sent & received for each interface
                mbps_received, mbps_sent = await ConnectionService.get_mbps(mbps_interval, cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                interface_dict["mbps_received"] = mbps_received
                interface_dict["mbps_sent"] = mbps_sent    
                print(f"interface {interface_dict['interface']}: done")
            # Saves details in database
            DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date, info_neighbors)
            print("Saved to DB")


        elif "juniper" in cred["device_type"]:
            print("Updating Juniper device:", cred["ip"])
            # Sends commands & recieve outputs
            hostname_output, ip_output, mac_output, last_updated, raw_date = ConnectionService.get_juniper_outputs(connection, cred["device_type"])
            print("Received outputs")
            # Extracting details via regex
            mac_address, hostname, interface_data = ExtractionService.extract_juniper(cred["device_type"], hostname_output, ip_output, mac_output)
            print("Extracted data")
            # Getting interface indexes via SNMP (interface_indexes = {interface_name: index})
            interface_indexes = await ConnectionService.get_interfaces_indexes(cred["ip"], snmp_password)

            # Getting max speed & Mbps sent/received for each 
            for interface_dict in interface_data: 
                # Gets max speed for each interface
                max_speed = await ConnectionService.get_max_speed(cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                interface_dict["max_speed"] = max_speed

                # Gets Mbps sent & received for each interface
                mbps_received, mbps_sent = await ConnectionService.get_mbps(mbps_interval, cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                interface_dict["mbps_received"] = mbps_received
                interface_dict["mbps_sent"] = mbps_sent    
                print(f"interface {interface_dict['interface']}: done")
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
    async def refresh_by_ip(ip: str):
        cred = CredentialsService.get_one_cred(ip)
        if not cred:
            return None

        await DeviceService.update_device_info(cred)


    @staticmethod
    async def periodic_refresh(device_interval: float = 3600, mbps_interval: float = 1.0):
        # Run control_system for all devices periodically (blocking).
        while True:
            creds = CredentialsService.get_all_cred()
            for cred in creds:
                if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") and cred.get("snmp_password") is not None:
                    await DeviceService.update_device_info(cred, mbps_interval=1.0)
            await asyncio.sleep(device_interval)


    @staticmethod
    async def update_mbps(mbps_interval: float = 1.0):
        ip_and_snmp_list = CredentialsService.get_all_ip_and_snmp()
        interface_dicts_list = DevicesRepo.get_interface_data()
        # For each device interfaces in DB
        for interface_dict in interface_dicts_list:
            # For each interface in device
            interfaces_data_list = interface_dict["interface"]
            # For each interface data dict
            for interface_data in interfaces_data_list:
                # Match IP with credentials to get SNMP password
                for ip_and_snmp_dict in ip_and_snmp_list:
                    if interface_data["ip_address"] == ip_and_snmp_dict["ip"]:
                        interface_indexes = await ConnectionService.get_interfaces_indexes(ip_and_snmp_dict["ip"], ip_and_snmp_dict["snmp_password"])
                        if interface_indexes is None:
                            print(f"Skipping Mbps update for {interface_data['ip_address']} due to missing SNMP password")
                            continue
                        interface_data["mbps_received"], interface_data["mbps_sent"] = await ConnectionService.get_mbps(mbps_interval, ip_and_snmp_dict["ip"], ip_and_snmp_dict["snmp_password"], interface_indexes[interface_data["interface"]])
                
                        # Save this back to MongoDB:
                        DevicesRepo.update_mbps(interface_data["ip_address"], interface_data["mbps_received"], interface_data["mbps_sent"])
                        print(f"Updated Mbps for {interface_data['ip_address']}")

