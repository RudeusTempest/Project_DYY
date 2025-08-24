from C_Database import collection, collection2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson.json_util import dumps
import json


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
    # Convert cursor to list and return the data properly
    devices = list(collection.find({}, {"_id": 0}))
    return devices


# Add this at the end to run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

                                           