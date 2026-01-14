import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.ai.providers.gemini_client import gemini_generate
from app.ai import tools

TOOL_SCHEMA = """
Kamu boleh memilih salah satu tool berikut. Output WAJIB JSON saja (tanpa markdown).
Tools:
1) list_available_rooms {"tool":"list_available_rooms","room_type":"single|sharing|null"}
2) create_visit {"tool":"create_visit","name":"...","phone":"...","preferred_date":"YYYY-MM-DD"}
3) create_ticket {"tool":"create_ticket","room_code":"A1","description":"..."}
4) check_unpaid {"tool":"check_unpaid","phone":"..."}
Jika tidak perlu tool, output:
{"tool":"none","answer":"..."}
"""

def run_tool(db: Session, tool_call: dict) -> str:
    tool = tool_call.get("tool","none")

    try:
        if tool == "create_visit":
            name = tool_call.get("name","").strip()
            phone = tool_call.get("phone","").strip()
            d = tool_call.get("preferred_date","").strip()
            preferred_date = datetime.strptime(d, "%Y-%m-%d").date()
            return tools.create_visit(db, name=name, phone=phone, preferred_date=preferred_date)

        if tool == "create_ticket":
            room_code = tool_call.get("room_code","").strip()
            desc = tool_call.get("description","").strip()
            return tools.create_ticket(db, room_code=room_code, description=desc)

        if tool == "list_available_rooms":
            return tools.list_available_rooms(db, room_type=tool_call.get("room_type"))

        if tool == "check_unpaid":
            return tools.check_unpaid(db, phone=tool_call.get("phone","").strip())

    except Exception as e:
        return f"Tool error ({tool}): {type(e).__name__}: {e}"

    return tool_call.get("answer","Aku belum paham. Coba ulangin ya.")
