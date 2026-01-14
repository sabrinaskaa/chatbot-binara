import os
from sqlalchemy.orm import Session
from app.ai.intent_ml import predict_intent
from app.ai.memory import memory_store
from app.ai import tools
from app.ai.tool_router import gemini_tool_decide, run_tool
from app.ai.providers.gemini_client import gemini_generate

def chat(message: str, db: Session, session_id: str) -> str:
    memory_store.add(session_id, "user", message)

    intent, conf = predict_intent(message)

    # 1) Grounded DB intent
    if intent == "check_availability" and conf >= 0.35:
        reply = tools.list_available_rooms(db, room_type=None)
        memory_store.add(session_id, "bot", reply)
        return reply

    if intent == "ask_price" and conf >= 0.55:
        reply = "Harga tergantung tipe: single biasanya lebih murah dari sharing. Tulis: 'kamar kosong sharing' biar aku list plus harganya."
        memory_store.add(session_id, "bot", reply)
        return reply

    # 2) Action intent -> Gemini decide tool (biar parsing nama/tanggal lebih kuat)
    use_gemini = os.getenv("USE_GEMINI_FALLBACK", "true").lower() == "true"
    if use_gemini and (intent in ("book_visit","create_ticket") or conf < 0.55):
        tool_call = gemini_tool_decide(message)
        reply = run_tool(db, tool_call) if tool_call.get("tool") != "none" else tool_call.get("answer","")
        memory_store.add(session_id, "bot", reply)
        return reply

    # 3) General fallback Gemini with short context
    if use_gemini:
        mem = memory_store.get(session_id).turns
        context = "\n".join([f"{t.role}: {t.text}" for t in mem[-6:]])
        prompt = (
            "Kamu asisten Binara Kost. Jawab singkat, jelas, sopan.\n"
            "Konteks chat:\n"
            f"{context}\n"
            f"User: {message}"
        )
        reply = gemini_generate(prompt)
        memory_store.add(session_id, "bot", reply)
        return reply

    reply = "Aku belum paham. Coba tanya tentang kamar kosong, harga, booking survey, atau komplain ya."
    memory_store.add(session_id, "bot", reply)
    return reply
