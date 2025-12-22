import os, sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.room import Room

db = SessionLocal()

db.add_all([
    Room(code="A1", type="single", price=900000,
         facilities={"ac": True}, status="available"),
    Room(code="A2", type="single", price=850000,
         facilities={"ac": False}, status="occupied"),
])

db.commit()
print("Seed done")
