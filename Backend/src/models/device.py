from pydantic import BaseModel


class device_cred(BaseModel):
    device_type: str
    ip: str
    username: str
    password: str
    secret: str
