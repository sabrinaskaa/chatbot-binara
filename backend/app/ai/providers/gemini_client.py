# backend/app/ai/gemini_client.py
import os
from google import genai


def ask_gemini(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        # jangan error 500, balikin pesan yang manusiawi
        return "Maaf, fitur AI (Gemini) belum diaktifkan."

    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model=model,
            contents=prompt,
        )
        text = getattr(resp, "text", None)
        return (text or "").strip() or "Maaf, Gemini tidak memberikan jawaban."
    except Exception:
        return "Maaf, terjadi gangguan saat menghubungi Gemini."
