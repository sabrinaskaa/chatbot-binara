from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Literal

class PaymentCreate(BaseModel):
    tenant_id: int
    month: date
    amount: int
    status: Literal["paid","unpaid"] = "unpaid"
    paid_at: Optional[datetime] = None

class PaymentOut(PaymentCreate):
    id: int
    class Config:
        from_attributes = True
