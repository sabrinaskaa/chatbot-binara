from fastapi import APIRouter
from pydantic import BaseModel

from app.services.intent_classifier import IntentClassifier
from app.services.response_generator import generate_response

router = APIRouter()
classifier = IntentClassifier()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    intent: str
    reply: str

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    intent = classifier.predict(request.message)
    reply = generate_response(intent)

    return {
        "intent": intent,
        "reply": reply
    }
