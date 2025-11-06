from src.config.database import db


cred_collection = db["devices_cred"]


class CredentialsRepo:  

    @staticmethod
    def add_device_cred(cred: dict):
        cred_collection.insert_one(cred)


    @staticmethod
    def get_all_cred():
        cred_list = list(cred_collection.find({}, {"_id": 0}))
        return cred_list
    

    @staticmethod
    def get_one_cred(ip: str):
        device_cred = cred_collection.find_one({"ip": ip}, {"_id": 0})
        return device_cred
    

    @staticmethod
    def get_all_ip_and_snmp():
        ip_and_snmp_list = list(cred_collection.find({}, {"ip": 1, "snmp_password": 1, "_id": 0}))
        return ip_and_snmp_list
    
