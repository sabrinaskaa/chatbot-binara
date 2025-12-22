from sqlalchemy.orm import Session
from app.models.visit import VisitRequest
from app.schemas.visit import VisitCreate

def list_visits(db: Session):
    return db.query(VisitRequest).order_by(VisitRequest.id.desc()).all()

def create_visit(db: Session, data: VisitCreate):
    v = VisitRequest(**data.model_dump(), status="pending")
    db.add(v)
    db.commit()
    db.refresh(v)
    return v
