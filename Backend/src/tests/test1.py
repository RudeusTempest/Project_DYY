from src.repositories.postgres.credentials import CredentialsRepo
import asyncio

async def x():
    await CredentialsRepo.add_device_cred({
  "device_type": "juniper_junos",
  "mac_address": "00:05:86:71:59:11",
  "ip": "192.170.0.74",
  "username": "root",
  "password": "Aa123456",
  "secret": "Aa123456",
  "snmp_password": "password"
})





asyncio.run(x())


# import asyncio
# from src.db.postgres.base import Base
# from src.config.postgres import engine  # your async engine

# async def recreate_tables():
#     async with engine.begin() as conn:
#         # Drop all tables first (this deletes data!)
#         await conn.run_sync(Base.metadata.drop_all)
#         # Recreate tables with updated columns
#         await conn.run_sync(Base.metadata.create_all)

# asyncio.run(recreate_tables())