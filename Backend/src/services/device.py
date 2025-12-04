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
            snmp_password = cred.pop("snmp_password", None)
            mac_address_input = cred.pop("mac_address", None)
            ip = cred.get("ip")

            if not snmp_password:
                print(f"No SNMP password provided for device {ip}")
                DevicesRepo.flag_device_inactive(mac_address_input)
                return {"success": False, "reason": f"No SNMP password provided for device {ip}"}

            print(f"Updating device via SNMP: {ip}")

            # Fetch device hostname via SNMP
            hostname = await ConnectionService.get_hostname(ip, snmp_password)
            if hostname is None:
                hostname = "Hostname not found"
            print(f"Hostname: {hostname}")

            # Fetch interface indexes (returns dict like {interface_name: index, ...})
            interface_indexes = await ConnectionService.get_interfaces_indexes(ip, snmp_password)
            if interface_indexes is None or len(interface_indexes) == 0:
                print(f"Failed to get valid interface indexes for {ip}")
                DevicesRepo.flag_device_inactive(mac_address_input)
                return {"success": False, "reason": f"Failed to get valid interface indexes for {ip}"}

            print(f"Found {len(interface_indexes)} valid interfaces")

            # Use MAC address from credentials (ensures consistency with CLI method)
            # This is the device's unique identifier in the database
            mac_address = mac_address_input if mac_address_input else "Not found"
            print(f"MAC Address: {mac_address} (from credentials)")

            # Fetch interface index to IP mapping
            index_to_ip_mapping = await ConnectionService.get_interface_index_to_ip_mapping(ip, snmp_password)
            if index_to_ip_mapping is None:
                index_to_ip_mapping = {}

            # Build interface data using SNMP - only use valid interface names from get_interfaces_indexes
            interface_data = []
            
            for interface_name, interface_index in interface_indexes.items():
                # Get interface admin and operational status
                admin_status = await ConnectionService.get_interface_admin_status(ip, snmp_password, interface_index)
                oper_status = await ConnectionService.get_interface_status(ip, snmp_password, interface_index)
                
                if admin_status is None:
                    admin_status = "unknown"
                if oper_status is None:
                    oper_status = "unknown"

                # Get IP address from the mapping
                ip_address = index_to_ip_mapping.get(interface_index, "Unassigned")

                # Fetch max speed
                max_speed = await ConnectionService.get_max_speed(ip, snmp_password, interface_index)
                max_speed = max_speed if max_speed is not None else "Not available"

                # Fetch Mbps
                mbps_data = await ConnectionService.get_mbps(ip, snmp_password, interface_index)
                if mbps_data:
                    mbps_received, mbps_sent = mbps_data
                else:
                    mbps_received = "Not available"
                    mbps_sent = "Not available"

                interface_data.append({
                    "interface": interface_name,
                    "ip_address": ip_address,
                    "status": f"{admin_status}/{oper_status}",
                    "max_speed": max_speed,
                    "mbps_received": mbps_received,
                    "mbps_sent": mbps_sent
                })

                print(f"Interface {interface_name} (idx: {interface_index}): {admin_status}/{oper_status}, IP: {ip_address}, Speed: {max_speed} Mbps")

            # Get current timestamp
            from src.utils.datetime import now_formatted
            raw_date, last_updated = now_formatted()

            # Save to database
            DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date)
            print(f"Successfully updated device {ip} via SNMP and saved to DB")
            return {"success": True}

        except Exception as e:
            print(f"Error updating device {cred.get('ip', 'unknown')} via SNMP: {e}")
            mac_address = cred.get('mac_address', 'unknown')
            DevicesRepo.flag_device_inactive(mac_address)
            return {"success": False, "reason": f"Error updating device via SNMP: {str(e)}"}
                
        except Exception as e:
            print(f"Error updating device {cred.get('ip', 'unknown')}: {e}")
            return {"success": False, "reason": f"Error connecting to {cred.get('ip', 'unknown')}: {str(e)}"}


    @staticmethod
    def get_latest_records() -> List[Dict[str, Any]]:
        try:
            all_records = DevicesRepo.get_all_records()
            latest_records = {}
            for record in all_records:
                mac = record.get("mac")
                raw_date = record.get("raw date")

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
                return {"success": False, "reason": f"No credentials found for IP {ip}"}
            if method == "snmp":
                return await DeviceService.update_device_info_snmp(cred)
            elif method == "cli":
                return await DeviceService.update_device_info_cli(cred)
            else:
                print(f"Unknown method: {method}")
                return {"success": False, "reason": f"Unknown refresh method: {method}"}
        except Exception as e:
            print(f"Error refreshing device {ip}: {e}")
            return {"success": False, "reason": f"Error refreshing device {ip}: {e}"}


    @staticmethod
    async def periodic_refresh_snmp(device_interval: float) -> None:
        while True:
            try:
                creds = CredentialsService.get_all_cred()
                for cred in creds:
                    if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") and cred.get("snmp_password") is not None:
                        try:
                            await DeviceService.update_device_info_snmp(cred)
                        except Exception as e:
                            print(f"Error updating device {cred.get('ip')} via SNMP: {e}")
                            continue
                await asyncio.sleep(device_interval)
            except Exception as e:
                print(f"Error in periodic refresh SNMP: {e}")
                await asyncio.sleep(device_interval)


    @staticmethod
    async def update_mbps_snmp() -> None:
        try:
            ip_and_snmp_list = CredentialsService.get_all_ip_and_snmp()
            interface_dicts_list = DevicesRepo.get_interface_data()
            
            for interface_dict in interface_dicts_list:
                interfaces_data_list = interface_dict.get("interface", [])
                
                for interface_data in interfaces_data_list:
                    for ip_and_snmp_dict in ip_and_snmp_list:
                        if ip_and_snmp_dict.get("snmp_password") is None:
                            continue
                        if interface_data.get("ip_address") == ip_and_snmp_dict.get("ip"):
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
                    
                            DevicesRepo.update_mbps(interface_data["ip_address"], interface_data["mbps_received"], interface_data["mbps_sent"])
                            print(f"Updated Mbps for {interface_data.get('ip_address')}")
        except Exception as e:
            print(f"Error updating Mbps SNMP: {e}")


    @staticmethod
    async def update_mbps_loop_snmp(mbps_interval: float) -> None:
        await DeviceService.update_mbps_snmp(mbps_interval)




#"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""" 
   
    @staticmethod
    async def periodic_refresh_cli(device_interval: float) -> None:
        while True:
            try:
                creds = CredentialsService.get_all_cred()
                for cred in creds:
                    if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") is not None:
                        try:
                            await DeviceService.update_device_info_cli(cred)
                        except Exception as e:
                            print(f"Error updating device {cred.get('ip')} via CLI: {e}")
                            continue
                await asyncio.sleep(device_interval)
            except Exception as e:
                print(f"Error in periodic refresh CLI: {e}")
                await asyncio.sleep(device_interval)


    @staticmethod
    async def update_device_info_cli(cred: dict) -> Optional[bool]:
        try:
            cred.pop("snmp_password", None)
            mac_address = cred.pop("mac_address", None)
            
            connection = ConnectionService.connect(cred)
            
            if not connection:
                DevicesRepo.flag_device_inactive(mac_address)
                return {"success": False, "reason": f"Failed to connect to device {cred.get('mac_address', 'unknown')}"}

            if "cisco" in cred["device_type"]:
                outputs = ConnectionService.get_cisco_outputs_cli(connection, cred["device_type"])
                
                # Close the connection
                connection.disconnect()
                
                if outputs is None:
                    print(f"Failed to get CLI outputs from device {cred.get('ip', 'unknown')}")
                    return {"success": False, "reason": f"Failed to get CLI outputs from device {cred.get('ip', 'unknown')}"}
                    
                hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date = outputs
                
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
                    return {"success": False, "reason": f"Failed to extract CLI data from device {cred.get('ip', 'unknown')}"}
                    
                mac_address, hostname, interface_data, info_neighbors = extraction_result
                
                DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date, info_neighbors)
                

            elif "juniper" in cred["device_type"]:
                outputs = ConnectionService.get_juniper_outputs_cli(connection, cred["device_type"])

                # Close the connection
                connection.disconnect()

                if outputs is None:
                    print(f"Failed to get CLI outputs from device {cred.get('ip', 'unknown')}")
                    return {"success": False, "reason": f"Failed to get outputs from device {cred['ip']}"}
                    
                hostname_output, ip_output, mac_output, all_interfaces_output, last_updated, raw_date = outputs
                
                extraction_result = ExtractionService.extract_juniper_cli(
                    cred["device_type"], 
                    hostname_output, 
                    ip_output, 
                    mac_output,
                    all_interfaces_output
                )
                if extraction_result is None:
                    print(f"Failed to extract CLI data from device {cred.get('ip', 'unknown')}")
                    return {"success": False, "reason": f"Failed to extract CLI data from device {cred.get('ip', 'unknown')}"}
                    
                mac_address, hostname, interface_data = extraction_result
                
                DevicesRepo.save_info(mac_address, hostname, interface_data, last_updated, raw_date)

            if connection:
                connection.disconnect()
            
            return {"success": True}
            
        except Exception as e:
            print(f"Error updating device CLI {cred.get('ip', 'unknown')}: {e}")
            return {"success": False, "reason": f"Error updating device CLI {cred.get('ip', 'unknown')}: {e}"}


    @staticmethod
    async def update_mbps_loop_cli(mbps_interval: float) -> None:
        while True:
            try:
                creds = CredentialsService.get_all_cred()
                for cred in creds:
                    if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") is not None:
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
                return None
            
            if "cisco" in cred["device_type"]:
                all_interfaces_output = ConnectionService.get_cisco_mbps_output(connection, cred["device_type"])

                # Close the connection
                connection.disconnect()
                
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

                # Close the connection
                connection.disconnect()
                
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
    
      