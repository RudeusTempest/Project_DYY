from myfiles.A_Connection import connect, get_outputs
from myfiles.B_Extraction import extract
from myfiles.C_Database import save_info, collection, collection2
import time
from myfiles.D_FastAPI import get_connection_details
import asyncio



def control_system():
    # Connects to device via netmiko
    connection = connect(device)

    # Sends commands & recieve outputs
    hostname_output, ip_output, mac_output, last_updated = get_outputs(connection)

    # Extracting details via regex
    mac_address, hostname, interface_data, last_updated = extract(hostname_output, ip_output, mac_output, last_updated)

    # Saves details in database
    save_info(collection, mac_address, hostname, interface_data, last_updated)


while True:

    for i in range(asyncio.run(get_connection_details()))["details"]:
        control_system(device)

    time.sleep(3600)