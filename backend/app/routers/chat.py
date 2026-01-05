from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.chat import ChatRequest, ChatResponse
from app.routers.deps import get_db
from app.ai.orchestrator import chat as chat_core

from app.services.response_generator import generate_response

router = APIRouter()

# ⬇️ WAJIB DIBUAT
from app.services.intent_classifier import IntentClassifier
classifier = IntentClassifier()

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    intent, confidence = classifier.predict(req.message)

    reply = generate_response(
        intent=intent,
        message=req.message,
        confidence=confidence
    )

    return {
        "intent": intent,
        "reply": reply
    }