from A_Connection import connect, get_outputs
from B_Extraction import extract
from C_Database import save_info, get_database
import time


def control_system(device):
    # Connects to device via netmiko
    connection = connect(device)

    # Sends commands & recieve outputs
    hostname_output, ip_output, mac_output, last_updated, raw_date = get_outputs(connection)

    # Extracting details via regex
    mac_address, hostname, interface_data = extract(hostname_output, ip_output, mac_output)

    # Saves details in database
    save_info(mac_address, hostname, interface_data, last_updated, raw_date)


def get_all_cred():
    connection_list = list(cred_collection.find({}, {"_id": 0}))
    return {"details": connection_list}


info_collection, cred_collection, archive = get_database() 


# while True:

#     for device in (get_all_cred())["details"]:
#         control_system(device)

#     time.sleep(3600)


control_system(((get_all_cred())["details"])[0])
