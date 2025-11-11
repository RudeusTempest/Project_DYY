from netmiko import ConnectHandler 
from datetime import datetime
import re 



class ConnectionService:

    @staticmethod
    def connect(device_cred):
        try:
            # Connect to router/switch
            net_connect = ConnectHandler(**device_cred)
            return net_connect
        except Exception as e:
            print(f"Connection failed: {e}")
            return None




    @staticmethod
    def get_cisco_outputs(net_connect, device_type):

        if device_type == "cisco_ios":
            # Enter enable mode
            # net_connect.enable()

            # Get command outputs
            hostname_output = net_connect.send_command("show running-config | include hostname")
            ip_output = net_connect.send_command("show ip interface brief")

            # Get the first interface from the second line of output
            interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[1:2].pop())
            if interface_output:
                interface_0 = interface_output.group(1)
            else: interface_0 = "Not found"    

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
            interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[4:5].pop())
            if interface_output:
                interface_0 = interface_output.group(1)
            else: interface_0 = "Not found"    

            mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
            
            # Get detailed output for ALL interfaces (for bandwidth extraction)
            all_interfaces_output = net_connect.send_command("show interfaces")
            
            raw_date = datetime.now()
            last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

            info_neighbors_output = net_connect.send_command("show cdp neighbors")
            # Close connection
            # net_connect.disconnect()

            return hostname_output, ip_output, mac_output, info_neighbors_output, all_interfaces_output, last_updated, raw_date


    @staticmethod
    def get_juniper_outputs(net_connect, device_type):

        if device_type == "juniper_junos":
            # Enter CLI mode
            net_connect.send_command("cli")
            # Disable pagination
            net_connect.send_command("set cli screen-length 0")
            
            # Get command outputs
            hostname_output = net_connect.send_command("show configuration system host-name")
            ip_output = net_connect.send_command("show interfaces terse")

            interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[1:2].pop())
            if interface_output:
                interface_0 = interface_output.group(1)
            else: interface_0 = "Not found"    

            mac_output = net_connect.send_command(f"show interfaces {interface_0} | match Hardware")
            raw_date = datetime.now()
            last_updated = raw_date.strftime("%d-%m-%Y %H:%M:%S")

            # Close connection
            net_connect.disconnect()

            return hostname_output, ip_output, mac_output, last_updated, raw_date
        

    @staticmethod
    def get_cisco_outputs_mbps(net_connect, device_type):
        if device_type in ["cisco_ios", "cisco_xr"]:
            all_interfaces_output = net_connect.send_command("show interfaces")
            return all_interfaces_output

