from pydantic import BaseModel, Field
from typing import Optional


class Group(BaseModel):
    
    group: str = Field(..., description="Name of the group")