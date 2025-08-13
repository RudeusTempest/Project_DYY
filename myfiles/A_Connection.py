from netmiko import ConnectHandler
from datetime import datetime
import re

def connect(device):
    # Connecting to the router
    net_connect = ConnectHandler(**device)
    net_connect.enable()
    return net_connect

def get_outputs(net_connect):
    # Getting commands outputs
    hostname_output = net_connect.send_command("show running-config | include hostname")
    ip_output = net_connect.send_command("show ip interface brief")

    interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[1:2].pop())
    if interface_output:
        interface_0 = interface_output.group(1)
    else: interface_0 = "Not found"    

    mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
    last_updated = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    # Close the connection
    net_connect.disconnect()

    return hostname_output, ip_output, mac_output, last_updated