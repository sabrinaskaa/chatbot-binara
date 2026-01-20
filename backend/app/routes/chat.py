from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.guardrail import classify
from app.services.answer import fetch_context
from app.services.gemini import generate_answer

router = APIRouter()

class ChatIn(BaseModel):
    message: str

@router.post("/chat")
def chat(payload: ChatIn, db: Session = Depends(get_db)):
    g = classify(payload.message)

    if not g.in_scope:
        return {
            "answer": "Saya cuma bisa bantu hal-hal tentang Kost Binara ya. "
                      "Anda bisa bertanya mengenai kamar yang tersedia, harga, fasilitas, aturan, pembayaran, laundry terdekat."
        }

    ctx = fetch_context(db, intent=g.intent, kost_id=1)
    answer = generate_answer(payload.message, ctx)
    return {"answer": answer, "intent": g.intent}