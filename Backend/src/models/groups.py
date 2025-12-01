from pydantic import BaseModel, Field
from typing import Optional


class Group(BaseModel):
    
    group: str = Field(..., description="Name of the group")
    device_macs: Optional[list[str]] = Field(default_factory=list, description="List of device MAC addresses in the group")