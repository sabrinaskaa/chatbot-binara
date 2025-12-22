from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate

def list_tenants(db: Session):
    return db.query(Tenant).order_by(Tenant.id.asc()).all()

def create_tenant(db: Session, data: TenantCreate):
    tenant = Tenant(**data.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant
