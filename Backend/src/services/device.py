from src.repositories.devices import DevicesRepo
from src.services.connection import ConnectionService
from src.services.extraction import ExtractionService
from src.services.credentials import CredentialsService
import asyncio
from typing import Optional, Dict, List, Any


class DeviceService:
 
    @staticmethod
    async def update_device_info_snmp(cred: dict) -> bool:
        try:
            # Pop SNMP password to avoid passing it to netmiko
            snmp_password = cred.pop("snmp_password", None)

            # Connects to device via netmiko
            connection = ConnectionService.connect(cred)
            if not connection:
                print(f"Failed to connect to device {cred.get('ip', 'unknown')}")
                return False
            
            if "cisco" in cred["device_type"]:
                print("Updating Cisco device:", cred["ip"])

                # Sends commands & recieve outputs
                outputs = ConnectionService.get_cisco_outputs(connection, cred["device_type"])
                if outputs is None:
                    print(f"Failed to get outputs from device {cred['ip']}")
                    return False
                    
                hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date = outputs
                print("Received outputs")

                # Extracting details via regex
                extraction_result = ExtractionService.extract_cisco(cred["device_type"], mac_output, hostname_output, ip_output, info_neighbors_output)
                if extraction_result is None:
                    print(f"Failed to extract data from device {cred['ip']}")
                    return False
                    
                mac_address, hostname, interface_data, info_neighbors = extraction_result
                print("Extracted data")

                # Getting interface indexes via SNMP (interface_indexes = {interface_name: index})
                interface_indexes = await ConnectionService.get_interfaces_indexes(cred["ip"], snmp_password)
                if interface_indexes is None:
                    print(f"Failed to get interface indexes for {cred['ip']}")
                    return False

                # Getting max speed & Mbps sent/received for each 
                for interface_dict in interface_data:
                    if interface_dict["interface"] not in interface_indexes:
                        print(f"Interface {interface_dict['interface']} not found in SNMP indexes")
                        continue
                        
                    # Gets max speed for each interface
                    max_speed = await ConnectionService.get_max_speed(cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                    interface_dict["max_speed"] = max_speed if max_speed is not None else "Not available"
                    
                    # Gets Mbps sent & received for each interface
                    mbps_data = await ConnectionService.get_mbps(cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                    if mbps_data:
                        mbps_received, mbps_sent = mbps_data
                        interface_dict["mbps_received"] = mbps_received
                        interface_dict["mbps_sent"] = mbps_sent
                    else:
                        interface_dict["mbps_received"] = "Not available"
                        interface_dict["mbps_sent"] = "Not available"
                    print(f"interface {interface_dict['interface']}: done")
                    
                # Saves details in database
                DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date, info_neighbors)
                print("Saved to DB")
                return True

            elif "juniper" in cred["device_type"]:
                print("Updating Juniper device:", cred["ip"])
                # Sends commands & recieve outputs
                outputs = ConnectionService.get_juniper_outputs(connection, cred["device_type"])
                if outputs is None:
                    print(f"Failed to get outputs from device {cred['ip']}")
                    return False
                    
                hostname_output, ip_output, mac_output, last_updated, raw_date = outputs
                print("Received outputs")
                
                # Extracting details via regex
                extraction_result = ExtractionService.extract_juniper(cred["device_type"], hostname_output, ip_output, mac_output)
                if extraction_result is None:
                    print(f"Failed to extract data from device {cred['ip']}")
                    return False
                    
                mac_address, hostname, interface_data = extraction_result
                print("Extracted data")
                
                # Getting interface indexes via SNMP (interface_indexes = {interface_name: index})
                interface_indexes = await ConnectionService.get_interfaces_indexes(cred["ip"], snmp_password)
                if interface_indexes is None:
                    print(f"Failed to get interface indexes for {cred['ip']}")
                    return False

                # Getting max speed & Mbps sent/received for each 
                for interface_dict in interface_data:
                    if interface_dict["interface"] not in interface_indexes:
                        print(f"Interface {interface_dict['interface']} not found in SNMP indexes")
                        continue
                        
                    # Gets max speed for each interface
                    max_speed = await ConnectionService.get_max_speed(cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                    interface_dict["max_speed"] = max_speed if max_speed is not None else "Not available"

                    # Gets Mbps sent & received for each interface
                    mbps_data = await ConnectionService.get_mbps(cred["ip"], snmp_password, interface_indexes[interface_dict["interface"]])
                    if mbps_data:
                        mbps_received, mbps_sent = mbps_data
                        interface_dict["mbps_received"] = mbps_received
                        interface_dict["mbps_sent"] = mbps_sent
                    else:
                        interface_dict["mbps_received"] = "Not available"
                        interface_dict["mbps_sent"] = "Not available"
                    print(f"interface {interface_dict['interface']}: done")
                    
                # Saves details in database
                DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date)
                return True
            else:
                print(f"Unsupported device type: {cred.get('device_type', 'unknown')}")
                return False
                
        except Exception as e:
            print(f"Error updating device {cred.get('ip', 'unknown')}: {e}")
            return False


    @staticmethod
    def get_latest_records() -> List[Dict[str, Any]]:
        try:
            all_records = DevicesRepo.get_all_records()
            latest_records = {}
            for record in all_records:
                mac = record.get("mac")
                raw_date = record.get("raw date")

                # Keep the latest record by raw_date
                if mac and (mac not in latest_records or raw_date > latest_records[mac]["raw date"]):
                    latest_records[mac] = record
            return list(latest_records.values())
        except Exception as e:
            print(f"Error getting latest records: {e}")
            return []


    @staticmethod
    def get_one_record(ip: str) -> List[Dict[str, Any]]:
        try:
            return DevicesRepo.get_one_record(ip)
        except Exception as e:
            print(f"Error getting record for IP {ip}: {e}")
            return []


    @staticmethod
    async def refresh_by_ip(ip: str, method: str) -> Optional[bool]:
        try:
            cred = CredentialsService.get_one_cred(ip)
            if not cred:
                print(f"No credentials found for IP {ip}")
                return None
            if method == "snmp":
                return await DeviceService.update_device_info_snmp(cred)
            elif method == "cli":
                return await DeviceService.update_device_info_cli(cred)
            else:
                print(f"Unknown method: {method}")
                return None
        except Exception as e:
            print(f"Error refreshing device {ip}: {e}")
            return None


    @staticmethod
    async def periodic_refresh_snmp(device_interval: float) -> None:
        # Run control_system for all devices periodically (blocking).
        while True:
            try:
                creds = CredentialsService.get_all_cred()
                for cred in creds:
                    if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") and cred.get("snmp_password") is not None:
                        await DeviceService.update_device_info_snmp(cred)
                await asyncio.sleep(device_interval)
            except Exception as e:
                print(f"Error in periodic refresh SNMP: {e}")
                await asyncio.sleep(device_interval)


    @staticmethod
    async def update_mbps_snmp(mbps_interval: float) -> None:
        try:
            ip_and_snmp_list = CredentialsService.get_all_ip_and_snmp()
            interface_dicts_list = DevicesRepo.get_interface_data()
            
            # For each device interfaces in DB
            for interface_dict in interface_dicts_list:
                # For each interface in device
                interfaces_data_list = interface_dict.get("interface", [])
                
                # For each interface data dict
                for interface_data in interfaces_data_list:
                    # Match IP with credentials to get SNMP password
                    for ip_and_snmp_dict in ip_and_snmp_list:
                        if ip_and_snmp_dict.get("snmp_password") is None:
                            continue
                        if interface_data.get("ip_address") == ip_and_snmp_dict.get("ip"):
                            # Get interface index via SNMP
                            interface_indexes = await ConnectionService.get_interfaces_indexes(ip_and_snmp_dict["ip"], ip_and_snmp_dict["snmp_password"])
                            if interface_indexes is None:
                                print(f"Skipping Mbps update for {interface_data.get('ip_address')} due to missing interface indexes")
                                continue
                            
                            interface_name = interface_data.get("interface")
                            if interface_name not in interface_indexes:
                                print(f"Interface {interface_name} not found in SNMP indexes")
                                continue
                            
                            mbps_data = await ConnectionService.get_mbps(ip_and_snmp_dict["ip"], ip_and_snmp_dict["snmp_password"], interface_indexes[interface_name])
                            if mbps_data:
                                interface_data["mbps_received"], interface_data["mbps_sent"] = mbps_data
                            else:
                                print(f"Failed to get Mbps data for {interface_data.get('ip_address')}")
                                continue
                    
                            # Save this back to MongoDB:
                            DevicesRepo.update_mbps(interface_data["ip_address"], interface_data["mbps_received"], interface_data["mbps_sent"])
                            print(f"Updated Mbps for {interface_data.get('ip_address')}")
                            await asyncio.sleep(mbps_interval)
        except Exception as e:
            print(f"Error updating Mbps SNMP: {e}")




#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
    
    @staticmethod
    async def periodic_refresh_cli(device_interval: float) -> None:
        # Run control_system for all devices periodically (blocking).
        while True:
            try:
                creds = CredentialsService.get_all_cred()
                for cred in creds:
                    if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") and cred.get("snmp_password") is not None:
                        await DeviceService.update_device_info_cli(cred)
                await asyncio.sleep(device_interval)
            except Exception as e:
                print(f"Error in periodic refresh CLI: {e}")
                await asyncio.sleep(device_interval)


    @staticmethod
    async def update_device_info_cli(cred: dict) -> Optional[bool]:
        """
        Main function to update device information
        Connects to device, retrieves data, extracts info, and saves to database
        """
        try:
            snmp_password = cred.pop("snmp_password", None)
            # Connect to device via netmiko
            connection = ConnectionService.connect(cred)

            if not connection:
                print(f"Failed to connect to device {cred.get('ip', 'unknown')}")
                return None

            if "cisco" in cred["device_type"]:
                # Send commands and receive outputs
                outputs = ConnectionService.get_cisco_outputs_cli(connection, cred["device_type"])
                if outputs is None:
                    print(f"Failed to get CLI outputs from device {cred.get('ip', 'unknown')}")
                    return None
                    
                hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date = outputs
                
                # Extract details via regex (including bandwidth per interface)
                extraction_result = ExtractionService.extract_cisco_cli(
                    cred["device_type"], 
                    hostname_output, 
                    ip_output, 
                    mac_output, 
                    info_neighbors_output,
                    all_interfaces_output
                )
                if extraction_result is None:
                    print(f"Failed to extract CLI data from device {cred.get('ip', 'unknown')}")
                    return None
                    
                mac_address, hostname, interface_data, info_neighbors = extraction_result
                
                # Save details to database
                DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date, info_neighbors)
                

            elif "juniper" in cred["device_type"]:
                # Send commands and receive outputs
                outputs = ConnectionService.get_juniper_outputs_cli(connection, cred["device_type"])
                if outputs is None:
                    print(f"Failed to get CLI outputs from device {cred.get('ip', 'unknown')}")
                    return None
                    
                hostname_output, ip_output, mac_output, all_interfaces_output, last_updated, raw_date = outputs
                
                # Extract details via regex (including bandwidth per interface)
                extraction_result = ExtractionService.extract_juniper_cli(
                    cred["device_type"], 
                    hostname_output, 
                    ip_output, 
                    mac_output,
                    all_interfaces_output
                )
                if extraction_result is None:
                    print(f"Failed to extract CLI data from device {cred.get('ip', 'unknown')}")
                    return None
                    
                mac_address, hostname, interface_data = extraction_result
                
                # Save details to database
                DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date)

            # Close connection
            if connection:
                connection.disconnect()
            
            return True
            
        except Exception as e:
            print(f"Error updating device CLI {cred.get('ip', 'unknown')}: {e}")
            return None


    @staticmethod
    async def update_mbps_loop_cli(mbps_interval: float) -> None:
        """
        Run periodic refresh for all devices
        Updates all device information every interval seconds (default: 1 hour)
        """
        
        while True:
            try:
                creds = CredentialsService.get_all_cred()
                for cred in creds:
                    snmp_password = cred.pop("snmp_password", None)
                    await DeviceService.update_mbps_cli(cred)
                await asyncio.sleep(mbps_interval)
            except Exception as e:
                print(f"Error in update Mbps loop CLI: {e}")
                await asyncio.sleep(mbps_interval)


    @staticmethod
    async def update_mbps_cli(cred: dict) -> Optional[bool]:
        try:
            connection = ConnectionService.connect(cred)
            if not connection:
                print(f"Failed to connect to device {cred.get('ip', 'unknown')}")
                return None
            
            if "cisco" in cred["device_type"]:
                all_interfaces_output = ConnectionService.get_cisco_mbps_output(connection, cred["device_type"])
                if all_interfaces_output is None:
                    print(f"Failed to get Mbps output from device {cred.get('ip', 'unknown')}")
                    return None
                    
                all_interfaces_data = ExtractionService.extract_bandwidth(all_interfaces_output)
                if all_interfaces_data is None or not all_interfaces_data:
                    print(f"Failed to extract bandwidth data from device {cred.get('ip', 'unknown')}")
                    return None
                    
                DevicesRepo.update_bandwidth_cli(cred['ip'], all_interfaces_data)
                return True
            
            elif "juniper" in cred["device_type"]:
                all_interfaces_output = ConnectionService.get_juniper_mbps_output(connection, cred["device_type"])
                if all_interfaces_output is None:
                    print(f"Failed to get Mbps output from device {cred.get('ip', 'unknown')}")
                    return None
                    
                all_interfaces_data = ExtractionService.extract_bandwidth_juniper(all_interfaces_output)
                if all_interfaces_data is None or not all_interfaces_data:
                    print(f"Failed to extract bandwidth data from device {cred.get('ip', 'unknown')}")
                    return None
                    
                DevicesRepo.update_bandwidth_cli(cred['ip'], all_interfaces_data)
                return True
            
            else:
                print(f"Unsupported device type: {cred.get('device_type', 'unknown')}")
                return None
                
        except Exception as e:
            print(f"Error updating Mbps CLI for {cred.get('ip', 'unknown')}: {e}")
            return None


    
      