from src.config.database import db


cred_collection = db["devices_cred"]


class CredentialsRepo:  

    @staticmethod
    def add_device(cred: dict):
        cred_collection.insert_one(cred)


    @staticmethod
    def get_all_cred():
        connection_list = list(cred_collection.find({}, {"_id": 0}))
        return {"details": connection_list}
    

    @staticmethod
    def get_one_cred(ip: str):
        device = cred_collection.find_one({"host": ip}, {"_id": 0})
        return device