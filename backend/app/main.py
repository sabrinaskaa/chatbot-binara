import os
import json
from datetime import datetime
from typing import Optional, Any, Literal

from dotenv import load_dotenv
from sqlalchemy import text
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.guardrail import classify
from app.services.answer import fetch_context
from app.services.gemini import generate_answer

load_dotenv()
if not os.getenv("VERCEL"):
    load_dotenv()

app = FastAPI(title="Binara Kost API")

# =========================
# CORS (Next.js local)
# =========================
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Helpers
# =========================
def json_safe(v: Any) -> Any:
    if isinstance(v, datetime):
        return v.isoformat()
    return v

def require_admin(authorization: Optional[str]) -> None:
    """
    Expect: Authorization: Bearer <ADMIN_TOKEN>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized (missing bearer token)")

    token = authorization.split(" ", 1)[1].strip()
    admin_token = os.getenv("ADMIN_TOKEN", "supersecret123")
    if token != admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized (invalid token)")

def paginate(page: int, page_size: int) -> tuple[int, int]:
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 50:
        page_size = 50
    offset = (page - 1) * page_size
    return offset, page_size

# =========================
# Schemas
# =========================
class ChatIn(BaseModel):
    session_id: str
    message: str

class AdminLoginIn(BaseModel):
    username: str
    password: str

class KostUpdateIn(BaseModel):
    name: str = ""
    address: str = ""
    whatsapp: str = ""
    google_maps_url: str = ""
    visiting_hours: str = ""

# ---- ROOM (sesuai SQL lo) ----
class RoomIn(BaseModel):
    kost_id: int = 1
    code: str = Field(..., max_length=30)
    price_monthly: Optional[int] = Field(default=None, ge=0)
    deposit: Optional[int] = Field(default=None, ge=0)
    electricity_included: bool = False
    electricity_note: str = ""
    size_m2: Optional[float] = None
    is_available: bool = True
    notes: str = ""
    facility_ids: list[int] = Field(default_factory=list)

class RoomUpdateIn(BaseModel):
    code: Optional[str] = Field(default=None, max_length=30)
    price_monthly: Optional[int] = Field(default=None, ge=0)
    deposit: Optional[int] = Field(default=None, ge=0)
    electricity_included: Optional[bool] = None
    electricity_note: Optional[str] = None
    size_m2: Optional[float] = None
    is_available: Optional[bool] = None
    notes: Optional[str] = None
    facility_ids: Optional[list[int]] = None

# ---- FACILITY ----
class FacilityIn(BaseModel):
    name: str = Field(..., max_length=120)

class FacilityUpdateIn(BaseModel):
    name: str = Field(..., max_length=120)

# ---- NEARBY PLACE ----
NearbyCategory = Literal["laundry", "minimarket", "makan", "transport", "lainnya"]

class NearbyPlaceIn(BaseModel):
    kost_id: int = 1
    category: NearbyCategory
    name: str = Field(..., max_length=160)
    address: str = ""
    distance_m: Optional[int] = Field(default=None, ge=0)
    maps_url: str = ""
    note: str = ""

class NearbyPlaceUpdateIn(BaseModel):
    category: Optional[NearbyCategory] = None
    name: Optional[str] = Field(default=None, max_length=160)
    address: Optional[str] = None
    distance_m: Optional[int] = Field(default=None, ge=0)
    maps_url: Optional[str] = None
    note: Optional[str] = None

# ---- RULE ----
class RuleIn(BaseModel):
    kost_id: int = 1
    title: str = Field(..., max_length=120)
    description: str

class RuleUpdateIn(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = None

# =========================
# Auth
# =========================
@app.post("/api/admin/login")
def admin_login(payload: AdminLoginIn):
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")

    if payload.username != admin_user or payload.password != admin_pass:
        raise HTTPException(status_code=401, detail="Invalid username/password")

    token = os.getenv("ADMIN_TOKEN", "supersecret123")
    return {"ok": True, "token": token}

# =========================
# Health
# =========================
@app.get("/api/health")
def health():
    return {"ok": True}

# =========================
# Public endpoints (landing/chatbot)
# =========================
@app.get("/api/public/kost")
def public_kost(db: Session = Depends(get_db), kost_id: int = Query(1)):
    row = db.execute(
        text("""
            SELECT name, address, whatsapp, google_maps_url, visiting_hours
            FROM kost
            WHERE id = :kost_id
            LIMIT 1
        """),
        {"kost_id": kost_id},
    ).mappings().first()

    if not row:
        return {
            "name": "Kost Binara",
            "address": "Alamat belum diisi di database.",
            "whatsapp": "",
            "google_maps_url": "",
            "visiting_hours": "",
        }

    return {k: json_safe(v) for k, v in dict(row).items()}

@app.get("/api/public/rooms")
def public_rooms(db: Session = Depends(get_db), kost_id: int = Query(1)):
    rows = db.execute(
        text("""
            SELECT id, kost_id, code, price_monthly, deposit, electricity_included, electricity_note,
                   size_m2, is_available, notes
            FROM room
            WHERE kost_id = :kost_id
            ORDER BY is_available DESC, id DESC
        """),
        {"kost_id": kost_id},
    ).mappings().all()

    result = []
    for r in rows:
        d = dict(r)
        # facilities
        fac = db.execute(
            text("""
                SELECT f.id, f.name
                FROM room_facility rf
                JOIN facility f ON f.id = rf.facility_id
                WHERE rf.room_id = :room_id
                ORDER BY f.name ASC
            """),
            {"room_id": d["id"]},
        ).mappings().all()
        d["facilities"] = [dict(x) for x in fac]
        d = {k: json_safe(v) for k, v in d.items()}
        result.append(d)

    return {"items": result}

@app.get("/api/public/nearby")
def public_nearby(db: Session = Depends(get_db), kost_id: int = Query(1)):
    rows = db.execute(
        text("""
            SELECT id, kost_id, category, name, address, distance_m, maps_url, note
            FROM nearby_place
            WHERE kost_id = :kost_id
            ORDER BY category ASC, COALESCE(distance_m, 999999) ASC, id DESC
        """),
        {"kost_id": kost_id},
    ).mappings().all()
    return {"items": [{k: json_safe(v) for k, v in dict(r).items()} for r in rows]}

@app.get("/api/public/rules")
def public_rules(db: Session = Depends(get_db), kost_id: int = Query(1)):
    rows = db.execute(
        text("""
            SELECT id, kost_id, title, description
            FROM rule
            WHERE kost_id = :kost_id
            ORDER BY id ASC
        """),
        {"kost_id": kost_id},
    ).mappings().all()
    return {"items": [{k: json_safe(v) for k, v in dict(r).items()} for r in rows]}

# =========================
# Chatbot Endpoint
# =========================
@app.post("/api/chat")
def chat(payload: ChatIn, db: Session = Depends(get_db)):
    g = classify(payload.message)

    if not g.in_scope:
        return {
            "answer": (
                "Aku fokus bantu info seputar Kost Binara ya 🙂\n\n"
                "Contoh: kamar tersedia, harga, fasilitas, aturan, pembayaran, kontak/alamat, laundry terdekat."
            ),
            "intent": g.intent,
            "in_scope": False,
        }

    ctx = fetch_context(db, intent=g.intent, kost_id=1)

    try:
        answer = generate_answer(payload.message, ctx)
    except Exception:
        answer = (
            "Maaf, sistem AI lagi sibuk/kuota habis 🙏\n\n"
            "Tapi aku masih bisa bantu info dasar: alamat, WA pemilik, jam kunjungan."
        )

    return {"answer": answer, "intent": g.intent, "in_scope": True}

# ==========================================================
# ===================== ADMIN ENDPOINTS =====================
# ==========================================================

# ---------- Admin: kost ----------
@app.get("/api/admin/kost")
def admin_get_kost(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    kost_id: int = Query(1),
):
    require_admin(authorization)

    row = db.execute(
        text("""
            SELECT id, name, address, whatsapp, google_maps_url, visiting_hours
            FROM kost
            WHERE id = :kost_id
            LIMIT 1
        """),
        {"kost_id": kost_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Kost not found")

    return {k: json_safe(v) for k, v in dict(row).items()}

@app.put("/api/admin/kost")
def admin_update_kost(
    payload: KostUpdateIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    kost_id: int = Query(1),
):
    require_admin(authorization)

    db.execute(
        text("""
            UPDATE kost
            SET
              name = :name,
              address = :address,
              whatsapp = :whatsapp,
              google_maps_url = :google_maps_url,
              visiting_hours = :visiting_hours
            WHERE id = :kost_id
        """),
        {**payload.model_dump(), "kost_id": kost_id},
    )
    db.commit()
    return {"ok": True}

# ---------- Admin: facility ----------
@app.get("/api/admin/facilities")
def admin_list_facilities(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    page: int = Query(1),
    page_size: int = Query(10),
):
    require_admin(authorization)
    offset, limit = paginate(page, page_size)

    total = db.execute(text("SELECT COUNT(*) AS c FROM facility")).mappings().first()["c"]
    rows = db.execute(
        text("""
            SELECT id, name
            FROM facility
            ORDER BY name ASC
            LIMIT :limit OFFSET :offset
        """),
        {"limit": limit, "offset": offset},
    ).mappings().all()

    return {
        "items": [dict(r) for r in rows],
        "page": page,
        "page_size": limit,
        "total": total,
    }

@app.post("/api/admin/facilities")
def admin_create_facility(
    payload: FacilityIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    try:
        db.execute(
            text("INSERT INTO facility (name) VALUES (:name)"),
            {"name": payload.name.strip()},
        )
        db.commit()
    except Exception as e:
        # duplicate name biasanya meledak di unique key
        raise HTTPException(status_code=400, detail=f"Gagal create facility: {str(e)}")

    return {"ok": True}

@app.put("/api/admin/facilities/{facility_id}")
def admin_update_facility(
    facility_id: int,
    payload: FacilityUpdateIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    res = db.execute(
        text("UPDATE facility SET name = :name WHERE id = :id LIMIT 1"),
        {"name": payload.name.strip(), "id": facility_id},
    )
    db.commit()

    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Facility not found")

    return {"ok": True}

@app.delete("/api/admin/facilities/{facility_id}")
def admin_delete_facility(
    facility_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    try:
        res = db.execute(
            text("DELETE FROM facility WHERE id = :id LIMIT 1"),
            {"id": facility_id},
        )
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal delete facility (mungkin masih dipakai kamar): {str(e)}")

    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Facility not found")

    return {"ok": True}

# ---------- Admin: rooms (with room_facility) ----------
@app.get("/api/admin/rooms")
def admin_list_rooms(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    kost_id: int = Query(1),
    page: int = Query(1),
    page_size: int = Query(10),
):
    require_admin(authorization)
    offset, limit = paginate(page, page_size)

    total = db.execute(
        text("SELECT COUNT(*) AS c FROM room WHERE kost_id = :kost_id"),
        {"kost_id": kost_id},
    ).mappings().first()["c"]

    rows = db.execute(
        text("""
            SELECT id, kost_id, code, price_monthly, deposit, electricity_included, electricity_note,
                   size_m2, is_available, notes
            FROM room
            WHERE kost_id = :kost_id
            ORDER BY is_available DESC, id DESC
            LIMIT :limit OFFSET :offset
        """),
        {"kost_id": kost_id, "limit": limit, "offset": offset},
    ).mappings().all()

    items = []
    for r in rows:
        d = dict(r)
        fac = db.execute(
            text("""
                SELECT f.id, f.name
                FROM room_facility rf
                JOIN facility f ON f.id = rf.facility_id
                WHERE rf.room_id = :room_id
                ORDER BY f.name ASC
            """),
            {"room_id": d["id"]},
        ).mappings().all()
        d["facilities"] = [dict(x) for x in fac]
        d = {k: json_safe(v) for k, v in d.items()}
        items.append(d)

    return {"items": items, "page": page, "page_size": limit, "total": total}

@app.post("/api/admin/rooms")
def admin_create_room(
    payload: RoomIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    # insert room
    db.execute(
        text("""
            INSERT INTO room
              (kost_id, code, price_monthly, deposit, electricity_included, electricity_note,
               size_m2, is_available, notes)
            VALUES
              (:kost_id, :code, :price_monthly, :deposit, :electricity_included, :electricity_note,
               :size_m2, :is_available, :notes)
        """),
        {
            "kost_id": payload.kost_id,
            "code": payload.code.strip(),
            "price_monthly": payload.price_monthly,
            "deposit": payload.deposit,
            "electricity_included": 1 if payload.electricity_included else 0,
            "electricity_note": payload.electricity_note or "",
            "size_m2": payload.size_m2,
            "is_available": 1 if payload.is_available else 0,
            "notes": payload.notes or "",
        },
    )

    # get last inserted id
    room_id = db.execute(text("SELECT LAST_INSERT_ID() AS id")).mappings().first()["id"]

    # facilities
    if payload.facility_ids:
        for fid in payload.facility_ids:
            db.execute(
                text("INSERT INTO room_facility (room_id, facility_id) VALUES (:room_id, :facility_id)"),
                {"room_id": room_id, "facility_id": fid},
            )

    db.commit()
    return {"ok": True, "id": room_id}

@app.put("/api/admin/rooms/{room_id}")
def admin_update_room(
    room_id: int,
    payload: RoomUpdateIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        return {"ok": True, "message": "No changes"}

    sets = []
    params: dict[str, Any] = {"room_id": room_id}

    # normal fields
    if "code" in fields:
        sets.append("code = :code")
        params["code"] = (fields["code"] or "").strip()

    if "price_monthly" in fields:
        sets.append("price_monthly = :price_monthly")
        params["price_monthly"] = fields["price_monthly"]

    if "deposit" in fields:
        sets.append("deposit = :deposit")
        params["deposit"] = fields["deposit"]

    if "electricity_included" in fields:
        sets.append("electricity_included = :electricity_included")
        params["electricity_included"] = 1 if fields["electricity_included"] else 0

    if "electricity_note" in fields:
        sets.append("electricity_note = :electricity_note")
        params["electricity_note"] = fields["electricity_note"] or ""

    if "size_m2" in fields:
        sets.append("size_m2 = :size_m2")
        params["size_m2"] = fields["size_m2"]

    if "is_available" in fields:
        sets.append("is_available = :is_available")
        params["is_available"] = 1 if fields["is_available"] else 0

    if "notes" in fields:
        sets.append("notes = :notes")
        params["notes"] = fields["notes"] or ""

    if sets:
        sql = f"UPDATE room SET {', '.join(sets)} WHERE id = :room_id LIMIT 1"
        res = db.execute(text(sql), params)
        if res.rowcount == 0:
            db.commit()
            raise HTTPException(status_code=404, detail="Room not found")

    # facilities replace
    if "facility_ids" in fields and fields["facility_ids"] is not None:
        db.execute(text("DELETE FROM room_facility WHERE room_id = :room_id"), {"room_id": room_id})
        for fid in fields["facility_ids"]:
            db.execute(
                text("INSERT INTO room_facility (room_id, facility_id) VALUES (:room_id, :facility_id)"),
                {"room_id": room_id, "facility_id": fid},
            )

    db.commit()
    return {"ok": True}

@app.delete("/api/admin/rooms/{room_id}")
def admin_delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    db.execute(text("DELETE FROM room_facility WHERE room_id = :room_id"), {"room_id": room_id})
    res = db.execute(text("DELETE FROM room WHERE id = :room_id LIMIT 1"), {"room_id": room_id})
    db.commit()

    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Room not found")

    return {"ok": True}

# ---------- Admin: nearby_place ----------
@app.get("/api/admin/nearby")
def admin_list_nearby(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    kost_id: int = Query(1),
    category: Optional[NearbyCategory] = Query(default=None),
    page: int = Query(1),
    page_size: int = Query(10),
):
    require_admin(authorization)
    offset, limit = paginate(page, page_size)

    where = "WHERE kost_id = :kost_id"
    params: dict[str, Any] = {"kost_id": kost_id, "limit": limit, "offset": offset}
    if category:
        where += " AND category = :category"
        params["category"] = category

    total = db.execute(
        text(f"SELECT COUNT(*) AS c FROM nearby_place {where}"),
        params,
    ).mappings().first()["c"]

    rows = db.execute(
        text(f"""
            SELECT id, kost_id, category, name, address, distance_m, maps_url, note
            FROM nearby_place
            {where}
            ORDER BY category ASC, COALESCE(distance_m, 999999) ASC, id DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    ).mappings().all()

    return {
        "items": [{k: json_safe(v) for k, v in dict(r).items()} for r in rows],
        "page": page,
        "page_size": limit,
        "total": total,
    }

@app.post("/api/admin/nearby")
def admin_create_nearby(
    payload: NearbyPlaceIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    db.execute(
        text("""
            INSERT INTO nearby_place (kost_id, category, name, address, distance_m, maps_url, note)
            VALUES (:kost_id, :category, :name, :address, :distance_m, :maps_url, :note)
        """),
        {
            "kost_id": payload.kost_id,
            "category": payload.category,
            "name": payload.name.strip(),
            "address": payload.address or "",
            "distance_m": payload.distance_m,
            "maps_url": payload.maps_url or "",
            "note": payload.note or "",
        },
    )
    db.commit()
    new_id = db.execute(text("SELECT LAST_INSERT_ID() AS id")).mappings().first()["id"]
    return {"ok": True, "id": new_id}

@app.put("/api/admin/nearby/{place_id}")
def admin_update_nearby(
    place_id: int,
    payload: NearbyPlaceUpdateIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        return {"ok": True, "message": "No changes"}

    sets = []
    params: dict[str, Any] = {"id": place_id}
    for k, v in fields.items():
        sets.append(f"{k} = :{k}")
        params[k] = (v.strip() if isinstance(v, str) else v)

    sql = f"UPDATE nearby_place SET {', '.join(sets)} WHERE id = :id LIMIT 1"
    res = db.execute(text(sql), params)
    db.commit()

    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Nearby place not found")
    return {"ok": True}

@app.delete("/api/admin/nearby/{place_id}")
def admin_delete_nearby(
    place_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    res = db.execute(text("DELETE FROM nearby_place WHERE id = :id LIMIT 1"), {"id": place_id})
    db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Nearby place not found")
    return {"ok": True}

# ---------- Admin: rule ----------
@app.get("/api/admin/rules")
def admin_list_rules(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    kost_id: int = Query(1),
    page: int = Query(1),
    page_size: int = Query(10),
):
    require_admin(authorization)
    offset, limit = paginate(page, page_size)

    total = db.execute(
        text("SELECT COUNT(*) AS c FROM rule WHERE kost_id = :kost_id"),
        {"kost_id": kost_id},
    ).mappings().first()["c"]

    rows = db.execute(
        text("""
            SELECT id, kost_id, title, description
            FROM rule
            WHERE kost_id = :kost_id
            ORDER BY id ASC
            LIMIT :limit OFFSET :offset
        """),
        {"kost_id": kost_id, "limit": limit, "offset": offset},
    ).mappings().all()

    return {
        "items": [{k: json_safe(v) for k, v in dict(r).items()} for r in rows],
        "page": page,
        "page_size": limit,
        "total": total,
    }

@app.post("/api/admin/rules")
def admin_create_rule(
    payload: RuleIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    db.execute(
        text("""
            INSERT INTO rule (kost_id, title, description)
            VALUES (:kost_id, :title, :description)
        """),
        {
            "kost_id": payload.kost_id,
            "title": payload.title.strip(),
            "description": payload.description,
        },
    )
    db.commit()
    new_id = db.execute(text("SELECT LAST_INSERT_ID() AS id")).mappings().first()["id"]
    return {"ok": True, "id": new_id}

@app.put("/api/admin/rules/{rule_id}")
def admin_update_rule(
    rule_id: int,
    payload: RuleUpdateIn,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)

    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        return {"ok": True, "message": "No changes"}

    sets = []
    params: dict[str, Any] = {"id": rule_id}
    for k, v in fields.items():
        sets.append(f"{k} = :{k}")
        params[k] = (v.strip() if isinstance(v, str) else v)

    sql = f"UPDATE rule SET {', '.join(sets)} WHERE id = :id LIMIT 1"
    res = db.execute(text(sql), params)
    db.commit()

    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"ok": True}

@app.delete("/api/admin/rules/{rule_id}")
def admin_delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    require_admin(authorization)
    res = db.execute(text("DELETE FROM rule WHERE id = :id LIMIT 1"), {"id": rule_id})
    db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"ok": True}
