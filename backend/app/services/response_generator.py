# backend/app/services/response_generator.py
from app.ai.providers.gemini_client import ask_gemini


def generate_response(intent: str, message: str, confidence: float = 1.0) -> str:
    responses = {
        "check_availability": "Saat ini tersedia beberapa kamar kosong.",
        "ask_price": "Harga kamar mulai dari Rp900.000 per bulan.",
        "ask_facilities": "Fasilitas meliputi AC, WiFi, dan kamar mandi dalam.",
        "ask_location": "Lokasi kost berada dekat area kampus.",
    }

    # intent dikenal + yakin -> jawaban statis
    if intent in responses and confidence >= 0.4:
        return responses[intent]

    # fallback Gemini (intent unknown / confidence rendah)
    prompt = f"""
Kamu adalah chatbot resmi Binara Kost.
Jawab dengan bahasa Indonesia yang sopan, singkat, dan membantu.
Kalau pengguna bertanya soal kamar/harga/fasilitas/lokasi, jawab sebaik mungkin.

Pertanyaan pengguna:
{message}
""".strip()

    return ask_gemini(prompt)
