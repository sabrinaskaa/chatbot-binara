from pydantic import BaseModel
from typing import Literal

class TicketCreate(BaseModel):
    room_id: int
    description: str
    status: Literal["open","on_progress","done"] = "open"

class TicketOut(TicketCreate):
    id: int
    class Config:
        from_attributes = True
