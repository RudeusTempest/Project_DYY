import re
from typing import List, Dict, Any


def extract_mac(output: str, pattern: str = r"address is ([\w\.]+)") -> str:
    match = re.search(pattern, output)
    return match.group(1) if match else "Not found"


def extract_hostname(output: str, pattern: str = r"hostname\s+(\S+)") -> str:
    match = re.search(pattern, output)
    return match.group(1) if match else "Hostname not found"


def extract_interface_data_cisco(ip_output: str, start_line: int = 1) -> List[Dict[str, str]]:
    interface_data = []
    for line in ip_output.splitlines()[start_line:]:
        match = re.match(r"(\S+)\s+(\S+)\s+\S+\s+\S+\s+(\S+)\s+(\S+)", line)
        if match:
            interface_name = match.group(1)
            ip = match.group(2)
            status = match.group(3)
            protocol = match.group(4)
            interface_data.append({
                "interface": interface_name,
                "ip_address": ip,
                "status": f"{status}/{protocol}",
            })
    return interface_data