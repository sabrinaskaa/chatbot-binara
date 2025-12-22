from sqlalchemy.orm import Session
from app.models.room import Room

def tool_list_available_rooms(db: Session) -> str:
    rooms = db.query(Room).filter(Room.status == "available").order_by(Room.price.asc()).all()
    if not rooms:
        return "Saat ini kamar kosong belum ada. Mau gue bikinin request survey tanggal lain atau tanya admin?"

    lines = []
    for r in rooms[:5]:
        lines.append(f"- {r.code} ({r.type}) Rp{r.price}/bulan")
    if len(rooms) > 5:
        lines.append(f"...dan masih ada {len(rooms)-5} kamar lain.")
    return "Ini kamar yang lagi kosong:\n" + "\n".join(lines)
