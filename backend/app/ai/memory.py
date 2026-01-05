from dataclasses import dataclass, field
from typing import Dict, List

@dataclass
class Turn:
    role: str
    text: str

@dataclass
class SessionMemory:
    turns: List[Turn] = field(default_factory=list)

class MemoryStore:
    def __init__(self):
        self._store: Dict[str, SessionMemory] = {}

    def get(self, session_id: str) -> SessionMemory:
        if session_id not in self._store:
            self._store[session_id] = SessionMemory()
        return self._store[session_id]

    def add(self, session_id: str, role: str, text: str):
        mem = self.get(session_id)
        mem.turns.append(Turn(role=role, text=text))
        mem.turns = mem.turns[-10:]

memory_store = MemoryStore()
