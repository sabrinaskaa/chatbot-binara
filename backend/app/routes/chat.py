# backend/app/routes/chat.py
from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.intent_classifier import IntentClassifier
from app.services.response_generator import generate_response

router = APIRouter(tags=["chat"])
classifier = IntentClassifier()


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # predict() sekarang pasti return 2 value
    intent, confidence = classifier.predict(req.message)

    reply = generate_response(
        intent=intent,
        message=req.message,
        confidence=confidence,
    )

    return {"intent": intent, "reply": reply}
