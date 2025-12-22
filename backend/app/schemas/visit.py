from pydantic import BaseModel
from datetime import date
from typing import Literal

class VisitCreate(BaseModel):
    name: str
    phone: str
    preferred_date: date

class VisitOut(BaseModel):
    id: int
    name: str
    phone: str
    preferred_date: date
    status: Literal["pending","confirmed","cancelled","done"]
    class Config:
        from_attributes = True
