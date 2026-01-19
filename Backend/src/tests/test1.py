from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "192.170.0.78",
    "username": "net",
    "password": "Aa123456!",
    "timeout": 10,
}

conn = ConnectHandler(**device)
config = conn.send_command("show running-config")
print(config)
conn.disconnect()






# from src.repositories.postgres.credentials import CredentialsRepo
# import asyncio

# async def x():
#     await CredentialsRepo.add_device_cred({
#   "device_type": "juniper_junos",
#   "mac_address": "00:05:86:71:59:11",
#   "ip": "192.170.0.74",
#   "username": "root",
#   "password": "Aa123456",
#   "secret": "Aa123456",
#   "snmp_password": "password"
# })





# asyncio.run(x())
