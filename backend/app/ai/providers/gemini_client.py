import os
from google import genai
from dotenv import load_dotenv

load_dotenv()  # ⬅️ INI WAJIB

def ask_gemini(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")

    if not api_key:
        return "Gemini API key belum diset."

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
        )
        return (response.text or "").strip() or "Gemini tidak memberikan jawaban."
    except Exception as e:
        # BUAT DEBUG (sementara)
        print("GEMINI ERROR:", e)
        return "Maaf, terjadi gangguan saat menghubungi Gemini."
