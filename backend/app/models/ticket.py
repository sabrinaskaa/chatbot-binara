from sqlalchemy import Column, Integer, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(Enum("open", "on_progress", "done"), nullable=False, default="open")

    room = relationship("Room")
