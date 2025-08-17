import time
import asyncio
from app.connection import connect_to_device
from app.extract_information import parse_device_data
from app.database import my_collection , my_collection_2, insert_device_data
from app.api import run_config



 

for val in (asyncio.run(run_config()))["devices"]:
    

    print(val)
    
    net_connect = connect_to_device(val)
    
    devices_data = parse_device_data(net_connect)

    # Close the connection
    net_connect.disconnect()

    # Save to MongoDB

    insert_device_data(my_collection, devices_data)

time.sleep(3600)


