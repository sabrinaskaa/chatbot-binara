from sqlalchemy import Column, Integer, String, Date
from app.database import Base

class VisitRequest(Base):
    __tablename__ = "visit_requests"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    phone = Column(String(20))
    preferred_date = Column(Date)
    status = Column(String(20), default="pending")
