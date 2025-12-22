from sqlalchemy import Column, Integer, String, Enum, JSON
from app.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True)
    type = Column(String(50))
    price = Column(Integer)
    facilities = Column(JSON)
    status = Column(Enum("available", "occupied", "maintenance"))
