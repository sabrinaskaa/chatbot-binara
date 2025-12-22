from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.routers.deps import get_db
from app.schemas.payment import PaymentCreate, PaymentOut
from app.crud.payment import list_payments, create_payment

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/", response_model=list[PaymentOut])
def get_payments(db: Session = Depends(get_db)):
    return list_payments(db)

@router.post("/", response_model=PaymentOut)
def post_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    return create_payment(db, payload)
