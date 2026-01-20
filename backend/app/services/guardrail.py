import os
import re
from typing import Literal
from pydantic import BaseModel
from google import genai
from google.genai.errors import ClientError

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

Intent = Literal[
  "alamat", "kamar_tersedia", "harga", "fasilitas", "kontak",
  "pembayaran", "biaya_tambahan", "aturan", "tipe_kost",
  "laundry_terdekat", "lainnya"
]

class GuardrailResult(BaseModel):
  in_scope: bool
  intent: Intent

SYSTEM = """
Lo classifier ketat untuk chatbot Kost Binara.

BOLEH: pertanyaan tentang Kost Binara (alamat, kamar, harga, fasilitas, aturan, pembayaran, biaya tambahan, kontak, tipe kost, laundry terdekat).
TOLAK: pertanyaan di luar itu (politik, pelajaran umum, coding umum, kos lain, dll).
Kalau user nanya "banjir", itu dianggap OUT OF SCOPE (fitur banjir belum tersedia).
Balas harus JSON sesuai schema: { "in_scope": true/false, "intent": "..." }
"""

def classify(question: str) -> GuardrailResult:
  try:
    resp = client.models.generate_content(
      model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
      contents=question,
      config={
        "system_instruction": SYSTEM,
        "response_mime_type": "application/json",
        "response_schema": GuardrailResult,
        "temperature": 0.0,
      },
    )
    return resp.parsed

  except ClientError as e:
    # Quota / rate limit
    if getattr(e, "status_code", None) == 429 or "RESOURCE_EXHAUSTED" in str(e):
      # fallback lokal: jangan bikin server 500
      return local_classify(question)

    raise

def local_classify(q: str) -> GuardrailResult:
  s = q.lower()

  # out of scope keywords
  oos = [
    "politik", "presiden", "drakor", "minecraft", "tugas", "koding", "python",
    "nextjs", "skripsi", "matematika", "crypto", "game", "film"
  ]
  if any(k in s for k in oos):
    return GuardrailResult(in_scope=False, intent="lainnya")

  # banjir: lo bilang belum dipakai => out of scope
  if "banjir" in s:
    return GuardrailResult(in_scope=False, intent="lainnya")

  # intents sederhana
  if any(k in s for k in ["alamat", "lokasi", "jalan", "dimana"]):
    return GuardrailResult(in_scope=True, intent="alamat")

  if any(k in s for k in ["wa", "whatsapp", "kontak", "nomor", "telp", "telepon"]):
    return GuardrailResult(in_scope=True, intent="kontak")

  if any(k in s for k in ["kamar", "tersedia", "kosong"]):
    return GuardrailResult(in_scope=True, intent="kamar_tersedia")

  if any(k in s for k in ["harga", "biaya", "sewa", "rp"]):
    return GuardrailResult(in_scope=True, intent="harga")

  if any(k in s for k in ["fasilitas", "ac", "wifi", "kamar mandi", "kasur"]):
    return GuardrailResult(in_scope=True, intent="fasilitas")

  if any(k in s for k in ["aturan", "peraturan", "jam malam", "tamu", "rokok"]):
    return GuardrailResult(in_scope=True, intent="aturan")

  if any(k in s for k in ["bayar", "bulanan", "tahunan", "deposit", "listrik"]):
    return GuardrailResult(in_scope=True, intent="pembayaran")

  if "laundry" in s:
    return GuardrailResult(in_scope=True, intent="laundry_terdekat")

  return GuardrailResult(in_scope=True, intent="lainnya")