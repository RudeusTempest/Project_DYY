from C_Database import info_collection, cred_collection, archive
from Main import control_system
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from bson.json_util import dumps
# import json


app = FastAPI()


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class device_cred(BaseModel):
    device_type: str
    ip: str
    username: str
    password: str
    secret: str


@app.post("/add_device")
async def add_device(device_cred : device_cred):
    cred_collection.insert_one(device_cred.model_dump())


@app.get("/connection_details")
async def get_all_cred():
    connection_list = list(cred_collection.find({}, {"_id": 0}))
    return {"details": connection_list}


@app.get("/get_all")
async def get_info():
    devices_list = list(info_collection.find({}, {"_id": 0}))

    latest_devices = {}
    for device in devices_list:
        mac = device.get("mac")
        raw_date = device.get("raw date")
        
        # Keep the latest device by raw_date
        if mac not in latest_devices or raw_date > latest_devices[mac]["raw date"]:
            latest_devices[mac] = device
    return list(latest_devices.values())


@app.get("/get_one_cred")
async def get_one_cred(ip: str):
    device = cred_collection.find_one({"host": ip}, {"_id": 0})
    return device


@app.post("/refresh_one")
async def refresh_by_ip(ip: str):
    device = await get_one_cred(ip)   # await it
    control_system(device)             # now it's a dict
    return {"status": "refreshed"}


# Add this at the end to run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

                                           