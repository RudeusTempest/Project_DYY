from netmiko import ConnectHandler 
from datetime import datetime
import re


def connect(device_cred):
    try:
        # Connecting to the router
        net_connect = ConnectHandler(**device_cred)
        return net_connect
    except:
        print("Connection failed")


def get_outputs(net_connect, device_type):

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
    

    # if device_type == "cisco_xr":


    # if device_type == "junipersrx":


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