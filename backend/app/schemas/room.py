from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal

class RoomBase(BaseModel):
    code: str
    type: Literal["single", "sharing"]
    price: int
    facilities: Optional[Dict[str, Any]] = None
    status: Literal["available", "occupied", "maintenance"] = "available"

class RoomCreate(RoomBase):
    pass

class RoomOut(RoomBase):
    id: int
    class Config:
        from_attributes = True
