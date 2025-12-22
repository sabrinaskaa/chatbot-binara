from sqlalchemy import Column, Integer, Enum, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("tenant_id", "month", name="uq_payments_tenant_month"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    month = Column(Date, nullable=False)  # pakai tanggal 1 tiap bulan
    amount = Column(Integer, nullable=False)
    status = Column(Enum("paid", "unpaid"), nullable=False, default="unpaid")
    paid_at = Column(DateTime, nullable=True)

    tenant = relationship("Tenant")
