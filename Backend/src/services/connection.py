from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
from datetime import datetime
import re 
from pysnmp.hlapi.v3arch.asyncio import get_cmd, bulk_cmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity
import asyncio
from typing import Optional, Dict, Tuple, Any


class ConnectionService:

    @staticmethod
    def connect(device_cred: dict) -> Optional[Any]:
        # print(device_cred)
        try:
            # Connecting to the router
            net_connect = ConnectHandler(**device_cred)
            
            print("Connection successful", device_cred.get('ip', 'unknown'))
            return net_connect
        except:
            print(f"Failed to connect to device {device_cred.get('ip', 'unknown')}")
            return None


    @staticmethod
    def get_cisco_outputs_snmp(net_connect: Any, device_type: str) -> Optional[Tuple[str, str, str, str, str, datetime]]:
        try:
            if device_type == "cisco_ios":
                

                return hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date
        

            if device_type == "cisco_xr":



                return hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date
        except Exception as e:
            print(f"Error getting Cisco outputs for {device_type}: {e}")
            return None


    @staticmethod
    def get_juniper_outputs(net_connect: Any, device_type: str) -> Optional[Tuple[str, str, str, str, datetime]]:
        try:
            if device_type == "juniper_junos":
                # Entering cli mode
                net_connect.send_command("cli")
                # Disabling pagination
                net_connect.send_command("set cli screen-length 0")
                
                # Getting commands outputs
                hostname_output = net_connect.send_command("show configuration system host-name")
                ip_output = net_connect.send_command("show interfaces terse")

                lines = ip_output.splitlines()[1:2]
                if not lines:
                    print(f"No interface data found for {device_type}")
                    return None
                    
                interface_output = re.match(r"(\S+)\s+", lines[0])
                interface_0 = interface_output.group(1) if interface_output else "Not found"

                mac_output = net_connect.send_command(f"show interfaces {interface_0} | match Hardware")
                raw_date = datetime.now()
                last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

                # Close the connection
                net_connect.disconnect()

                return hostname_output, ip_output, mac_output, last_updated, raw_date
        except Exception as e:
            print(f"Error getting Juniper outputs for {device_type}: {e}")
            return None
    

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
            # Perform SNMP BULK request
            errorIndication, errorStatus, errorIndex, varBinds = await bulk_cmd(
                ConnectionService.get_snmp_engine(ip),
                CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
                await UdpTransportTarget.create((ip, 161)),
                ContextData(),
                0, 25,
                ObjectType(ObjectIdentity("1.3.6.1.2.1.2.2.1.2"))  # ifDescr OID
            )

            if errorIndication:
                print(f"SNMP error indication for {ip}: {errorIndication}")
                return None
            
            if errorStatus:
                print(f'SNMP error status for {ip}: {errorStatus.prettyPrint()} at {errorIndex}')
                return None

            interface_indexes = {}
            for varBind in varBinds:
                oid, name = varBind
                interface_index = str(oid).split('.')[-1] 
                interface_indexes[str(name)] = interface_index

            return interface_indexes  # Return a dictionary of interface names and their indexes {GigabitEthernet0/0/0/0: '1', ...}
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




#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

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
                # Close connection
                # net_connect.disconnect()

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
                # Close connection
                # net_connect.disconnect()

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

                # Close connection
                # net_connect.disconnect()

                return hostname_output, ip_output, mac_output, all_interfaces_output, last_updated, raw_date
        except Exception as e:
            print(f"Error getting Juniper CLI outputs for {device_type}: {e}")
            return None
