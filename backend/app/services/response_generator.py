def generate_response(intent: str) -> str:
    responses = {
        "cek_kamar": "Saat ini tersedia beberapa kamar kosong.",
        "tanya_harga": "Harga kamar mulai dari Rp900.000 per bulan.",
        "tanya_fasilitas": "Fasilitas meliputi AC, WiFi, dan kamar mandi dalam.",
        "tanya_lokasi": "Lokasi kost berada dekat area kampus."
    }

    return responses.get(
        intent,
        "Maaf, saya belum memahami pertanyaan Anda."
    )
