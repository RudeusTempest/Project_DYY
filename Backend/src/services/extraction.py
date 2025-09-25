import re


def extract(device_type, hostname_output, ip_output, mac_output):

    if device_type == "cisco_ios":

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

        return mac_address, hostname, interface_data
    

    # if device_type == "cisco_xr":


    # if device_type == "junipersrx":


    if device_type == "juniper_junos":

        # Extracting the details
        mac_match = re.search(r"Hardware address: (\S+)", mac_output)
        if mac_match:
            mac_address = mac_match.group(1)
        else: mac_address = "Not found" 


        hostname_match = re.search(r"host-name\s+(\S+);", hostname_output)
        if hostname_match:
            hostname = hostname_match.group(1)
        else: hostname = "Hostname not found"     


        interface_data = []

        for line in ip_output.splitlines()[1:]:
            # Skip empty lines
            if not line.strip():
                continue

            # Regex to match interface + optional protocol + IP + optional remote IP
            # Example: sp-0/0/0.16383          up    up   inet     10.0.0.1  
            match = re.match(
                r'^(\S+)\s+(\S+)\s+(\S+)(?:\s+(\S+)\s+([\d\.\/]+)(?:\s+-->\s+([\d\.\/]+))?)?', line
            )

            if match:
                interface_name = match.group(1)
                admin_status = match.group(2)
                link_status = match.group(3)
                protocol = match.group(4) if match.group(4) else "Unassigned"
                ip_address = match.group(5) if match.group(5) else "Unassigned"
                remote_ip = match.group(6) if match.group(6) else None


                interface_data.append({
                    "Interface": interface_name,
                    "Status": f"{admin_status}/{link_status}",
                    "Protocol": protocol,
                    "IP_Address": ip_address,
                    "Remote IP": remote_ip
                })

        return mac_address, hostname, interface_data
