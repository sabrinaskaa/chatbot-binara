from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.routers.deps import get_db
from app.schemas.visit import VisitCreate, VisitOut
from app.crud.visit import list_visits, create_visit

router = APIRouter(prefix="/visits", tags=["visits"])

@router.get("/", response_model=list[VisitOut])
def get_visits(db: Session = Depends(get_db)):
    return list_visits(db)

@router.post("/", response_model=VisitOut)
def post_visit(payload: VisitCreate, db: Session = Depends(get_db)):
    return create_visit(db, payload)
