import re


def extract(hostname_output, ip_output, mac_output):
    # Extracting the details
    mac_match = re.search(r"address is ([\w\.]+)", mac_output)
    if mac_match:
        mac_address = mac_match.group(1)
    else: mac_address = "Not found" 


    hostname_match = re.search(r"hostname\s+(\S+)", hostname_output)
    if hostname_match:
        hostname = hostname_match.group(1)
    else: hostname = "Hostname not found"     


    interface_data = []
    for line in ip_output.splitlines()[1:]:
        # Example line: Ethernet0/0     192.170.0.74   YES manual up                    up
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

    return hostname, interface_data, mac_address