from src.repositories.postgres.devices import DevicesRepo
from src.repositories.postgres.credentials import CredentialsRepo
from src.repositories.postgres.config import ConfigRepo
from src.services.connection import ConnectionService
from src.services.extraction import ExtractionService
from src.services.credentials import CredentialsService
from src.services.white_list import WhiteListService
from src.config.settings import settings
from typing import Optional, Dict, List, Any
import asyncio
from src.utils.web_socket import broadcast_alert
import re
from datetime import datetime


class DeviceService:
 
    @staticmethod
    async def update_device_info_snmp(cred: dict) -> Dict[str, Any]:
        try:
            snmp_password = cred.pop("snmp_password", None)
            mac_address = cred.pop("mac_address", None)
            device_type = cred.get("device_type")  # Extract device type from credentials
            ip = cred.get("ip")

            if not snmp_password:
                print(f"No SNMP password provided for device {ip}")
                await DevicesRepo.flag_device_inactive(mac_address)
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
                await DevicesRepo.flag_device_inactive(mac_address)
                return {"success": False, "reason": f"Failed to get valid interface indexes for {ip}"}

            print(f"Found {len(interface_indexes)} valid interfaces")

            # Use MAC address from credentials (ensures consistency with CLI method)
            # This is the device's unique identifier in the database
            mac_addr = mac_address if mac_address else "Not found"
            print(f"MAC Address: {mac_addr} (from credentials)")

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

            # Save to database with device_type
            await DevicesRepo.save_info(mac_addr, hostname, interface_data, last_updated, raw_date, device_type)
            print(f"Successfully updated device {ip} via SNMP and saved to DB")
            
            # Restore mac_address to cred for config capture
            cred["mac_address"] = mac_addr
            
            # Fetch and save device configuration
            try:
                await DeviceService.capture_and_save_config(cred)
            except Exception as e:
                print(f"Warning: Failed to capture configuration for device {ip}: {e}")
            
            return {"success": True}

        except Exception as e:
            print(f"Error updating device {ip or 'unknown'} via SNMP: {e}")
            if mac_address:
                await DevicesRepo.flag_device_inactive(mac_address)
            return {"success": False, "reason": f"Error updating device via SNMP: {str(e)}"}


    @staticmethod
    async def get_latest_records() -> List[Dict[str, Any]]:
        """
        Retrieve the latest device records from the database.
        For each unique MAC address, only the most recent record is returned.
        Device type is already stored in the database, no need to fetch from credentials.
        """
        try:
            all_records = await DevicesRepo.get_all_records()
            latest_records = {}
            
            # Keep only the most recent record for each MAC address
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
    async def get_one_record(ip: str) -> List[Dict[str, Any]]:
        try:
            return await DevicesRepo.get_one_record(ip)
        except Exception as e:
            print(f"Error getting record for IP {ip}: {e}")
            return []


    @staticmethod
    async def get_current_config(ip: str) -> Optional[Dict[str, Any]]:
        """
        Get the latest configuration for a device by IP address.
        Converts IP to MAC address and retrieves config from repository.
        """
        try:
            mac_address = await CredentialsRepo.get_mac_from_ip(ip)
            if not mac_address:
                return None
            
            config = await ConfigRepo.get_latest_config(mac_address)
            return config
        except Exception as e:
            print(f"Error getting current config for IP {ip}: {e}")
            return None


    @staticmethod
    async def get_config_history(ip: str) -> List[Dict[str, Any]]:
        """
        Get the configuration history for a device by IP address.
        Converts IP to MAC address and retrieves history from repository.
        """
        try:
            mac_address = await CredentialsRepo.get_mac_from_ip(ip)
            if not mac_address:
                return []
            
            history = await ConfigRepo.get_config_history(mac_address)
            return history
        except Exception as e:
            print(f"Error getting config history for IP {ip}: {e}")
            return []


    @staticmethod
    async def get_config_differences(ip: str) -> Optional[Dict[str, Any]]:
        """
        Get the differences between the current and archived configuration for a device by IP address.
        Returns a dictionary with added and deleted lines, and the indexes of added lines.
        """
        try:
            differences = await ConfigRepo.get_config_differences(ip)
            if differences:
                return {
                    "ip": ip,
                    "added_lines": differences[0],
                    "deleted_lines": differences[1],
                    "full_config_lines": differences[2],
                    "added_lines_indexes": differences[3]
                }
            return None
        except Exception as e:
            print(f"Error getting config differences for IP {ip}: {e}")
            return None
        

    @staticmethod
    async def normalize_config(config: str) -> str:
        """
        Remove non-meaningful lines (timestamps, build info, etc.)
        so configs can be compared meaningfully.
        """
        normalized_lines = []

        for line in config.splitlines():
            line = line.strip()

            # Skip empty lines
            if not line:
                continue

            # Skip timestamp lines (IOS XR example)
            if re.match(r"^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s+\d+\s\d{2}:\d{2}:\d{2}", line):
                continue

            # Skip known noisy lines
            if line.startswith("Building configuration"):
                continue
            if line.startswith("!! IOS XR Configuration"):
                continue
            if line.startswith("!! Last configuration change"):
                continue

            normalized_lines.append(line)

        return "\n".join(normalized_lines)    


    @staticmethod
    async def refresh_by_ip(ip: str, method: str) -> Optional[bool]:
        try:
            cred = await CredentialsService.get_one_cred(ip)
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
    async def capture_and_save_config(cred: dict) -> None:
        """
        Helper method to capture device configuration via CLI and save it to the database.
        Handles both SNMP and CLI polling scenarios.
        """
        try:
            ip = cred.get("ip")
            mac_address = cred.get("mac_address")
            device_type = cred.get("device_type")
            
            # Try to connect via CLI to fetch configuration
            connection = ConnectionService.connect(cred)
            if not connection:
                print(f"Could not establish connection to fetch config for device {ip}")
                return
            
            config_output = None
            
            try:
                if "cisco" in device_type:
                    config_output = ConnectionService.get_cisco_config(connection, device_type)
                elif "juniper" in device_type:
                    config_output = ConnectionService.get_juniper_config(connection, device_type)
                else:
                    print(f"Unsupported device type for config capture: {device_type}")
            finally:
                # Always close connection
                try:
                    connection.disconnect()
                except Exception:
                    pass
            
            if config_output:
                normalized_new_config = await DeviceService.normalize_config(config_output)
                normalized_old_config = await DeviceService.normalize_config((await DeviceService.get_current_config(ip))["configuration"])

                # Only save if the configuration changed
                if normalized_new_config != normalized_old_config:
                    # Save configuration to database (will automatically archive old config if exists)
                    await ConfigRepo.save_config(mac_address, config_output, datetime.now())
                    print(f"Successfully captured and saved configuration for device {mac_address} ({ip})")
            else:
                print(f"No configuration data retrieved for device {ip}")
                
        except Exception as e:
            print(f"Error capturing configuration: {e}")


    @staticmethod
    async def poll_config_loop():
        while True:
            try:
                creds = await CredentialsService.get_all_cred()
                for cred in creds:
                    await DeviceService.capture_and_save_config(cred)
                    differences = await DeviceService.get_config_differences(cred.get("ip"))
                    if differences:
                        white_list = await WhiteListService.get_white_list() 

                        for dict in white_list:
                            header = re.escape(dict["words"])
                            pattern = re.compile(rf"^\s*{header}\b", re.MULTILINE)
                            added_lines = differences["added_lines"]
                            deleted_lines = differences["deleted_lines"]
                            
                            for line in added_lines:
                                added = pattern.search(line or "")

                            for line in deleted_lines:
                                deleted = pattern.search(line or "")

                            if added or deleted:
                                await broadcast_alert({
                                    "Alert": f"{dict['words']} changed!"
                                })
                                print("---------------------Alerted frontend---------------------")

                    await asyncio.sleep(settings.conf_interval)

            except Exception as e:        
                print(f"error in poll_config_loop: {e}")


    @staticmethod
    async def periodic_refresh_snmp(device_interval: float) -> None:
        """
        Periodically refresh all devices via SNMP at the specified interval.
        Only devices with complete SNMP credentials are updated.
        """
        while True:
            try:
                creds = await CredentialsService.get_all_cred()
                for cred in creds:
                    if cred.get("device_type") and cred.get("ip") and cred.get("username") and cred.get("password") and cred.get("snmp_password") is not None:
                        try:
                            await DeviceService.update_device_info_snmp(cred)
                        except Exception as e:
                            print(f"Error updating device {cred.get('ip')} via SNMP: {e}")
                            continue
                await asyncio.sleep(device_interval)
            except Exception as e:
                print(f"cred Error in periodic refresh SNMP: {e}")


    @staticmethod
    async def update_mbps_snmp() -> None:
        try:
            ip_and_snmp_list = await CredentialsService.get_all_ip_and_snmp()
            interface_dicts_list = await DevicesRepo.get_interface_data()
            
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
                    
                            await DevicesRepo.update_mbps(interface_data["ip_address"], interface_data["mbps_received"], interface_data["mbps_sent"])
                            print(f"Updated Mbps for {interface_data.get('ip_address')}")
        except Exception as e:
            print(f"Error updating Mbps SNMP: {e}")


    @staticmethod
    async def update_mbps_loop_snmp(mbps_interval: float) -> None:
        while True:
            await DeviceService.update_mbps_snmp()
            await asyncio.sleep(mbps_interval)




#""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODS""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""" 
   
    @staticmethod
    async def periodic_refresh_cli(device_interval: float) -> None:
        """
        Periodically refresh all devices via CLI at the specified interval.
        Only devices with complete CLI credentials are updated.
        """
        while True:
            try:
                creds = await CredentialsService.get_all_cred()
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
            device_type = cred.get("device_type")  # Extract device type from credentials
            ip = cred.get("ip")
            
            connection = ConnectionService.connect(cred)
            
            if not connection:
                    await DevicesRepo.flag_device_inactive(mac_address)
                    return {"success": False, "reason": f"Failed to connect to device {ip}"}
            if "cisco" in cred["device_type"]:
                outputs = ConnectionService.get_cisco_outputs_cli(connection, cred["device_type"])
                
                if outputs is None:
                    connection.disconnect()
                    print(f"Failed to get CLI outputs from device {ip}")
                    return {"success": False, "reason": f"Failed to get CLI outputs from device {ip}"}
                    
                hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date = outputs
                
                # Capture configuration before disconnecting
                config_output = ConnectionService.get_cisco_config(connection, cred["device_type"])
                
                # Close the connection
                connection.disconnect()
                
                extraction_result = ExtractionService.extract_cisco_cli(
                    cred["device_type"], 
                    hostname_output, 
                    ip_output, 
                    mac_output, 
                    info_neighbors_output,
                    all_interfaces_output
                )
                if extraction_result is None:
                    print(f"Failed to extract CLI data from device {ip}")
                    return {"success": False, "reason": f"Failed to extract CLI data from device {ip}"}
                    
                extracted_mac, hostname, interface_data, info_neighbors = extraction_result
                
                # Save to database with device_type
                await DevicesRepo.save_info(extracted_mac, hostname, interface_data, last_updated, raw_date, device_type, info_neighbors)
                
                # Save configuration to database
                if config_output:
                    try:
                        normalized_new_config = await DeviceService.normalize_config(config_output)
                        normalized_old_config = await DeviceService.normalize_config((await DeviceService.get_current_config(ip))["configuration"])

                        # Only save if the configuration changed
                        if normalized_new_config != normalized_old_config:

                            await ConfigRepo.save_config(extracted_mac, config_output, datetime.now())
                            print(f"Successfully saved configuration for device {extracted_mac}")
                    except Exception as e:
                        print(f"Warning: Failed to save configuration for device {extracted_mac}: {e}")
                

            elif "juniper" in cred["device_type"]:
                outputs = ConnectionService.get_juniper_outputs_cli(connection, cred["device_type"])

                if outputs is None:
                    connection.disconnect()
                    print(f"Failed to get CLI outputs from device {ip}")
                    return {"success": False, "reason": f"Failed to get outputs from device {ip}"}
                    
                hostname_output, ip_output, mac_output, all_interfaces_output, last_updated, raw_date = outputs
                
                # Capture configuration before disconnecting
                config_output = ConnectionService.get_juniper_config(connection, cred["device_type"])
                
                # Close the connection
                connection.disconnect()
                
                extraction_result = ExtractionService.extract_juniper_cli(
                    cred["device_type"], 
                    hostname_output, 
                    ip_output, 
                    mac_output,
                    all_interfaces_output
                )
                if extraction_result is None:
                    print(f"Failed to extract CLI data from device {ip}")
                    return {"success": False, "reason": f"Failed to extract CLI data from device {ip}"}
                    
                extracted_mac, hostname, interface_data = extraction_result
                
                # Save to database with device_type
                await DevicesRepo.save_info(extracted_mac, hostname, interface_data, last_updated, raw_date, device_type)
                
                # Save configuration to database
                if config_output:
                    try:
                        normalized_new_config = await DeviceService.normalize_config(config_output)
                        normalized_old_config = await DeviceService.normalize_config((await DeviceService.get_current_config(ip))["configuration"])

                        # Only save if the configuration changed
                        if normalized_new_config != normalized_old_config:
                            
                            await ConfigRepo.save_config(extracted_mac, config_output, datetime.now())
                            print(f"Successfully saved configuration for device {extracted_mac}")
                    except Exception as e:
                        print(f"Warning: Failed to save configuration for device {extracted_mac}: {e}")

            if connection:
                try:
                    connection.disconnect()
                except Exception:
                    pass
            
            return {"success": True}
            
        except Exception as e:
            print(f"Error updating device CLI {ip or 'unknown'}: {e}")
            if mac_address:
                await DevicesRepo.flag_device_inactive(mac_address)
            return {"success": False, "reason": f"Error updating device CLI {ip or 'unknown'}: {e}"}


    @staticmethod
    async def update_mbps_loop_cli(mbps_interval: float) -> None:
        """
        Continuously update bandwidth metrics for all CLI-managed devices at the specified interval.
        """
        while True:
            try:
                creds = await CredentialsService.get_all_cred()
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
                    
                await DevicesRepo.update_bandwidth_cli(cred['ip'], all_interfaces_data)
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
