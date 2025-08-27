from Backend.myfiles.A_Connection import connect, get_outputs
from Backend.myfiles.B_Extraction import extract
from Backend.myfiles.C_Database import save_info, collection, collection2
from Backend.myfiles.D_FastAPI import get_connection_details
import time
import asyncio


def control_system(device):
    # Connects to device via netmiko
    connection = connect(device)

    # Sends commands & recieve outputs
    hostname_output, ip_output, mac_output, last_updated, raw_date = get_outputs(connection)

    # Extracting details via regex
    mac_address, hostname, interface_data = extract(hostname_output, ip_output, mac_output)

    # Saves details in database
    save_info(collection, mac_address, hostname, interface_data, last_updated, raw_date)


# while True:

#     for device in (asyncio.run(get_connection_details()))["details"]:
#         control_system(device)

#     time.sleep(3600)


control_system(((asyncio.run(get_connection_details()))["details"])[0])