import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.services.connection import ConnectionService
from typing import Optional


class SNMPMacExtractor:
    """Extract MAC address from device interfaces using SNMP"""
    
    # OID for interface MAC addresses (ifPhysAddress)
    INTERFACE_MAC_OID = "1.3.6.1.2.1.2.2.1.6"  # ifPhysAddress
    
    # OID for interface names (ifDescr)
    INTERFACE_NAME_OID = "1.3.6.1.2.1.2.2.1.2"  # ifDescr
    
    @staticmethod
    async def get_first_interface_mac(ip: str, snmp_password: str) -> Optional[dict]:
        """
        Retrieve the MAC address of the first interface on a device via SNMP
        
        Args:
            ip: Device IP address
            snmp_password: SNMP community string
            
        Returns:
            Dictionary with interface details or None if failed
            {
                "interface_index": "1",
                "interface_name": "GigabitEthernet0/0/0",
                "mac_address": "aabb.cc02.b000",
                "mac_hex": "aa:bb:cc:02:b0:00"
            }
        """
        try:
            print(f"\n{'='*60}")
            print(f"Connecting to device: {ip}")
            print(f"{'='*60}\n")
            
            # Step 1: Get all interface names (ifDescr)
            print("[*] Fetching interface names via SNMP...")
            interface_indexes = await ConnectionService.get_interfaces_indexes(ip, snmp_password)
            
            if not interface_indexes:
                print("[-] Failed to retrieve interface indexes")
                return None
            
            print(f"[+] Found {len(interface_indexes)} interface(s)")
            
            # Step 2: Get the first interface
            if not interface_indexes:
                print("[-] No interfaces found")
                return None
            
            # Get the first interface
            first_interface_name = list(interface_indexes.keys())[0]
            first_interface_index = interface_indexes[first_interface_name]
            
            print(f"\n[*] First interface: {first_interface_name}")
            print(f"[*] Interface index: {first_interface_index}")
            
            # Step 3: Get MAC address for first interface
            print(f"\n[*] Retrieving MAC address for {first_interface_name}...")
            mac_oid = f"{SNMPMacExtractor.INTERFACE_MAC_OID}.{first_interface_index}"
            
            mac_raw = await ConnectionService.get_snmp(ip, snmp_password, mac_oid)
            
            if mac_raw is None:
                print("[-] Failed to retrieve MAC address")
                return None
            
            # Convert MAC to readable format
            mac_hex = SNMPMacExtractor.convert_mac_to_hex(mac_raw)
            mac_dotted = SNMPMacExtractor.convert_mac_to_dotted(mac_raw)
            
            result = {
                "interface_index": first_interface_index,
                "interface_name": first_interface_name,
                "mac_address": mac_dotted,
                "mac_hex": mac_hex,
                "raw_value": str(mac_raw)
            }
            
            print(f"\n[+] Successfully retrieved MAC address!")
            print(f"    Interface Name: {result['interface_name']}")
            print(f"    Interface Index: {result['interface_index']}")
            print(f"    MAC Address (dotted): {result['mac_address']}")
            print(f"    MAC Address (colon): {result['mac_hex']}")
            
            return result
            
        except Exception as e:
            print(f"[-] Error: {e}")
            return None
    
    @staticmethod
    def convert_mac_to_hex(mac_raw) -> str:
        """Convert raw MAC value to colon-separated hex format (aa:bb:cc:dd:ee:ff)"""
        try:
            mac_str = str(mac_raw)
            # Handle different formats
            mac_bytes = mac_str.encode() if isinstance(mac_str, str) else mac_raw
            return ":".join(f"{byte:02x}" for byte in mac_bytes)
        except Exception as e:
            print(f"[-] Error converting MAC to hex: {e}")
            return str(mac_raw)
    
    @staticmethod
    def convert_mac_to_dotted(mac_raw) -> str:
        """Convert raw MAC value to dotted format (aabb.cc02.b000)"""
        try:
            mac_hex = SNMPMacExtractor.convert_mac_to_hex(mac_raw)
            # Remove colons and format as dotted
            mac_clean = mac_hex.replace(":", "")
            return f"{mac_clean[0:4]}.{mac_clean[4:8]}.{mac_clean[8:12]}"
        except Exception as e:
            print(f"[-] Error converting MAC to dotted: {e}")
            return str(mac_raw)
    
    @staticmethod
    async def get_all_interfaces_mac(ip: str, snmp_password: str) -> Optional[list]:
        """
        Retrieve MAC addresses for all interfaces on a device via SNMP
        
        Returns:
            List of dictionaries with interface details
        """
        try:
            print(f"\n{'='*60}")
            print(f"Fetching ALL interfaces MAC addresses from: {ip}")
            print(f"{'='*60}\n")
            
            # Get all interface names
            print("[*] Fetching all interface names via SNMP...")
            interface_indexes = await ConnectionService.get_interfaces_indexes(ip, snmp_password)
            
            if not interface_indexes:
                print("[-] Failed to retrieve interface indexes")
                return None
            
            print(f"[+] Found {len(interface_indexes)} interface(s)\n")
            
            all_interfaces = []
            
            # Get MAC for each interface
            for idx, (interface_name, interface_index) in enumerate(interface_indexes.items(), 1):
                try:
                    mac_oid = f"{SNMPMacExtractor.INTERFACE_MAC_OID}.{interface_index}"
                    mac_raw = await ConnectionService.get_snmp(ip, snmp_password, mac_oid)
                    
                    if mac_raw:
                        mac_hex = SNMPMacExtractor.convert_mac_to_hex(mac_raw)
                        mac_dotted = SNMPMacExtractor.convert_mac_to_dotted(mac_raw)
                        
                        interface_data = {
                            "interface_index": interface_index,
                            "interface_name": interface_name,
                            "mac_address": mac_dotted,
                            "mac_hex": mac_hex
                        }
                        
                        all_interfaces.append(interface_data)
                        print(f"[{idx}] {interface_name:30} | MAC: {mac_dotted}")
                    else:
                        print(f"[{idx}] {interface_name:30} | MAC: Failed to retrieve")
                
                except Exception as e:
                    print(f"[{idx}] {interface_name:30} | Error: {e}")
            
            print(f"\n[+] Successfully retrieved {len(all_interfaces)} interface(s)")
            return all_interfaces
            
        except Exception as e:
            print(f"[-] Error: {e}")
            return None


async def main():
    """
    Main test function - Configure these values for your device
    """
    
    # ============ CONFIGURATION ============
    # Change these to match your device
    DEVICE_IP = "192.170.0.78"           # Change to your device IP
    SNMP_PASSWORD = "password"             # Change to your SNMP community string
    # ========================================
    
    print("\n" + "="*60)
    print("SNMP MAC Address Extractor - Test Script")
    print("="*60)
    
    # Test 1: Get first interface MAC
    result = await SNMPMacExtractor.get_first_interface_mac(DEVICE_IP, SNMP_PASSWORD)
    
    if result:
        print(f"\n✓ Test 1 PASSED: Successfully retrieved first interface MAC")
    else:
        print(f"\n✗ Test 1 FAILED: Could not retrieve first interface MAC")
        return
    
    # Test 2: Get all interfaces MAC
    print("\n" + "-"*60)
    all_interfaces = await SNMPMacExtractor.get_all_interfaces_mac(DEVICE_IP, SNMP_PASSWORD)
    
    if all_interfaces:
        print(f"\n✓ Test 2 PASSED: Successfully retrieved all interfaces MAC")
    else:
        print(f"\n✗ Test 2 FAILED: Could not retrieve all interfaces MAC")
    
    print("\n" + "="*60)


if __name__ == "__main__":
    # Example usage with try-except for easy debugging
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"\n[-] Fatal error: {e}")
        import traceback
        traceback.print_exc()