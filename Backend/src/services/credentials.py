from src.repositories.postgres.credentials import CredentialsRepo
from src.models.api.credentials import device_cred
from src.services.connection import ConnectionService
from typing import Optional, List, Dict, Any
import re


class CredentialsService:

    @staticmethod
    def _get_first_interface_from_brief(ip_output: str) -> Optional[str]:
        for line in ip_output.splitlines()[1:]:
            match = re.match(r"(\S+)\s+", line)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def _get_first_interface_from_terse(ip_output: str) -> Optional[str]:
        for line in ip_output.splitlines()[1:]:
            if not line.strip():
                continue
            match = re.match(r"^(\S+)\s+", line)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def normalize_mac_address(mac: Optional[str]) -> Optional[str]:
        if not isinstance(mac, str):
            return None

        mac = mac.strip().lower()

        if mac in {"", "not found", "unknown", "none", "n/a"}:
            return None

        mac = mac.replace("-", "").replace(":", "").replace(".", "")

        if len(mac) != 12 or not re.fullmatch(r"[0-9a-f]{12}", mac):
            return None

        normalized = ":".join(mac[i:i+2] for i in range(0, 12, 2))

        if normalized == "00:00:00:00:00:00":
            return None

        return normalized

    @staticmethod
    def validate_mac_address(mac_address: Optional[str]) -> Optional[str]:
        normalized = CredentialsService.normalize_mac_address(mac_address)
        if mac_address and normalized is None:
            print(f"Invalid MAC address detected: {mac_address}")
        return normalized

    @staticmethod
    def discover_mac_cli(connection, device_type: str) -> Optional[str]:
        if not connection:
            return None

        if "cisco" in device_type:
            connection.enable()
            ip_output = connection.send_command("show ip interface brief")
            interface_name = CredentialsService._get_first_interface_from_brief(ip_output)
            if not interface_name:
                return None

            mac_output = connection.send_command(f"show interfaces {interface_name} | include address")
            mac_match = re.search(r"address is ([\w\.]+)", mac_output)
            if not mac_match:
                return None
            return CredentialsService.validate_mac_address(mac_match.group(1))

        if "juniper" in device_type:
            connection.send_command("cli")
            connection.send_command("set cli screen-length 0")
            ip_output = connection.send_command("show interfaces terse")
            interface_name = CredentialsService._get_first_interface_from_terse(ip_output)
            if not interface_name:
                return None

            mac_output = connection.send_command(f"show interfaces {interface_name} | match Hardware")
            mac_match = re.search(r"Hardware address: (\S+)", mac_output)
            if not mac_match:
                return None
            return CredentialsService.validate_mac_address(mac_match.group(1))

        return None

    @staticmethod
    async def discover_mac_address(cred: device_cred, method: str) -> Optional[str]:
        cred_dict = cred.model_dump()
        ip = cred_dict.get("ip")

        if method == "snmp":
            snmp_password = cred_dict.get("snmp_password")
            if not snmp_password:
                return None
            discovered = await ConnectionService.discover_mac_snmp(ip, snmp_password)
            return CredentialsService.validate_mac_address(discovered)

        if method == "cli":
            connection = ConnectionService.connect(cred_dict)
            if not connection:
                return None

            try:
                return CredentialsService.discover_mac_cli(
                    connection,
                    cred_dict.get("device_type", ""),
                )
            finally:
                try:
                    connection.disconnect()
                except Exception:
                    pass

        return None

    @staticmethod
    async def add_device_cred(device_cred: device_cred, method: str = "snmp") -> Dict[str, Any]:
        discovered_mac = await CredentialsService.discover_mac_address(device_cred, method)
        if not discovered_mac:
            return {
                "success": False,
                "reason": f"Could not discover a valid MAC address for device {device_cred.ip} using {method}",
            }

        payload = device_cred.model_dump()
        payload["mac_address"] = discovered_mac
        return await CredentialsRepo.add_device_cred(payload)


    @staticmethod
    async def get_all_cred() -> List[Dict[str, Any]]:
        return await CredentialsRepo.get_all_cred()


    @staticmethod
    async def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        return await CredentialsRepo.get_one_cred(ip)


    @staticmethod
    async def get_all_ip_and_snmp() -> List[Dict[str, Any]]:
        return await CredentialsRepo.get_all_ip_and_snmp()
