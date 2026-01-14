from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.intent_classifier import IntentClassifier
from app.services.response_generator import generate_response
from app.database import get_db

router = APIRouter(tags=["chat"])
classifier = IntentClassifier()


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    intent, confidence = classifier.predict(req.message)

    reply = generate_response(
        intent=intent,
        message=req.message,
        confidence=confidence,
        db=db,  # ⬅️ INI PENTING
    )

    return {
        "intent": intent,
        "reply": reply,
    }
