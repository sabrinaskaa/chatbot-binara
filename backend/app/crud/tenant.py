from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate

def list_tenants(db: Session):
    return db.query(Tenant).order_by(Tenant.id.asc()).all()

def create_tenant(db: Session, data: TenantCreate):
    t = Tenant(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t
