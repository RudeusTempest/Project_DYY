from myfiles.C_Database import collection, collection2
from fastapi import FastAPI
from pydantic import BaseModel
from bson.json_util import dumps
import json


app = FastAPI()


class device_cred(BaseModel):
    device_type: str
    host: str
    username: str
    password: str
    secret: str


@app.post("/add_device")
async def add_device(device_cred : device_cred):
    collection2.insert_one(device_cred.model_dump())


@app.get("/connection_details")
async def get_connection_details():
    connection_list = list(collection2.find({}, {"_id": 0}))
    return {"details": connection_list}


@app.get("/")
async def get_info():
    return json.loads(dumps([collection.find()]))

                                           