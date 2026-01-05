from sqlalchemy.orm import Session
from app.models.room import Room
from app.schemas.room import RoomCreate

def list_rooms(db: Session):
    return db.query(Room).order_by(Room.id.asc()).all()

def create_room(db: Session, data: RoomCreate):
    r = Room(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
