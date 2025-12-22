from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate

def list_payments(db: Session):
    return db.query(Payment).order_by(Payment.id.desc()).all()

def create_payment(db: Session, data: PaymentCreate):
    p = Payment(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
