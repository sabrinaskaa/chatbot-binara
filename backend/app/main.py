import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.routers import chat, room, tenant, payment, ticket, visit
app = FastAPI(title="Binara Kost Chatbot")

frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(room.router)
app.include_router(tenant.router)
app.include_router(payment.router)
app.include_router(ticket.router)
app.include_router(visit.router)

