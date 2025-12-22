import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

def gemini_generate(text: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Gemini API key belum diset."
    
    client = genai.Client()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    try:
        resp = client.models.generate_content(
            model=model,
            contents=text,
        )
        return getattr(resp, "text", None) or "Tidak ada respon dari Gemini."
    except Exception as e:
        return f"(Gemini error) {e}"
