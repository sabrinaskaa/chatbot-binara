from datetime import date
from sqlalchemy.orm import Session
from app.models import Room, Ticket, VisitRequest, Tenant, Payment

def list_available_rooms(db: Session, room_type: str | None = None) -> str:
    q = db.query(Room).filter(Room.status == "available")
    if room_type in ("single","deluxe"):
        q = q.filter(Room.type == room_type)
    rooms = q.order_by(Room.price.asc()).all()
    if not rooms:
        return "Saat ini belum ada kamar kosong."
    lines = [f"- {r.code} ({r.type}) Rp{r.price}/bulan" for r in rooms[:10]]
    return "Kamar kosong yang tersedia:\n" + "\n".join(lines)

def create_visit(db: Session, name: str, phone: str, preferred_date: date) -> str:
    v = VisitRequest(name=name, phone=phone, preferred_date=preferred_date, status="pending")
    db.add(v)
    db.commit()
    db.refresh(v)
    return f"Oke, visit request kamu dibuat (ID {v.id}) untuk {preferred_date}. Admin bakal konfirmasi."

def create_ticket(db: Session, room_code: str, description: str) -> str:
    room = db.query(Room).filter(Room.code == room_code).first()
    if not room:
        return f"Kamar {room_code} nggak ketemu. Pastikan formatnya bener (A1, B2, dll)."
    t = Ticket(room_id=room.id, description=description, status="open")
    db.add(t)
    db.commit()
    db.refresh(t)
    return f"Ticket dibuat (ID {t.id}) untuk kamar {room_code}. Status: open."

def check_unpaid(db: Session, phone: str) -> str:
    tenant = db.query(Tenant).filter(Tenant.phone == phone).first()
    if not tenant:
        return "Nomor itu belum terdaftar sebagai penghuni."
    unpaid = db.query(Payment).filter(
        Payment.tenant_id == tenant.id,
        Payment.status == "unpaid"
    ).order_by(Payment.month.asc()).all()
    if not unpaid:
        return f"{tenant.name} aman, tidak ada tunggakan."
    lines = [f"- {p.month} Rp{p.amount}" for p in unpaid]
    return f"Tunggakan {tenant.name}:\n" + "\n".join(lines)
