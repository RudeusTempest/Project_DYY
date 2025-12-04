from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
from datetime import datetime
import re 
from pysnmp.hlapi.v3arch.asyncio import get_cmd, bulk_cmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity
import asyncio
from typing import Optional, Dict, Tuple, Any


class ConnectionService:

    snmp_engines_dict: Dict[str, SnmpEngine] = {}
    @staticmethod
    def get_snmp_engine(ip: str) -> SnmpEngine:
        # Get or create a dedicated SnmpEngine for each device.
        if ip not in ConnectionService.snmp_engines_dict:
            ConnectionService.snmp_engines_dict[ip] = SnmpEngine()
        return ConnectionService.snmp_engines_dict[ip]
    

    @staticmethod
    async def get_snmp(ip: str, snmp_password: str, oid: str) -> Optional[Any]:
        try:
            # Perform SNMP GET request
            errorIndication, errorStatus, errorIndex, varBinds = await get_cmd(
                ConnectionService.get_snmp_engine(ip),
                CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
                await UdpTransportTarget.create((ip, 161)),
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )

            if errorIndication:
                print(f"SNMP error indication for {ip}: {errorIndication}")
                return None
            
            if errorStatus:
                print(f'SNMP error status for {ip}: {errorStatus.prettyPrint()} at {errorIndex}')
                return None

            return varBinds[0][1]  # Return the value of the OID (varbinds = [(oid, value)])
        except Exception as e:
            print(f"Exception during SNMP GET for {ip}: {e}")
            return None


    @staticmethod
    async def get_interfaces_indexes(ip: str, snmp_password: Optional[str]) -> Optional[Dict[str, str]]:
        if snmp_password is None:
            print(f"No SNMP password provided for device {ip}")
            return None
        
        try:
            # Perform SNMP BULK request - stop at end of ifDescr table (1.3.6.1.2.1.2.2.1.2)
            # We need to use a lower max-repetitions to avoid walking into the next OID tree
            errorIndication, errorStatus, errorIndex, varBinds = await bulk_cmd(
                ConnectionService.get_snmp_engine(ip),
                CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
                await UdpTransportTarget.create((ip, 161)),
                ContextData(),
                0, 10,  # Reduced max-repetitions to avoid walking too far
                ObjectType(ObjectIdentity("1.3.6.1.2.1.2.2.1.2"))  # ifDescr OID
            )

            if errorIndication:
                print(f"SNMP error indication for {ip}: {errorIndication}")
                return None
            
            if errorStatus:
                print(f'SNMP error status for {ip}: {errorStatus.prettyPrint()} at {errorIndex}')
                return None

            interface_indexes = {}
            base_oid = "1.3.6.1.2.1.2.2.1.2"  # ifDescr base OID
            
            # List of interface types to skip (null, loopback, etc.)
            skip_patterns = ['null', 'loopback', 'lo']
            
            for varBind in varBinds:
                oid, name = varBind
                oid_str = str(oid)
                
                # Only process if this OID is within the ifDescr table
                # Stop if we've walked into a different table
                if not oid_str.startswith(base_oid):
                    print(f"Stopping bulk walk - reached end of ifDescr table at OID: {oid_str}")
                    break
                
                # Extract the interface index from OID (last octet)
                interface_index = oid_str.split('.')[-1]
                interface_name = str(name).strip()
                
                # Filter out invalid interface names:
                # - Must be non-empty
                # - Should not be pure numbers (these are garbled SNMP values)
                # - Should contain at least one letter or common interface patterns
                if not interface_name or interface_name.isdigit():
                    print(f"Skipping invalid interface name: '{interface_name}'")
                    continue
                
                # Additional filter: skip if it only contains special characters or control characters
                # Check for excessive non-printable characters
                printable_count = sum(1 for c in interface_name if c.isprintable())
                if printable_count < len(interface_name) * 0.7:  # Less than 70% printable
                    print(f"Skipping invalid interface name (non-printable): '{interface_name}'")
                    continue
                
                if not any(c.isalnum() for c in interface_name):
                    print(f"Skipping invalid interface name (no alphanumeric): '{interface_name}'")
                    continue
                
                # Skip null, loopback, and similar non-physical interfaces
                if any(pattern in interface_name.lower() for pattern in skip_patterns):
                    print(f"Skipping non-physical interface: '{interface_name}'")
                    continue
                
                interface_indexes[interface_name] = interface_index
                print(f"Found interface: {interface_name} (index: {interface_index})")

            return interface_indexes if interface_indexes else None  # Return a dictionary of interface names and their indexes
        except Exception as e:
            print(f"Exception during SNMP BULK for {ip}: {e}")
            return None
    

    @staticmethod
    async def get_max_speed(ip: str, snmp_password: str, interface_index: str) -> Optional[int]:
        try:
            max_speed_oid = f'1.3.6.1.2.1.31.1.1.1.15.{interface_index}'  # ifHighSpeed (in Mbps)
            max_speed = await ConnectionService.get_snmp(ip, snmp_password, max_speed_oid)
            if max_speed is None:
                return None
            return int(max_speed)
        except (ValueError, TypeError) as e:
            print(f"Error converting max_speed to int for {ip}: {e}")
            return None


    @staticmethod
    async def get_device_byte_counters(ip: str, snmp_password: str, interface_index: str) -> Optional[Tuple[int, int]]:
        try:
            bytes_received_oid = f'1.3.6.1.2.1.31.1.1.1.6.{interface_index}'  # ifHCInOctets
            bytes_sent_oid = f'1.3.6.1.2.1.31.1.1.1.10.{interface_index}'  # ifHCOutOctets

            bytes_received_raw = await ConnectionService.get_snmp(ip, snmp_password, bytes_received_oid)
            bytes_sent_raw = await ConnectionService.get_snmp(ip, snmp_password, bytes_sent_oid)
            
            if bytes_received_raw is None or bytes_sent_raw is None:
                print(f"Failed to get byte counters for {ip}")
                return None
            
            bytes_received = int(bytes_received_raw)
            bytes_sent = int(bytes_sent_raw)
            
            return bytes_received, bytes_sent
        except (ValueError, TypeError) as e:
            print(f"Error converting byte counters to int for {ip}: {e}")
            return None


    @staticmethod
    async def get_mbps(ip: str, snmp_password: str, interface_index: str) -> Optional[Tuple[float, float]]:
        try:
            counters1 = await ConnectionService.get_device_byte_counters(ip, snmp_password, interface_index)
            if counters1 is None:
                return None
            
            bytes_received1, bytes_sent1 = counters1

            await asyncio.sleep(1)  # Wait for 1 second to get the difference in bytes

            counters2 = await ConnectionService.get_device_byte_counters(ip, snmp_password, interface_index)
            if counters2 is None:
                return None
            
            bytes_received2, bytes_sent2 = counters2

            bytes_received = bytes_received2 - bytes_received1
            bytes_sent = bytes_sent2 - bytes_sent1
            
            megabits_received_per_second = (bytes_received * 8) / (1_000_000 * 1)  # multiplied by 8 to convert to bits 
            megabits_sent_per_second = (bytes_sent * 8) / (1_000_000 * 1)  # multiplied by 8 to convert to bits
    
            return megabits_received_per_second, megabits_sent_per_second
        except Exception as e:
            print(f"Error calculating Mbps for {ip}: {e}")
            return None


    @staticmethod
    async def get_hostname(ip: str, snmp_password: str) -> Optional[str]:
        """Fetch device hostname using SNMP sysName OID (1.3.6.1.2.1.1.5.0)"""
        try:
            hostname = await ConnectionService.get_snmp(ip, snmp_password, "1.3.6.1.2.1.1.5.0")  # sysName
            if hostname is None:
                return None
            return str(hostname)
        except Exception as e:
            print(f"Error getting hostname for {ip}: {e}")
            return None


    @staticmethod
    async def get_mac_address(ip: str, snmp_password: str, interface_index: str) -> Optional[str]:
        """Fetch MAC address using SNMP ifPhysAddress OID (1.3.6.1.2.1.2.2.1.6.{index})"""
        try:
            mac_raw = await ConnectionService.get_snmp(ip, snmp_password, f"1.3.6.1.2.1.2.2.1.6.{interface_index}")  # ifPhysAddress
            if mac_raw is None:
                return None
            # Convert to string representation and handle different formats
            mac_str = str(mac_raw)
            # If it's a hex string or bytes representation, convert properly
            try:
                # Try to interpret as hex string if it starts with 0x
                if mac_str.startswith('0x'):
                    mac_bytes = bytes.fromhex(mac_str[2:])
                else:
                    # Otherwise treat as raw bytes
                    mac_bytes = mac_raw if isinstance(mac_raw, bytes) else mac_str.encode('latin-1')
                mac_address = ":".join(f"{byte:02x}" for byte in mac_bytes)
                return mac_address
            except Exception:
                # Fallback: return as-is if conversion fails
                return mac_str
        except Exception as e:
            print(f"Error getting MAC address for {ip}: {e}")
            return None


    @staticmethod
    async def get_system_mac(ip: str, snmp_password: str) -> Optional[str]:
        """Fetch system/chassis MAC address using SNMP
        Tries multiple OIDs to find the device's system MAC (not interface MAC)
        """
        try:
            # Try common OIDs for system MAC in order of preference
            system_mac_oids = [
                "1.3.6.1.2.1.2.2.1.6.0",        # Try interface 0 first
                "1.3.6.1.4.1.9.2.1.58.0",       # Cisco system MAC
                "1.3.6.1.2.1.1.9.3.3.2.1.6.6.0", # Cisco sysUptime alternative
            ]
            
            for oid in system_mac_oids:
                mac_raw = await ConnectionService.get_snmp(ip, snmp_password, oid)
                if mac_raw is None:
                    continue
                
                # Convert to string representation
                mac_str = str(mac_raw)
                try:
                    # Try to interpret as hex string if it starts with 0x
                    if mac_str.startswith('0x'):
                        mac_bytes = bytes.fromhex(mac_str[2:])
                    else:
                        # Otherwise treat as raw bytes
                        mac_bytes = mac_raw if isinstance(mac_raw, bytes) else mac_str.encode('latin-1')
                    
                    # Validate it looks like a MAC (6 bytes)
                    if len(mac_bytes) == 6:
                        mac_address = ":".join(f"{byte:02x}" for byte in mac_bytes)
                        print(f"Found system MAC from OID {oid}: {mac_address}")
                        return mac_address
                except Exception:
                    continue
            
            # If all OIDs failed, fall back to getting MAC from the first interface
            print("Could not fetch system MAC from standard OIDs, using first interface MAC")
            return None
        except Exception as e:
            print(f"Error getting system MAC for {ip}: {e}")
            return None



    @staticmethod
    async def get_interface_index_to_ip_mapping(ip: str, snmp_password: str) -> Optional[Dict[str, str]]:
        """Map interface indexes to their IP addresses using IP-MIB table"""
        try:
            # Query ipAdEntIfIndex (1.3.6.1.2.1.4.20.1.2) which maps IPs to interface indexes
            # OID format: 1.3.6.1.2.1.4.20.1.2.a.b.c.d where a.b.c.d is the IP, value is the interface index
            errorIndication, errorStatus, errorIndex, varBinds = await bulk_cmd(
                ConnectionService.get_snmp_engine(ip),
                CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
                await UdpTransportTarget.create((ip, 161)),
                ContextData(),
                0, 25,
                ObjectType(ObjectIdentity("1.3.6.1.2.1.4.20.1.2"))  # ipAdEntIfIndex
            )

            if errorIndication:
                print(f"SNMP error indication for IP-MIB for {ip}: {errorIndication}")
                return None
            
            if errorStatus:
                print(f'SNMP error status for IP-MIB for {ip}: {errorStatus.prettyPrint()} at {errorIndex}')
                return None

            index_to_ip = {}
            
            for varBind in varBinds:
                oid, if_index = varBind
                oid_str = str(oid)
                
                # Only process IPs in the ipAdEntIfIndex table
                # OID: 1.3.6.1.2.1.4.20.1.2.x.x.x.x (where x.x.x.x is the IP)
                if not oid_str.startswith("1.3.6.1.2.1.4.20.1.2"):
                    break  # Stop when we exit the IP-MIB table
                
                # Extract IP address from OID (last 4 octets)
                oid_parts = oid_str.split('.')
                if len(oid_parts) >= 11:  # 1.3.6.1.2.1.4.20.1.2 = 9 parts + 4 IP octets = 13 minimum
                    ip_address = '.'.join(oid_parts[-4:])
                    interface_index = str(if_index)
                    
                    # Only store if we got a valid interface index (should be numeric)
                    if interface_index.isdigit():
                        index_to_ip[interface_index] = ip_address
                        print(f"Mapped interface index {interface_index} -> IP {ip_address}")

            return index_to_ip if index_to_ip else None
        except Exception as e:
            print(f"Exception during interface index to IP mapping for {ip}: {e}")
            return None


    @staticmethod
    async def get_interface_ips(ip: str, snmp_password: str) -> Optional[Dict[str, str]]:
        """Fetch interface IP addresses using SNMP IP-MIB table"""
        try:
            # Query IP address table (1.3.6.1.2.1.4.20.1.1) - ipAdEntAddr
            errorIndication, errorStatus, errorIndex, varBinds = await bulk_cmd(
                ConnectionService.get_snmp_engine(ip),
                CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
                await UdpTransportTarget.create((ip, 161)),
                ContextData(),
                0, 25,
                ObjectType(ObjectIdentity("1.3.6.1.2.1.4.20.1.1"))  # ipAdEntAddr
            )

            if errorIndication:
                print(f"SNMP error indication for {ip}: {errorIndication}")
                return None
            
            if errorStatus:
                print(f'SNMP error status for {ip}: {errorStatus.prettyPrint()} at {errorIndex}')
                return None

            interface_ips = {}
            for varBind in varBinds:
                oid, value = varBind
                # OID format: 1.3.6.1.2.1.4.20.1.1.a.b.c.d where a.b.c.d is the IP address
                # Extract IP from OID, not from the value (which can be garbled)
                oid_parts = str(oid).split('.')
                if len(oid_parts) >= 11:  # 1.3.6.1.2.1.4.20.1.1.a.b.c.d = 11 parts
                    ip_address = '.'.join(oid_parts[-4:])
                    interface_ips[ip_address] = ip_address

            return interface_ips if interface_ips else None
        except Exception as e:
            print(f"Exception during SNMP interface IPs fetch for {ip}: {e}")
            return None


    @staticmethod
    async def get_interface_status(ip: str, snmp_password: str, interface_index: str) -> Optional[str]:
        """Fetch interface operational status using SNMP ifOperStatus OID (1.3.6.1.2.1.2.2.1.8.{index})"""
        try:
            status_raw = await ConnectionService.get_snmp(ip, snmp_password, f"1.3.6.1.2.1.2.2.1.8.{interface_index}")  # ifOperStatus
            if status_raw is None:
                return None
            status_code = int(status_raw)
            # Status codes: 1=up, 2=down, 3=testing
            status_map = {1: "up", 2: "down", 3: "testing"}
            return status_map.get(status_code, "unknown")
        except Exception as e:
            print(f"Error getting interface status for {ip}: {e}")
            return None


    @staticmethod
    async def get_interface_admin_status(ip: str, snmp_password: str, interface_index: str) -> Optional[str]:
        """Fetch interface administrative status using SNMP ifAdminStatus OID (1.3.6.1.2.1.2.2.1.7.{index})"""
        try:
            status_raw = await ConnectionService.get_snmp(ip, snmp_password, f"1.3.6.1.2.1.2.2.1.7.{interface_index}")  # ifAdminStatus
            if status_raw is None:
                return None
            status_code = int(status_raw)
            # Status codes: 1=up, 2=down, 3=testing
            status_map = {1: "up", 2: "down", 3: "testing"}
            return status_map.get(status_code, "unknown")
        except Exception as e:
            print(f"Error getting interface admin status for {ip}: {e}")
            return None


#""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

    @staticmethod
    def connect(device_cred: dict) -> Optional[Any]:
        
        try:
            # Map credentials to Netmiko ConnectHandler format
            netmiko_params = {
                "device_type": device_cred.get("device_type"),
                "host": device_cred.get("ip"),  
                "username": device_cred.get("username"),
                "password": device_cred.get("password"),
            }
            
            # Add optional secret if provided
            if device_cred.get("secret"):
                netmiko_params["secret"] = device_cred.get("secret")
            
            # Add connection timeout and retries
            netmiko_params["timeout"] = 30  # 30 second timeout
            netmiko_params["conn_timeout"] = 30
            
            # Connecting to the router
            net_connect = ConnectHandler(**netmiko_params)
            
            print("Connection successful", device_cred.get('ip', 'unknown'))
            return net_connect
        except NetmikoTimeoutException:
            print(f"Connection timeout to device {device_cred.get('ip', 'unknown')} - device not responding")
            return None
        except NetmikoAuthenticationException:
            print(f"Authentication failed for device {device_cred.get('ip', 'unknown')} - check credentials")
            return None
        except Exception as e:
            print(f"Failed to connect to device {device_cred.get('ip', 'unknown')}: {str(e)}")
            return None
        
        
    @staticmethod
    def get_cisco_mbps_output(net_connect: Any, device_type: str) -> Optional[str]:
        try:
            if device_type in ["cisco_ios", "cisco_xr"]:
                all_interfaces_output = net_connect.send_command("show interfaces")
                return all_interfaces_output
            return None
        except Exception as e:
            print(f"Error getting Cisco Mbps output for {device_type}: {e}")
            return None
        

    @staticmethod
    def get_juniper_mbps_output(net_connect: Any, device_type: str) -> Optional[str]:
        try:
            if device_type == "juniper_junos":
                all_interfaces_output = net_connect.send_command("show interfaces extensive")
                return all_interfaces_output
            return None
        except Exception as e:
            print(f"Error getting Juniper Mbps output for {device_type}: {e}")
            return None
        

    @staticmethod
    def get_cisco_outputs_cli(net_connect: Any, device_type: str) -> Optional[Tuple[str, str, str, str, str, str, datetime]]:
        try:
            if device_type == "cisco_ios":
                # Enter enable mode
                net_connect.enable()

                # Get command outputs
                hostname_output = net_connect.send_command("show running-config | include hostname")
                ip_output = net_connect.send_command("show ip interface brief")

                # Get the first interface from the second line of output
                lines = ip_output.splitlines()[1:2]
                if not lines:
                    print(f"No interface data found for {device_type}")
                    return None
                    
                interface_output = re.match(r"(\S+)\s+", lines[0])
                interface_0 = interface_output.group(1) if interface_output else "Not found"

                mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
                
                # Get detailed output for ALL interfaces (for bandwidth extraction)
                all_interfaces_output = net_connect.send_command("show interfaces")
                
                raw_date = datetime.now()
                last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

                info_neighbors_output = net_connect.send_command("show cdp neighbors")

                return hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date


            if device_type == "cisco_xr":

                # Get command outputs
                hostname_output = net_connect.send_command("show running-config | include hostname")
                ip_output = net_connect.send_command("show ip interface brief")

                # Get the first interface from the fourth line of output (XR differs from IOS)
                lines = ip_output.splitlines()[4:5]
                if not lines:
                    print(f"No interface data found for {device_type}")
                    return None
                    
                interface_output = re.match(r"(\S+)\s+", lines[0])
                interface_0 = interface_output.group(1) if interface_output else "Not found"

                mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
                
                # Get detailed output for ALL interfaces (for bandwidth extraction)
                all_interfaces_output = net_connect.send_command("show interfaces")
                
                raw_date = datetime.now()
                last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

                info_neighbors_output = net_connect.send_command("show cdp neighbors")

                return hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date
        except Exception as e:
            print(f"Error getting Cisco CLI outputs for {device_type}: {e}")
            return None


    @staticmethod
    def get_juniper_outputs_cli(net_connect: Any, device_type: str) -> Optional[Tuple[str, str, str, str, str, datetime]]:
        try:
            if device_type == "juniper_junos":
                
                # Enter CLI mode
                net_connect.send_command("cli")

                # Disable pagination
                net_connect.send_command("set cli screen-length 0")
                
                # Get command outputs
                hostname_output = net_connect.send_command("show configuration system host-name")
                ip_output = net_connect.send_command("show interfaces terse")

                lines = ip_output.splitlines()[1:2]
                if not lines:
                    print(f"No interface data found for {device_type}")
                    return None
                    
                interface_output = re.match(r"(\S+)\s+", lines[0])
                interface_0 = interface_output.group(1) if interface_output else "Not found"

                mac_output = net_connect.send_command(f"show interfaces {interface_0} | match Hardware")
                
                # Get detailed output for ALL interfaces (for bandwidth extraction)
                all_interfaces_output = net_connect.send_command("show interfaces extensive")
                
                raw_date = datetime.now()
                last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

                return hostname_output, ip_output, mac_output, all_interfaces_output, last_updated, raw_date
        except Exception as e:
            print(f"Error getting Juniper CLI outputs for {device_type}: {e}")
            return None
