from fastapi import FastAPI
from bson.json_util import dumps
from pydantic import BaseModel
# from app.database import create
from app.database import my_collection , my_collection_2
import json

app = FastAPI()

class Device_cred(BaseModel):
    device_type: str
    host: str
    username: str
    password: str
    secret: str




@app.get("/run-config")
async def run_config():
    devices = list(my_collection_2.find({}, {"_id": 0}))
    return {"devices": devices}



@app.post("/add_device")
async def append_devices(device: Device_cred):
    my_collection_2.insert_one(device.model_dump())  


@app.get("/devices")
async def get_all_devices():
    devices = list(my_collection.find())
    return json.loads(dumps(devices))





