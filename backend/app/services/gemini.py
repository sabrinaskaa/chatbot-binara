import os
import json
from google import genai
from google.genai.errors import ClientError

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM = """
Kamu adalah asisten Kost Binara. Jawab hanya berdasarkan CONTEXT.
Kalau data tidak ada di context, bilang tidak tersedia dan sarankan hubungi pemilik kost.
Jawaban harus jelas, tidak terlalu singkat, dan pakai bahasa Indonesia natural.
"""

def generate_answer(question: str, context: dict) -> str:
    ctx_json = json.dumps(context, ensure_ascii=False, default=str)

    prompt = f"""
CONTEXT (JSON):
{ctx_json}

USER QUESTION:
{question}

INSTRUKSI:
- Jawab hanya pakai info dari CONTEXT.
- Kalau tidak ada datanya, bilang "datanya belum tersedia".
- Jawaban informatif, boleh bullet.
"""

    try:
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=prompt,
            config={"system_instruction": SYSTEM, "temperature": 0.3},
        )
        return getattr(resp, "text", None) or str(resp)

    except ClientError as e:
        if getattr(e, "status_code", None) == 429 or "RESOURCE_EXHAUSTED" in str(e):
            return fallback_answer(question, context)
        raise

def fallback_answer(question: str, context: dict) -> str:
    kost = context.get("kost") or {}
    rooms = context.get("rooms") or []
    rules = context.get("rules") or []
    payments = context.get("payments") or []
    laundry = context.get("nearby_laundry") or []

    lines = []
    if kost:
        lines.append(f"**{kost.get('name','Kost Binara')}**")
        if kost.get("address"): lines.append(f"📍 Alamat: {kost['address']}")
        if kost.get("whatsapp"): lines.append(f"💬 WhatsApp: {kost['whatsapp']}")
        if kost.get("google_maps_url"): lines.append(f"🗺️ Maps: {kost['google_maps_url']}")
        if kost.get("visiting_hours"): lines.append(f"🕘 Jam kunjungan: {kost['visiting_hours']}")
        lines.append("")

    if rooms:
        lines.append("🏠 **Kamar (ringkas):**")
        for r in rooms[:6]:
            code = r.get("code","-")
            price = r.get("price_monthly") or r.get("price") or ""
            fac = r.get("facilities") or ""
            avail = "Tersedia" if r.get("is_available") else "Penuh"
            lines.append(f"- {code} — {avail} — {price} {('• '+fac) if fac else ''}")
        lines.append("")

    if rules:
        lines.append("📌 **Aturan (ringkas):**")
        for rr in rules[:6]:
            lines.append(f"- {rr.get('title','-')}: {rr.get('description','')}".strip())
        lines.append("")

    if payments:
        lines.append("💳 **Pembayaran:**")
        for p in payments[:6]:
            lines.append(f"- {p.get('scheme','-')}: {p.get('description','')}".strip())
        lines.append("")

    if laundry:
        lines.append("🧺 **Laundry terdekat:**")
        for x in laundry[:5]:
            d = f"{x.get('distance_m')} m" if x.get("distance_m") else ""
            lines.append(f"- {x.get('name','-')} • {d} • {x.get('address','')}".strip())
        lines.append("")

    if not lines:
        return "Quota Gemini lagi habis, dan data kost di database belum tersedia. Isi tabel kost/room dulu ya."

    return "\n".join(lines)