from sqlalchemy.orm import Session
from app.models.room import Room
from app.schemas.room import RoomCreate

def list_rooms(db: Session):
    return db.query(Room).order_by(Room.id.asc()).all()

def get_room(db: Session, room_id: int):
    return db.query(Room).filter(Room.id == room_id).first()

def create_room(db: Session, data: RoomCreate):
    room = Room(**data.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

def available_rooms(db: Session):
    return db.query(Room).filter(Room.status == "available").order_by(Room.price.asc()).all()
