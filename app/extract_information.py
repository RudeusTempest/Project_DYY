import re
from datetime import datetime

def parse_device_data(net_connect):
    hostname_output = net_connect.send_command("show running-config | include hostname")
    ip_output = net_connect.send_command("show ip interface brief")

    interface_output = re.match(r"(\S+)\s+", ip_output.splitlines()[1:2].pop())
    if interface_output:
        interface_0 = interface_output.group(1)
    else:
        interface_0 = "Not found"

    mac_output = net_connect.send_command(f"show interfaces {interface_0} | include address")
    last_updated = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    mac_match = re.search(r"address is ([\w\.]+)", mac_output)
    if mac_match:
        mac_address = mac_match.group(1)
    else:
        mac_address = "Not found"

    hostname_match = re.search(r"hostname\s+(\S+)", hostname_output)
    if hostname_match:
        hostname = hostname_match.group(1)
    else:
        hostname = "Hostname not found"

    interface_data = []
    for line in ip_output.splitlines()[1:]:
        # Example line: Ethernet0/0     192.170.0.74   YES manual up 
        match = re.match(r"(\S+)\s+(\S+)\s+\S+\s+\S+\s+(\S+)\s+(\S+)", line)
        if match:
            interface_name = match.group(1)
            ip = match.group(2)
            status = match.group(3)
            protocol = match.group(4)
            interface_data.append({
                "interface": interface_name,
                "ip_address": ip,
                "status": f"{status}/{protocol}"
            })

    return {
            "Mac": mac_address,
            "hostname": hostname,
            "interface": interface_data,
            "last_updated": last_updated
        }

 

        