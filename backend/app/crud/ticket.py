from sqlalchemy.orm import Session
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate

def list_tickets(db: Session):
    return db.query(Ticket).order_by(Ticket.id.desc()).all()

def create_ticket(db: Session, data: TicketCreate):
    t = Ticket(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t
