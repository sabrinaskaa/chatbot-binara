from sqlalchemy.orm import Session
from app.models.room import Room
from app.ai.providers.gemini_client import ask_gemini


def generate_response(
    intent: str,
    message: str,
    confidence: float,
    db: Session,
) -> str:

    # ==========================
    # INTENT: CEK KAMAR KOSONG
    # ==========================
    if intent == "check_availability" and confidence >= 0.4:
        rooms = (
            db.query(Room)
            .filter(Room.status == "available")
            .all()
        )

        if not rooms:
            context = "Saat ini tidak ada kamar kosong."
        else:
            context = "\n".join(
                f"- Kamar {r.code}, tipe {r.type}, harga Rp{r.price:,}/bulan"
                for r in rooms
            )

        prompt = f"""
Kamu adalah chatbot resmi Binara Kost.
Gunakan data berikut untuk menjawab pertanyaan pengguna secara alami dan ramah.
JANGAN menambah data yang tidak ada.

DATA KAMAR:
{context}

Pertanyaan pengguna:
{message}
""".strip()

        return ask_gemini(prompt)

    # ==========================
    # INTENT: TANYA HARGA
    # ==========================
    if intent == "ask_price" and confidence >= 0.4:
        prices = db.query(Room.price).all()

        if not prices:
            context = "Data harga kamar belum tersedia."
        else:
            min_price = min(p[0] for p in prices)
            max_price = max(p[0] for p in prices)
            context = f"Harga kamar berkisar antara Rp{min_price:,} hingga Rp{max_price:,} per bulan."

        prompt = f"""
Kamu adalah chatbot resmi Binara Kost.
Gunakan informasi harga berikut untuk menjawab dengan sopan dan jelas.

DATA HARGA:
{context}

Pertanyaan pengguna:
{message}
""".strip()

        return ask_gemini(prompt)

    # ==========================
    # INTENT: TANYA FASILITAS
    # ==========================
    if intent == "ask_facilities" and confidence >= 0.4:
        context = """
Fasilitas Binara Kost:
- Kamar mandi dalam
- AC
- WiFi
- Area parkir
"""

        prompt = f"""
Gunakan daftar fasilitas berikut untuk menjawab dengan bahasa yang ramah dan informatif.
Jangan menambah fasilitas lain.

{context}

Pertanyaan pengguna:
{message}
""".strip()

        return ask_gemini(prompt)

    # ==========================
    # INTENT: TANYA LOKASI
    # ==========================
    if intent == "ask_location" and confidence >= 0.4:
        context = "Binara Kost berlokasi dekat area kampus dan mudah diakses."

        prompt = f"""
Gunakan informasi lokasi berikut untuk menjawab secara jelas dan singkat.

DATA LOKASI:
{context}

Pertanyaan pengguna:
{message}
""".strip()

        return ask_gemini(prompt)

    # ==========================
    # FALLBACK (PERTANYAAN UMUM)
    # ==========================
    prompt = f"""
Kamu adalah chatbot resmi Binara Kost.
Jawab pertanyaan pengguna dengan sopan dan membantu.
Jika pertanyaan di luar konteks kost, tidak usah dijawab atau jawab saja 'Maaf, kami tidak dapat melayani Anda di luar pertanyaan seputar kost' (contoh, tapi olah saja).
Jangan bilang ada promo karena kost ini tidak akan menyediakan promo dan semacamnya.

Pertanyaan pengguna:
{message}
""".strip()

    return ask_gemini(prompt)
