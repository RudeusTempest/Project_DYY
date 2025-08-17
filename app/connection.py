from netmiko import ConnectHandler

# Connect to the router
def connect_to_device(device):
    
    net_connect = ConnectHandler(**device)

    net_connect.enable()

    return net_connect
