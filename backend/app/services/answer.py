from sqlalchemy.orm import Session
from sqlalchemy import text

def fetch_context(db: Session, intent: str, kost_id: int = 1) -> dict:

    ctx = {
        "kost": None,
        "rooms": [],
        "rules": [],
        "payments": [],
        "nearby_laundry": []
    }

    # Kost info
    kost_row = db.execute(
        text("SELECT * FROM kost WHERE id=:id"),
        {"id": kost_id}
    ).mappings().first()
    ctx["kost"] = dict(kost_row) if kost_row else None

    # Rooms + facilities
    if intent in ["kamar_tersedia", "harga", "fasilitas", "biaya_tambahan"]:
        rooms = db.execute(text("""
            SELECT r.*,
                   GROUP_CONCAT(f.name SEPARATOR ', ') AS facilities
            FROM room r
            LEFT JOIN room_facility rf ON rf.room_id = r.id
            LEFT JOIN facility f ON f.id = rf.facility_id
            WHERE r.kost_id = :id
            GROUP BY r.id
            ORDER BY r.is_available DESC, r.code ASC
        """), {"id": kost_id}).mappings().all()
        ctx["rooms"] = [dict(r) for r in rooms]

    # Rules
    if intent == "aturan":
        rules = db.execute(
            text("SELECT title, description FROM rule WHERE kost_id=:id"),
            {"id": kost_id}
        ).mappings().all()
        ctx["rules"] = [dict(r) for r in rules]

    # Payment schemes
    if intent == "pembayaran":
        payments = db.execute(
            text("SELECT scheme, description FROM payment_scheme WHERE kost_id=:id"),
            {"id": kost_id}
        ).mappings().all()
        ctx["payments"] = [dict(p) for p in payments]

    # Nearby laundry
    if intent == "laundry_terdekat":
        laundry = db.execute(text("""
            SELECT name, address, distance_m, maps_url, note
            FROM nearby_place
            WHERE kost_id=:id AND category='laundry'
            ORDER BY (distance_m IS NULL), distance_m ASC
            LIMIT 5
        """), {"id": kost_id}).mappings().all()
        ctx["nearby_laundry"] = [dict(x) for x in laundry]

    return ctx
