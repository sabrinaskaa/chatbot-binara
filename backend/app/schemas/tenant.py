from pydantic import BaseModel
from datetime import date

class TenantCreate(BaseModel):
    name: str
    phone: str
    room_id: int
    start_date: date

class TenantOut(BaseModel):
    id: int
    name: str
    phone: str
    room_id: int
    start_date: date
    class Config:
        from_attributes = True
