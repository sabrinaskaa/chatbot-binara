from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.routers.deps import get_db
from app.schemas.tenant import TenantCreate, TenantOut
from app.crud.tenant import list_tenants, create_tenant

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.get("/", response_model=list[TenantOut])
def get_tenants(db: Session = Depends(get_db)):
    return list_tenants(db)

@router.post("/", response_model=TenantOut)
def post_tenant(payload: TenantCreate, db: Session = Depends(get_db)):
    return create_tenant(db, payload)
