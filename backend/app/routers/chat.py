from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.chat import ChatRequest, ChatResponse
from app.routers.deps import get_db
from app.ai.router import chat_router

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    reply = chat_router(req.message, db)
    return {"reply": reply}
