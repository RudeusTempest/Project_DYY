from pydantic import BaseModel, Field
from typing import Optional


class device_cred(BaseModel):
    
    device_type: str = Field(..., description="Type of device (e.g., cisco_ios, cisco_xr, juniper_junos)")
    mac_address: Optional[str] = Field(None, description="MAC address of the device")
    ip: str = Field(..., description="IP address of the device")
    username: str = Field(..., description="Username for authentication")
    password: str = Field(..., description="Password for authentication")
    secret: Optional[str] = Field(None, description="Enable secret (if applicable)")
    snmp_password: Optional[str] = Field(None, description="SNMP community string for SNMP operations")