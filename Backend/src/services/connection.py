from netmiko import ConnectHandler 
from datetime import datetime
import re 
from pysnmp.hlapi.v3arch.asyncio import get_cmd, bulk_cmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity
import asyncio


class ConnectionService:

    @staticmethod
    def connect(device_cred):
        try:
            # Connecting to the router
            net_connect = ConnectHandler(**device_cred)
            print("Connection successful")
            return net_connect
        except:
            print("Connection failed")


    @staticmethod
    def get_cisco_outputs(net_connect, device_type):

        if device_type == "cisco_ios":
            # Entering enable mode
            # net_connect.enable()

            # Getting commands outputs
            hostname_output = net_connect.send_command("show running-config | include hostname")
            ip_output = net_connect.send_command("show ip interface brief")

            # Getting the first interface from the second line of the output
            interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[1:2].pop())
            if interface_output:
                interface_0 = interface_output.group(1)
            else: interface_0 = "Not found"    

            mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
            raw_date = datetime.now()
            last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

            info_neighbors_output = net_connect.send_command("show cdp neighbors")
            # Close the connection
            net_connect.disconnect()

            return hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date
    

        if device_type == "cisco_xr":

            # Getting commands outputs
            hostname_output = net_connect.send_command("show running-config | include hostname")
            ip_output = net_connect.send_command("show ip interface brief")

            # Getting the first interface from the second line of the output
            interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[4:5].pop())
            if interface_output:
                interface_0 = interface_output.group(1)
            else: interface_0 = "Not found"    

            mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
            raw_date = datetime.now()
            last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

            info_neighbors_output = net_connect.send_command("show cdp neighbors")
            # Close the connection
            net_connect.disconnect()

            return hostname_output, ip_output, mac_output, info_neighbors_output, last_updated, raw_date


    @staticmethod
    def get_juniper_outputs(net_connect, device_type):

        if device_type == "juniper_junos":
            # Entering cli mode
            net_connect.send_command("cli")
            # Disabling pagination
            net_connect.send_command("set cli screen-length 0")
            
            # Getting commands outputs
            hostname_output = net_connect.send_command("show configuration system host-name")
            ip_output = net_connect.send_command("show interfaces terse")

            interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[1:2].pop())
            if interface_output:
                interface_0 = interface_output.group(1)
            else: interface_0 = "Not found"    

            mac_output = net_connect.send_command(f"show interfaces {interface_0} | match Hardware")
            raw_date = datetime.now()
            last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

            # Close the connection
            net_connect.disconnect()

            return hostname_output, ip_output, mac_output, last_updated, raw_date
    

    snmp_engines_dict = {}
    @staticmethod
    def get_snmp_engine(ip: str):
        # Get or create a dedicated SnmpEngine for each device.
        if ip not in ConnectionService.snmp_engines_dict:
            ConnectionService.snmp_engines_dict[ip] = SnmpEngine()
        return ConnectionService.snmp_engines_dict[ip]
    

    @staticmethod
    async def get_snmp(ip : str, snmp_password : str, oid : str):
        # Perform SNMP GET request
        errorIndication, errorStatus, errorIndex, varBinds = await get_cmd(
        ConnectionService.get_snmp_engine(ip),
        CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
        await UdpTransportTarget.create((ip, 161)),
        ContextData(),
        ObjectType(ObjectIdentity(oid))
        )

        if errorIndication:
            print(errorIndication)
            return None
        
        if errorStatus:
            print(f'{errorStatus.prettyPrint()} at {errorIndex}')
            return None


        return varBinds[0][1]  # Return the value of the OID (varbinds = [(oid, value)])


    @staticmethod
    async def get_interfaces_indexes(ip : str, snmp_password : str | None):
        if snmp_password is None:
            print(f"No SNMP password provided for device {ip}")
            return None
        # Perform SNMP GET request
        errorIndication, errorStatus, errorIndex, varBinds = await bulk_cmd(
        ConnectionService.get_snmp_engine(ip),
        CommunityData(snmp_password, mpModel=1, securityName=f"area-{ip}"),
        await UdpTransportTarget.create((ip, 161)),
        ContextData(),
        0, 25,
        ObjectType(ObjectIdentity("1.3.6.1.2.1.2.2.1.2")) # ifDescr OID
        )

        if errorIndication:
            print(errorIndication)
            return None
        
        if errorStatus:
            print(f'{errorStatus.prettyPrint()} at {errorIndex}')
            return None

        interface_indexes = {}
        for varBind in varBinds:
            oid, name = varBind
            interface_index = str(oid).split('.')[-1] 
            interface_indexes[str(name)] = interface_index

        return interface_indexes # Return a dictionary of interface names and their indexes {GigabitEthernet0/0/0/0: '1', ...}
    

    @staticmethod
    async def get_max_speed(ip : str, snmp_password : str, interface_index : str):
        max_speed_oid = f'1.3.6.1.2.1.31.1.1.1.15.{interface_index}'  # ifHighSpeed (in Mbps)
        max_speed = await ConnectionService.get_snmp(ip, snmp_password, max_speed_oid)
        if max_speed is None:
            return None
        return int(max_speed)


    @staticmethod
    async def get_device_byte_counters(ip : str, snmp_password : str, interface_index : str):
        bytes_received_oid = f'1.3.6.1.2.1.31.1.1.1.6.{interface_index}'  # ifHCInOctets
        bytes_sent_oid = f'1.3.6.1.2.1.31.1.1.1.10.{interface_index}'  # ifHCOutOctets

        bytes_received = int(await ConnectionService.get_snmp(ip, snmp_password, bytes_received_oid))
        bytes_sent = int(await ConnectionService.get_snmp(ip, snmp_password, bytes_sent_oid))
        
        return bytes_received, bytes_sent


    @staticmethod
    async def get_mbps(mbps_interval : float, ip : str, snmp_password : str, interface_index : str):

        bytes_received1, bytes_sent1 = await ConnectionService.get_device_byte_counters(ip, snmp_password, interface_index)

        await asyncio.sleep(mbps_interval)  # Wait for 1 second to get the difference in bytes

        bytes_received2, bytes_sent2 = await ConnectionService.get_device_byte_counters(ip, snmp_password, interface_index)

        bytes_received = bytes_received2 - bytes_received1
        bytes_sent = bytes_sent2 - bytes_sent1
         
        megabits_received_per_second = (bytes_received * 8) / (1_000_000 * 1) #multiplied by 8 to convert to bits 
        megabits_sent_per_second = (bytes_sent * 8) / (1_000_000 * 1) #multiplied by 8 to convert to bits
  
        return  megabits_received_per_second, megabits_sent_per_second

