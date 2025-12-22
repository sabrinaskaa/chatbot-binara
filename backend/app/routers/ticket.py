from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.routers.deps import get_db
from app.schemas.ticket import TicketCreate, TicketOut
from app.crud.ticket import list_tickets, create_ticket

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.get("/", response_model=list[TicketOut])
def get_tickets(db: Session = Depends(get_db)):
    return list_tickets(db)

@router.post("/", response_model=TicketOut)
def post_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    return create_ticket(db, payload)
