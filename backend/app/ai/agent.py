from sqlalchemy.orm import Session
from app.ai.intent import detect_intent
from app.ai.tools import tool_list_available_rooms

def chat_agent(message: str, db: Session) -> str:
    intent = detect_intent(message)

    if intent == "check_room":
        return tool_list_available_rooms(db)

    if intent == "ask_price":
        return "Range harga tergantung tipe kamar. Coba bilang: 'kamar kosong yang termurah' atau sebut budget kamu."

    if intent == "book_visit":
        return "Bisa. Kirim format: NAMA, NO HP, TANGGAL (YYYY-MM-DD). Nanti gue buatkan visit request."

    if intent == "ticket":
        return "Boleh. Sebut kamar berapa dan masalahnya apa, contoh: 'kamar A2 AC bocor'."

    return "Halo! Gue bisa bantu cek kamar kosong, harga, booking survey, atau catat komplain."
