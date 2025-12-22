import os, sys
from datetime import date, datetime

# biar bisa "python scripts/seed_all.py" juga jalan
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import Room, Tenant, Payment, Ticket, VisitRequest

def main():
    # pastikan table ada (buat dev cepat). Kalau udah Alembic, boleh hapus ini.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # clear (dev only)
    db.query(Payment).delete()
    db.query(Ticket).delete()
    db.query(Tenant).delete()
    db.query(VisitRequest).delete()
    db.query(Room).delete()
    db.commit()

    rooms = [
        Room(code="A1", type="single", price=900000, facilities={"ac": True, "bathroom": "inside"}, status="available"),
        Room(code="A2", type="single", price=850000, facilities={"ac": False, "bathroom": "outside"}, status="occupied"),
        Room(code="B1", type="deluxe", price=1200000, facilities={"ac": True, "bathroom": "inside", "wifi": True}, status="available"),
        Room(code="B2", type="deluxe", price=1300000, facilities={"ac": True, "bathroom": "inside", "water_heater": True}, status="maintenance"),
    ]
    db.add_all(rooms)
    db.commit()

    # refresh ids
    a2 = db.query(Room).filter(Room.code == "A2").first()

    tenant = Tenant(name="Andi", phone="081234567890", room_id=a2.id, start_date=date(2025, 12, 1))
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    payments = [
        Payment(tenant_id=tenant.id, month=date(2025, 12, 1), amount=850000, status="paid", paid_at=datetime(2025, 12, 1, 10, 0, 0)),
        Payment(tenant_id=tenant.id, month=date(2026, 1, 1), amount=850000, status="unpaid", paid_at=None),
    ]
    db.add_all(payments)

    ticket = Ticket(room_id=a2.id, description="AC tidak dingin", status="open")
    db.add(ticket)

    visit = VisitRequest(name="Sabrina", phone="08999999999", preferred_date=date(2025, 12, 28), status="pending")
    db.add(visit)

    db.commit()
    db.close()
    print("Seed ALL done")

if __name__ == "__main__":
    main()
