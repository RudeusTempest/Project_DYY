from typing import Optional, Tuple, List, Dict, Any
import re


class ExtractionService:

    @staticmethod 
    def extract_cisco(device_type: str, mac_output: str, hostname_output: str, ip_output: str, info_neighbors_output: str) -> Optional[Tuple[str, str, List[Dict[str, Any]], List[Dict[str, str]]]]:

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
                        "status": f"{status}/{protocol}",
                        "max_speed": "pass",
                        "mbps_received": "pass",
                        "mbps_sent": "pass"
                    })

            info_neighbors = []
            lines = info_neighbors_output.splitlines()[1:]  
            for line in lines:
                parts = re.split(r"\s{2,}", line.strip())
                if len(parts) >= 3:
                    neighbor = {
                        "device_id": parts[0],         
                        "local_interface": parts[1],   
                        "port_id": parts[-1]           
                    }
                    info_neighbors.append(neighbor)

            return mac_address, hostname, interface_data, info_neighbors
        

        if device_type == "cisco_xr":

            # Extracting the details
            mac_match = re.search(r"address is\s+([\w\.]+)", mac_output)
            if mac_match:
                mac_address = mac_match.group(1)
            else: mac_address = "Not found" 

            hostname_match = re.search(r"hostname\s+(\S+)", hostname_output)
            if hostname_match:
                hostname = hostname_match.group(1)
            else: hostname = "Hostname not found"     

            interface_data = []
            for line in ip_output.splitlines()[4:]:
                # Example line: Ethernet0/0     192.170.0.74   YES manual up                    up
                match = re.match(r"(\S+)\s+(\S+)\s+(\S+)\s+(\S+)", line)
                if match:
                    interface_name = match.group(1)
                    ip = match.group(2)
                    status = match.group(3)
                    protocol = match.group(4)
                    interface_data.append({
                        "interface": interface_name,
                        "ip_address": ip,
                        "status": f"{status}/{protocol}",
                        "max_speed": "Not measured",
                        "mbps_received": "Not measured",
                        "mbps_sent": "Not measured"
                    })

            info_neighbors = []
            lines = info_neighbors_output.splitlines()[1:]  
            for line in lines:
                parts = re.split(r"\s{2,}", line.strip())
                if len(parts) >= 3:
                    neighbor = {
                        "device_id": parts[0],         
                        "local_interface": parts[1],   
                        "port_id": parts[-1]           
                    }
                    info_neighbors.append(neighbor)

            return mac_address, hostname, interface_data, info_neighbors


    @staticmethod
    def extract_juniper(device_type: str, hostname_output: str, ip_output: str, mac_output: str) -> Optional[Tuple[str, str, List[Dict[str, Any]]]]:

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
                match = re.match(r'^(\S+)\s+(\S+)\s+(\S+)(?:\s+(\S+)\s+([\d\.\/]+)(?:\s+-->\s+([\d\.\/]+))?)?', line)

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
        



#""""""""""""""""""""""""""""""""""""""""""""""""""CLI METHODES""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

    @staticmethod    
    def extract_bandwidth(all_interfaces_output: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        bandwidth_data = {}
        try:
            if all_interfaces_output is None:
                return {}
                
            # Split by interface sections
            interface_sections = re.split(r'\n(?=[A-Za-z].*is\s+(up|down|administratively down))', all_interfaces_output)
            
            for i, section in enumerate(interface_sections):
                if i == 0:
                    continue  # Skip header
                
                # Extract interface name
                interface_match = re.match(r'([A-Za-z0-9\/\-\.]+)\s+is', section)
                if not interface_match:
                    continue
                
                interface_name = interface_match.group(1)
                
                # Call function 1 to extract bandwidth for this interface
                bandwidth_info = ExtractionService.extract_bandwidth_per_interface_cisco(section)
                
                bandwidth_data[interface_name] = bandwidth_info
            
            return bandwidth_data
        
        except Exception as e:
            print(f"Error extracting all interfaces: {e}")
            return {}
        

    @staticmethod
    def extract_bandwidth_per_interface_cisco(interface_output: str) -> Dict[str, Any]:
        """
        Extract detailed bandwidth information for a specific Cisco interface
        This includes current utilization, max capacity, and errors
        
        Returns dict with:
        - bandwidth_max_mbps: Maximum configured bandwidth (in Mbps)
        - txload_current: Current transmit load (0-255 scale, where 255 = 100%)
        - rxload_current: Current receive load (0-255 scale, where 255 = 100%)
        - input_rate_kbps: Current input data rate in Kbps
        - output_rate_kbps: Current output data rate in Kbps
        - mtu: Maximum Transmission Unit size
        - crc_errors: CRC errors count
        - input_errors: Total input errors
        """
        try:
            # Extract BW (Maximum Bandwidth configured)
            # Format: BW 1000000 Kbit (Max: 1000000 Kbit) or BW 1000000 Kbit/sec
            bandwidth_match = re.search(r"BW\s+(\d+)\s+Kbit", interface_output)
            bandwidth_max_mbps = int(bandwidth_match.group(1)) / 1000 if bandwidth_match else None
            
            
            # Extract MTU (Maximum Transmission Unit)
            mtu_match = re.search(r"MTU\s+(\d+)", interface_output)
            mtu = mtu_match.group(1) if mtu_match else None
            
            # Extract current load percentages (txload = transmit load, rxload = receive load)
            # Scale: 0-255, where 255 = 100% utilization
            txload_match = re.search(r"txload\s+(\d+)/255", interface_output)
            txload_current = int(txload_match.group(1)) if txload_match else 0
            rxload_match = re.search(r"rxload\s+(\d+)/255", interface_output)
            rxload_current = int(rxload_match.group(1)) if rxload_match else 0
            
            # Calculate percentage from 0-255 scale
            txload_percent = round((txload_current / 255) * 100, 2)
            rxload_percent = round((rxload_current / 255) * 100, 2)
            
            # Extract 5-minute input/output rates
            # Format: "5 minute input rate 5000 bits/sec, 4 packets/sec"
            input_rate_match = re.search(r"5 minute input rate (\d+) bits/sec", interface_output)
            input_rate_kbps = int(input_rate_match.group(1)) / 1000 if input_rate_match else 0
            output_rate_match = re.search(r"5 minute output rate (\d+) bits/sec", interface_output)
            output_rate_kbps = int(output_rate_match.group(1)) / 1000 if output_rate_match else 0
            
            # Extract CRC errors
            crc_match = re.search(r"(\d+)\s+CRC", interface_output)
            crc_errors = int(crc_match.group(1)) if crc_match else 0
            
            # Extract total input errors
            input_errors_match = re.search(r"(\d+)\s+input errors", interface_output)
            input_errors = int(input_errors_match.group(1)) if input_errors_match else 0
            
            # Extract output errors
            output_errors_match = re.search(r"(\d+)\s+output errors", interface_output)
            output_errors = int(output_errors_match.group(1)) if output_errors_match else 0
            
            return {
                "bandwidth_max_mbps": bandwidth_max_mbps,
                "txload_current": txload_current,
                "txload_percent": txload_percent,
                "rxload_current": rxload_current,
                "rxload_percent": rxload_percent,
                "input_rate_kbps": round(input_rate_kbps, 2),
                "output_rate_kbps": round(output_rate_kbps, 2),
                "mtu": mtu,
                "crc_errors": crc_errors,
                "input_errors": input_errors,
                "output_errors": output_errors
            }
        except Exception as e:
            print(f"Error extracting bandwidth: {e}")
            return {}
        

    @staticmethod    
    def extract_bandwidth_juniper(all_interfaces_output: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Extract bandwidth for all Juniper interfaces from "show interfaces extensive" output
        """
        bandwidth_data = {}
        try:
            if all_interfaces_output is None:
                return {}
                
            # Split by "Physical interface:" sections
            interface_sections = re.split(r'\n(?=Physical interface:)', all_interfaces_output)
            
            for section in interface_sections:
                if not section.strip():
                    continue
                
                # Extract interface name from "Physical interface: ge-0/0/0, Enabled, Physical link is Up"
                interface_match = re.search(r'Physical interface:\s+([A-Za-z0-9\/\-\.]+)', section)
                if not interface_match:
                    continue
                
                interface_name = interface_match.group(1)
                
                # Extract bandwidth for this interface
                bandwidth_info = ExtractionService.extract_bandwidth_per_interface_juniper(section)
                
                bandwidth_data[interface_name] = bandwidth_info
            
            return bandwidth_data
        
        except Exception as e:
            print(f"Error extracting Juniper interfaces: {e}")
            return {}


    @staticmethod 
    def extract_cisco_cli(device_type: str, hostname_output: str, ip_output: str, mac_output: str, info_neighbors_output: str, all_interfaces_output: Optional[str] = None) -> Optional[Tuple[str, str, List[Dict[str, Any]], List[Dict[str, str]]]]:
        """
        Extract Cisco device information including interface details and bandwidth per interface
        """
        try:
            if device_type == "cisco_ios":

                # Extract basic device info
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
                    # Example: Ethernet0/0     192.170.0.74   YES manual up                    up
                    match = re.match(r"(\S+)\s+(\S+)\s+\S+\s+\S+\s+(\S+)\s+(\S+)", line)
                    if match:
                        interface_name = match.group(1)
                        ip = match.group(2)
                        status = match.group(3)
                        protocol = match.group(4)
                        
                        # Initialize interface data with basic info
                        interface_info = {
                            "interface": interface_name,
                            "ip_address": ip,
                            "status": f"{status}/{protocol}",
                            "bandwidth": {}
                        }
                        
                        # If we have detailed interface output, extract bandwidth info
                        if all_interfaces_output:
                            # Find the section for this specific interface
                            interface_section = re.search(
                                f"{interface_name} is.*?(?=\n[A-Za-z]|$)", 
                                all_interfaces_output, 
                                re.DOTALL
                            )
                            if interface_section:
                                bandwidth_info = ExtractionService.extract_bandwidth_per_interface_cisco(
                                    interface_section.group(0)
                                )
                                interface_info["bandwidth"] = bandwidth_info
                        
                        interface_data.append(interface_info)

                info_neighbors = []
                lines = info_neighbors_output.splitlines()[1:]  
                for line in lines:
                    parts = re.split(r"\s{2,}", line.strip())
                    if len(parts) >= 3:
                        neighbor = {
                            "device_id": parts[0],         
                            "local_interface": parts[1],   
                            "port_id": parts[-1]           
                        }
                        info_neighbors.append(neighbor)            

                return mac_address, hostname, interface_data, info_neighbors
        

            if device_type == "cisco_xr":

                # Extract basic device info
                mac_match = re.search(r"address is\s+([\w\.]+)", mac_output)
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
                for line in ip_output.splitlines()[4:]:
                    # Example: GigabitEthernet0/0/0/0     192.170.0.78   YES manual up                    up
                    match = re.match(r"(\S+)\s+(\S+)\s+(\S+)\s+(\S+)", line)
                    if match:
                        interface_name = match.group(1)
                        ip = match.group(2)
                        status = match.group(3)
                        protocol = match.group(4)
                        
                        # Initialize interface data with basic info
                        interface_info = {
                            "interface": interface_name,
                            "ip_address": ip,
                            "status": f"{status}/{protocol}",
                            "bandwidth": {}
                        }
                        
                        # If we have detailed interface output, extract bandwidth info
                        if all_interfaces_output:
                            # Find the section for this specific interface
                            interface_section = re.search(
                                f"{interface_name} is.*?(?=\n[A-Za-z]|$)", 
                                all_interfaces_output, 
                                re.DOTALL
                            )
                            if interface_section:
                                bandwidth_info = ExtractionService.extract_bandwidth_per_interface_cisco(
                                    interface_section.group(0)
                                )
                                interface_info["bandwidth"] = bandwidth_info
                        
                        interface_data.append(interface_info)

                info_neighbors = []
                lines = info_neighbors_output.splitlines()[1:]  
                for line in lines:
                    parts = re.split(r"\s{2,}", line.strip())
                    if len(parts) >= 3:
                        neighbor = {
                            "device_id": parts[0],         
                            "local_interface": parts[1],   
                            "port_id": parts[-1]           
                        }
                        info_neighbors.append(neighbor)

                return mac_address, hostname, interface_data, info_neighbors 
               
        except Exception as e:
            print(f"Error in extract_cisco_cli: {e}")
            return {"success": False, "reason": str(e)}    


    @staticmethod
    def extract_bandwidth_per_interface_juniper(interface_output: str) -> Dict[str, Any]:
        """
        Extract detailed bandwidth information for a specific Juniper interface
        This includes current utilization, max capacity, and errors
        
        Returns dict with:
        - bandwidth_max_mbps: Maximum configured bandwidth (in Mbps)
        - input_rate_bps: Current input data rate in bps
        - output_rate_bps: Current output data rate in bps
        - mtu: Maximum Transmission Unit size
        - input_errors: Total input errors
        - output_errors: Total output errors
        """
        try:
            # Extract Speed (Maximum Bandwidth)
            # Format: Speed: 1000mbps
            speed_match = re.search(r"Speed:\s+(\d+)mbps", interface_output)
            bandwidth_max_mbps = int(speed_match.group(1)) if speed_match else None
            
            # Extract MTU (Maximum Transmission Unit)
            mtu_match = re.search(r"MTU:\s+(\d+)", interface_output)
            mtu = mtu_match.group(1) if mtu_match else None
            
            # Extract input rate (bits per second)
            # Format: Input rate     : 5000 bps (4 pps)
            input_rate_match = re.search(r"Input\s+rate\s*:\s*(\d+)\s+bps", interface_output)
            input_rate_bps = int(input_rate_match.group(1)) if input_rate_match else 0
            
            # Extract output rate (bits per second)
            # Format: Output rate    : 5000 bps (4 pps)
            output_rate_match = re.search(r"Output\s+rate\s*:\s*(\d+)\s+bps", interface_output)
            output_rate_bps = int(output_rate_match.group(1)) if output_rate_match else 0
            
            # Extract input errors
            input_errors_match = re.search(r"Input\s+errors:\s+(\d+)", interface_output)
            input_errors = int(input_errors_match.group(1)) if input_errors_match else 0
            
            # Extract output errors
            output_errors_match = re.search(r"Output\s+errors:\s+(\d+)", interface_output)
            output_errors = int(output_errors_match.group(1)) if output_errors_match else 0
            
            # Calculate utilization percentages if bandwidth is known
            input_utilization_percent = 0
            output_utilization_percent = 0
            if bandwidth_max_mbps and bandwidth_max_mbps > 0:
                bandwidth_max_bps = bandwidth_max_mbps * 1_000_000
                input_utilization_percent = round((input_rate_bps / bandwidth_max_bps) * 100, 2)
                output_utilization_percent = round((output_rate_bps / bandwidth_max_bps) * 100, 2)
            
            return {
                "bandwidth_max_mbps": bandwidth_max_mbps,
                "input_rate_bps": input_rate_bps,
                "input_rate_kbps": round(input_rate_bps / 1000, 2),
                "output_rate_bps": output_rate_bps,
                "output_rate_kbps": round(output_rate_bps / 1000, 2),
                "input_utilization_percent": input_utilization_percent,
                "output_utilization_percent": output_utilization_percent,
                "mtu": mtu,
                "input_errors": input_errors,
                "output_errors": output_errors
            }
        except Exception as e:
            print(f"Error extracting Juniper bandwidth: {e}")
            return {}


    @staticmethod 
    def extract_juniper_cli(device_type: str, hostname_output: str, ip_output: str, mac_output: str, all_interfaces_output: Optional[str] = None) -> Optional[Tuple[str, str, List[Dict[str, Any]]]]:
        """
        Extract Juniper device information including interface details and bandwidth per interface
        """
        try:
            if device_type == "juniper_junos":

                # Extract basic device info
                mac_match = re.search(r"Hardware address: (\S+)", mac_output)
                if mac_match:
                    mac_address = mac_match.group(1)
                else: 
                    mac_address = "Not found" 

                hostname_match = re.search(r"host-name\s+(\S+);", hostname_output)
                if hostname_match:
                    hostname = hostname_match.group(1)
                else: 
                    hostname = "Hostname not found"     

                interface_data = []
                for line in ip_output.splitlines()[1:]:
                    # Skip empty lines
                    if not line.strip():
                        continue

                    # Regex to match interface + optional protocol + IP + optional remote IP
                    # Example: sp-0/0/0.16383          up    up   inet     10.0.0.1  
                    match = re.match(r'^(\S+)\s+(\S+)\s+(\S+)(?:\s+(\S+)\s+([\d\.\/]+)(?:\s+-->\s+([\d\.\/]+))?)?', line)

                    if match:
                        interface_name = match.group(1)
                        admin_status = match.group(2)
                        link_status = match.group(3)
                        protocol = match.group(4) if match.group(4) else "Unassigned"
                        ip_address = match.group(5) if match.group(5) else "Unassigned"
                        remote_ip = match.group(6) if match.group(6) else None

                        # Initialize interface data with basic info
                        interface_info = {
                            "Interface": interface_name,
                            "Status": f"{admin_status}/{link_status}",
                            "Protocol": protocol,
                            "IP_Address": ip_address,
                            "Remote IP": remote_ip,
                            "bandwidth": {}
                        }
                        
                        # If we have detailed interface output, extract bandwidth info
                        if all_interfaces_output:
                            # Find the section for this specific interface
                            # Juniper format: "Physical interface: ge-0/0/0, Enabled, Physical link is Up"
                            base_interface = interface_name.split('.')[0]  # Get base interface without unit
                            interface_section = re.search(
                                f"Physical interface: {base_interface},.*?(?=Physical interface:|$)", 
                                all_interfaces_output, 
                                re.DOTALL
                            )
                            if interface_section:
                                bandwidth_info = ExtractionService.extract_bandwidth_per_interface_juniper(
                                    interface_section.group(0)
                                )
                                interface_info["bandwidth"] = bandwidth_info
                        
                        interface_data.append(interface_info)

                return mac_address, hostname, interface_data
        except Exception as e:
            print(f"Error in extract_juniper_cli: {e}")
            return {"success": False, "reason": str(e)}