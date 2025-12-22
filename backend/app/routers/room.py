from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.routers.deps import get_db
from app.schemas.room import RoomCreate, RoomOut
from app.crud.room import list_rooms, create_room, available_rooms

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("/", response_model=list[RoomOut])
def get_rooms(db: Session = Depends(get_db)):
    return list_rooms(db)

@router.get("/available", response_model=list[RoomOut])
def get_available(db: Session = Depends(get_db)):
    return available_rooms(db)

@router.post("/", response_model=RoomOut)
def post_room(payload: RoomCreate, db: Session = Depends(get_db)):
    return create_room(db, payload)
