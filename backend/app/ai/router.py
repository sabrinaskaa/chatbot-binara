import os
from sqlalchemy.orm import Session
from app.ai.agent import chat_agent
from app.ai.providers.gemini_client import gemini_generate

def should_fallback_to_gemini(message: str, internal_reply: str) -> bool:
    # Internal bot punya jawaban default “Halo! ...” atau “Coba bilang...”
    # Kalau kebanyakan generic, lempar ke Gemini.
    low_value_markers = [
        "Halo! Gue bisa bantu",
        "Coba bilang",
        "Maaf",
    ]
    if any(m in internal_reply for m in low_value_markers):
        return True

    # Pertanyaan general yang gak ada hubungannya sama kost/DB → Gemini
    general_markers = ["cara", "kenapa", "jelasin", "apa itu", "bedanya", "contoh"]
    if any(g in message.lower() for g in general_markers) and "kamar" not in message.lower():
        return True

    return False

def chat_router(message: str, db: Session) -> str:
    internal = chat_agent(message, db)

    use_gemini = os.getenv("USE_GEMINI_FALLBACK", "true").lower() == "true"
    if use_gemini and should_fallback_to_gemini(message, internal):
        # kasih konteks minimal biar jawabannya tetap relevan sama “Binara Kost”
        prompt = (
            "Kamu adalah asisten untuk Binara Kost. "
            "Jawab singkat, jelas, dan sopan. "
            f"Pertanyaan: {message}"
        )
        return gemini_generate(prompt)

    return internal
