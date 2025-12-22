def detect_intent(text: str) -> str:
    t = text.lower()
    if ("kamar" in t and "kosong" in t) or "available" in t:
        return "check_room"
    if "harga" in t or "price" in t:
        return "ask_price"
    if "booking" in t or "survey" in t or "lihat kamar" in t:
        return "book_visit"
    if "komplain" in t or "rusak" in t or "bocor" in t:
        return "ticket"
    return "general"
